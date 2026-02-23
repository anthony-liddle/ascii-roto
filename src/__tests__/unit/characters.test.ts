import { describe, it, expect } from 'vitest';
import { getCharRamp, luminanceToChar, rgbToLuminance } from '../../lib/characters.js';

describe('getCharRamp', () => {
  it('returns default ramp when called with undefined', () => {
    expect(getCharRamp(undefined)).toBe(' .:-=+*#%@');
  });

  it('returns provided ramp string', () => {
    expect(getCharRamp('abc')).toBe('abc');
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
