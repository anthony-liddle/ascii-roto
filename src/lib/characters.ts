const DEFAULT_CHARS = ' .:-=+*#%@';

export function getCharRamp(chars?: string): string {
  return chars ?? DEFAULT_CHARS;
}

export function luminanceToChar(luminance: number, ramp: string): string {
  const index = Math.floor((luminance / 255) * (ramp.length - 1));
  return ramp[Math.min(index, ramp.length - 1)];
}

export function rgbToLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
