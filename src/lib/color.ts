import type { PixelColor } from '../types.js';

export function intToRGB(colorInt: number): PixelColor {
  return {
    r: (colorInt >> 24) & 0xff,
    g: (colorInt >> 16) & 0xff,
    b: (colorInt >> 8) & 0xff,
  };
}
