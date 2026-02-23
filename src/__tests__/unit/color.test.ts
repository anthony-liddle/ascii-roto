import { describe, it, expect } from 'vitest';
import { intToRGB } from '../../lib/color.js';

describe('intToRGB', () => {
  it('extracts pure red', () => {
    // 0xFF000000 = red=255, green=0, blue=0, alpha=0
    expect(intToRGB(0xff000000)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('extracts pure green', () => {
    expect(intToRGB(0x00ff0000)).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('extracts pure blue', () => {
    expect(intToRGB(0x0000ff00)).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('extracts mixed color', () => {
    // 0x80C0E000 = r=128, g=192, b=224
    expect(intToRGB(0x80c0e000)).toEqual({ r: 128, g: 192, b: 224 });
  });

  it('returns all zeros for 0x00000000', () => {
    expect(intToRGB(0x00000000)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns 255 for all channels with 0xFFFFFF00', () => {
    expect(intToRGB(0xffffff00)).toEqual({ r: 255, g: 255, b: 255 });
  });
});
