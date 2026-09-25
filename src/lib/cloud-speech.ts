import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

// Natural-sounding read-aloud from Google Cloud Text-to-Speech, which has
// voices for every language the app offers - unlike phones' built-in voices
// (iPhones and Macs have none for Kannada, Tamil or Telugu). Used whenever an
// API key is configured; hooks/use-speech.ts falls back to the device voice
// when it isn't, or when a request fails (e.g. offline).
//
// The key is read from EXPO_PUBLIC_GOOGLE_TTS_API_KEY (.env.local locally,
// an EAS environment variable for builds). EXPO_PUBLIC_ values are bundled
// into the app, so restrict the key in Google Cloud to the Text-to-Speech API
// and to this app's bundle id / website.
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TTS_API_KEY;
const ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Google rejects input over 5000 bytes; Indian scripts are 3 bytes per
// character in UTF-8, so long pages are split into pieces played in turn.
const MAX_CHUNK_BYTES = 4500;

export const cloudSpeechConfigured = !!API_KEY;

function byteLength(text: string): number {
  let bytes = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

function splitForSynthesis(text: string): string[] {
  const chunks: string[] = [];
  let current = '';
  // Sentence-ish boundaries across the app's scripts: . ! ? । ॥ ; and newlines.
  const pieces = (text.match(/[^.!?।॥;\n]+[.!?।॥;\n]*/gu) ?? [text]).map((p) => p.trim()).filter(Boolean);
  for (const piece of pieces) {
    const candidate = current ? `${current} ${piece}` : piece;
    if (byteLength(candidate) <= MAX_CHUNK_BYTES) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = piece; // a single sentence over the limit is left to fail and fall back
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// djb2 - a stable short name for a cached clip
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Clips already fetched this session, by language + text. On phones they're
// also kept in the cache directory, so repeat listens work offline and don't
// count against the Google quota again.
const memoryCache = new Map<string, string>();

async function cachedFile(name: string) {
  const { File, Paths } = await import('expo-file-system');
  return new File(Paths.cache, name);
}

async function synthesize(text: string, languageTag: string): Promise<string> {
  const cacheKey = `${languageTag}:${text}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  const fileName = `tts-${languageTag}-${hash(cacheKey)}.mp3`;
  if (Platform.OS !== 'web') {
    const file = await cachedFile(fileName);
    if (file.exists) {
      memoryCache.set(cacheKey, file.uri);
      return file.uri;
    }
  }

  const response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: languageTag, ssmlGender: 'FEMALE' },
      // A little slower than normal - easier to follow for older listeners.
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.9 },
    }),
  });
  if (!response.ok) throw new Error(`Text-to-Speech ${response.status}: ${await response.text()}`);
  const { audioContent } = (await response.json()) as { audioContent: string };

  let uri: string;
  if (Platform.OS === 'web') {
    uri = `data:audio/mpeg;base64,${audioContent}`;
  } else {
    const file = await cachedFile(fileName);
    file.create({ overwrite: true });
    file.write(audioContent, { encoding: 'base64' });
    uri = file.uri;
  }
  memoryCache.set(cacheKey, uri);
  return uri;
}

let player: AudioPlayer | null = null;
let playback = 0; // bumps on every play/stop, so a stale clip never plays after Stop
let finishCurrent: (() => void) | null = null;

function getPlayer(): AudioPlayer {
  if (!player) player = createAudioPlayer(null);
  return player;
}

function playUri(uri: string, token: number): Promise<void> {
  return new Promise((resolve) => {
    const p = getPlayer();
    const finish = () => {
      subscription.remove();
      if (finishCurrent === finish) finishCurrent = null;
      resolve();
    };
    const subscription = p.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish || token !== playback) finish();
    });
    finishCurrent = finish;
    p.replace({ uri });
    p.play();
  });
}

// Speaks `text` and resolves once it has finished or been stopped. Throws if
// the first piece can't be fetched, so the caller can fall back to the device
// voice.
export async function speakWithCloud(text: string, languageTag: string): Promise<void> {
  const token = ++playback;
  const chunks = splitForSynthesis(text);
  const fetchChunk = (chunk: string) => {
    const promise = synthesize(chunk, languageTag);
    promise.catch(() => {}); // a prefetch abandoned by Stop shouldn't surface as unhandled
    return promise;
  };
  let next = fetchChunk(chunks[0]);
  for (let i = 0; i < chunks.length; i++) {
    const uri = await next;
    if (token !== playback) return;
    // Fetch the following piece while this one plays.
    if (i + 1 < chunks.length) next = fetchChunk(chunks[i + 1]);
    await playUri(uri, token);
    if (token !== playback) return;
  }
}

export function stopCloudSpeech() {
  playback++;
  player?.pause();
  finishCurrent?.();
}
