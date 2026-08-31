import { useAudioPlayer } from 'expo-audio';

const NOTIFY_SOUND = require('@/assets/sounds/notify-on.wav');

// A short, original two-note chime played as positive confirmation whenever
// someone turns a reminder ON (never on turning one off, and never for
// unrelated taps like changing lead days) - see the call sites in
// NotifyPanel, LunarDaysCard, DivineCompanion, and the event detail screen.
export function useNotifySound() {
  const player = useAudioPlayer(NOTIFY_SOUND);

  return () => {
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // best-effort - a failed/missing sound should never block the actual toggle
    }
  };
}
