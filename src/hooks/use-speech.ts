import { useSyncExternalStore } from 'react';
import * as Speech from 'expo-speech';

import { useTranslation } from '@/hooks/use-translation';
import { cloudSpeechConfigured, speakWithCloud, stopCloudSpeech } from '@/lib/cloud-speech';
import { getContent } from '@/lib/i18n/content';

// Read-aloud for any text in the app, in the selected language. One
// utterance at a time app-wide: starting a new one stops whatever was
// playing, so the per-section Listen buttons and the Home companion never
// talk over each other. Each caller passes a key identifying what it's
// reading, and gets back which key (if any) is currently speaking.

type Status = { speakingKey: string | null; missingVoiceKey: string | null };

let status: Status = { speakingKey: null, missingVoiceKey: null };
const listeners = new Set<() => void>();

function setStatus(next: Partial<Status>) {
  status = { ...status, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => status;

// Voice lists load asynchronously in some browsers, so an empty list gets
// one short retry before being treated as "unknown".
async function loadVoices(): Promise<Speech.Voice[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  if (voices.length > 0) return voices;
  await new Promise((r) => setTimeout(r, 400));
  return Speech.getAvailableVoicesAsync();
}

// A voice for the language (e.g. "kn-IN" matches "kn-IN", "kn_IN", "kn").
// Returns undefined when the device doesn't report its voices at all - then
// speaking is attempted anyway with just the language tag - and null when it
// does report them but none speaks this language, since a device's default
// (usually English) voice can't pronounce Kannada/Tamil/Telugu/Hindi script.
async function findVoice(languageTag: string): Promise<Speech.Voice | null | undefined> {
  const voices = await loadVoices().catch(() => [] as Speech.Voice[]);
  if (voices.length === 0) return undefined;
  const prefix = languageTag.split('-')[0].toLowerCase();
  const matches = voices.filter((v) => v.language.toLowerCase().replace('_', '-').split('-')[0] === prefix);
  if (matches.length === 0) return null;
  const exact = matches.filter((v) => v.language.toLowerCase().replace('_', '-') === languageTag.toLowerCase());
  const pool = exact.length > 0 ? exact : matches;
  return pool.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ?? pool[0];
}

// Emoji (🙏, 🔔, 🌕…) are decoration on screen but get read out as their
// names ("folded hands") by most voices.
function forSpeech(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Every speak/stop bumps this, so a request still in flight (fetching the
// online voice, looking up device voices) never starts talking after a
// newer tap or a Stop.
let generation = 0;

function stopAll() {
  generation++;
  Speech.stop();
  stopCloudSpeech();
  setStatus({ speakingKey: null });
}

// For unmount cleanup: stops only if `key` is still the one talking, so a
// screen closing never cuts off something another screen started since.
export function stopIfSpeaking(key: string) {
  if (status.speakingKey === key) stopAll();
}

export function useSpeech() {
  const { languageId } = useTranslation();
  const { speakingKey, missingVoiceKey } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // `inLanguage` overrides the selected language - e.g. the language picker
  // saying each language's own name in that language.
  const speak = async (key: string, text: string, inLanguage: string = languageId) => {
    stopAll();
    const gen = generation;
    const languageTag = getContent(inLanguage).speechLanguage;
    const spoken = forSpeech(text);
    const finished = () => {
      if (gen === generation && status.speakingKey === key) setStatus({ speakingKey: null });
    };

    // The online voice first when configured - it speaks every language the
    // app offers, the same on every phone (lib/cloud-speech.ts).
    if (cloudSpeechConfigured) {
      setStatus({ speakingKey: key, missingVoiceKey: null });
      try {
        await speakWithCloud(spoken, languageTag);
        finished();
        return;
      } catch (err) {
        console.warn('Online voice failed, falling back to the device voice', err);
        if (gen !== generation) return;
      }
    }

    const voice = await findVoice(languageTag);
    if (gen !== generation) return;
    if (voice === null) {
      setStatus({ speakingKey: null, missingVoiceKey: key });
      return;
    }
    setStatus({ speakingKey: key, missingVoiceKey: null });
    Speech.speak(spoken, {
      language: languageTag,
      voice: voice?.identifier,
      rate: 0.9,
      onDone: finished,
      onStopped: finished,
      onError: finished,
    });
  };

  const toggle = (key: string, text: string) => (speakingKey === key ? stopAll() : speak(key, text));

  return { speakingKey, missingVoiceKey, speak, stop: stopAll, toggle };
}
