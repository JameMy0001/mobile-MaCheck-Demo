import { useCallback } from 'react';
import * as Speech from 'expo-speech';
import { useAppStore } from '../store/useAppStore';

export function useSound() {
  const isSoundMuted = useAppStore((state) => state.soundMuted);
  const setSoundMuted = useAppStore((state) => state.setSoundMuted);

  const handleSpeak = useCallback(
    (text: string) => {
      if (isSoundMuted) return;
      Speech.stop();
      Speech.speak(text, { language: 'th-TH', rate: 0.9 });
    },
    [isSoundMuted]
  );

  const toggleSound = useCallback(
    async (greeting = 'เปิดเสียงนำทางแล้วจ้า') => {
      const newValue = !isSoundMuted;
      await setSoundMuted(newValue);
      if (!newValue) {
        Speech.stop();
        Speech.speak(greeting, { language: 'th-TH', rate: 0.9 });
      } else {
        Speech.stop();
      }
    },
    [isSoundMuted, setSoundMuted]
  );

  const loadSoundSetting = useCallback(async () => {
    // No-op for backward compatibility
  }, []);

  return { isSoundMuted, handleSpeak, toggleSound, loadSoundSetting };
}
