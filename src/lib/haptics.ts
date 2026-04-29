// Lightweight haptics helper. Falls back to no-op on unsupported devices.
type Strength = 'light' | 'medium' | 'heavy' | 'selection';

const PATTERNS: Record<Strength, number | number[]> = {
  light: 8,
  medium: 18,
  heavy: 28,
  selection: [4, 4, 4],
};

export function haptic(strength: Strength = 'light') {
  try {
    if (typeof navigator === 'undefined') return;
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(PATTERNS[strength]);
    }
  } catch {
    // ignore
  }
}
