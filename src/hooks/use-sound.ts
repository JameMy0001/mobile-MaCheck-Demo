import { useCallback } from 'react';
import * as Speech from 'expo-speech';
import { useAppStore } from '../store/useAppStore';
import { translateDynamicText } from '../constants/translations';

export function useSound() {
  const isSoundMuted = useAppStore((state) => state.soundMuted);
  const setSoundMuted = useAppStore((state) => state.setSoundMuted);
  const language = useAppStore((state) => state.language);

  const handleSpeak = useCallback(
    (text: string) => {
      if (isSoundMuted) return;
      const spokenText = translateDynamicText(text, language);
      Speech.stop();
      Speech.speak(spokenText, { language: language === 'th' ? 'th-TH' : 'en-US', rate: 0.9 });
    },
    [isSoundMuted, language]
  );

  const toggleSound = useCallback(
    async (greeting = 'เปิดเสียงนำทางแล้วจ้า') => {
      const newValue = !isSoundMuted;
      await setSoundMuted(newValue);
      if (!newValue) {
        const spokenText = translateDynamicText(greeting, language);
        Speech.stop();
        Speech.speak(spokenText, { language: language === 'th' ? 'th-TH' : 'en-US', rate: 0.9 });
      } else {
        Speech.stop();
      }
    },
    [isSoundMuted, language, setSoundMuted]
  );

  const loadSoundSetting = useCallback(async () => {
    // No-op for backward compatibility
  }, []);

  return { isSoundMuted, handleSpeak, toggleSound, loadSoundSetting };
}
