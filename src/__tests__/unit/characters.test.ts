import { describe, it, expect } from 'vitest';
import { DEFAULT_CHARS, luminanceToChar, rgbToLuminance } from '../../lib/characters.js';

describe('DEFAULT_CHARS', () => {
  it('is the dark-to-light ramp with a leading space', () => {
    expect(DEFAULT_CHARS).toBe(' .:-=+*#%@');
  });
});

describe('luminanceToChar', () => {
  const ramp = ' .:-=+*#%@';

  it('maps luminance 0 to first character', () => {
    expect(luminanceToChar(0, ramp)).toBe(' ');
  });

  it('maps luminance 255 to last character', () => {
    expect(luminanceToChar(255, ramp)).toBe('@');
  });

  it('maps mid luminance to middle character', () => {
    const result = luminanceToChar(128, ramp);
    const index = ramp.indexOf(result);
    expect(index).toBeGreaterThan(0);
    expect(index).toBeLessThan(ramp.length - 1);
  });

  it('works with single character ramp', () => {
    expect(luminanceToChar(0, 'X')).toBe('X');
    expect(luminanceToChar(255, 'X')).toBe('X');
  });

  it('gives the brightest character a full luminance bucket, not just 255', () => {
    // Even 256-based buckets: 242 falls in the top bucket (242/25.6 = 9.45)
    expect(luminanceToChar(242, ramp)).toBe('@');
  });

  it('keeps luminance 0 and 255 at the ramp endpoints', () => {
    expect(luminanceToChar(0, ramp)).toBe(' ');
    expect(luminanceToChar(255, ramp)).toBe('@');
  });
});

describe('rgbToLuminance', () => {
  it('returns 0 for black', () => {
    expect(rgbToLuminance(0, 0, 0)).toBe(0);
  });

  it('returns ~255 for white', () => {
    expect(rgbToLuminance(255, 255, 255)).toBeCloseTo(255, 0);
  });

  it('weights green highest', () => {
    const red = rgbToLuminance(255, 0, 0);
    const green = rgbToLuminance(0, 255, 0);
    const blue = rgbToLuminance(0, 0, 255);
    expect(green).toBeGreaterThan(red);
    expect(red).toBeGreaterThan(blue);
  });

  it('matches standard luminance formula', () => {
    expect(rgbToLuminance(100, 150, 200)).toBeCloseTo(
      0.299 * 100 + 0.587 * 150 + 0.114 * 200,
    );
  });
});
