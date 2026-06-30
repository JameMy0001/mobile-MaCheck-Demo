import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

export type FontSize = 'small' | 'normal' | 'medium' | 'large' | 'xlarge';

const FONT_OFFSET: Record<FontSize, number> = {
  small: -2,
  normal: 0,
  medium: 3,
  large: 6,
  xlarge: 10,
};

export function useFontSize() {
  const fontSize = useAppStore((state) => state.fontSize);
  const setFontSize = useAppStore((state) => state.setFontSize);

  const fontOffset = FONT_OFFSET[fontSize] ?? 0;

  const loadFontSize = useCallback(async () => {
    // No-op for backward compatibility
  }, []);

  const saveFontSizeSetting = useCallback(async (size: FontSize) => {
    await setFontSize(size);
  }, [setFontSize]);

  return { fontOffset, fontSize, loadFontSize, saveFontSizeSetting };
}
