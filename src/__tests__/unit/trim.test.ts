import { describe, it, expect } from 'vitest';
import { trimBlankLines } from '../../pipeline/trim.js';
import type { AsciiFrame } from '../../types.js';

function frame(text: string, colors?: AsciiFrame['colors']): AsciiFrame {
  return { text, colors };
}

describe('trimBlankLines', () => {
  it('returns frames unchanged when no leading blanks', () => {
    const frames = [frame('hello\nworld\n'), frame('foo\nbar\n')];
    expect(trimBlankLines(frames)).toEqual(frames);
  });

  it('trims uniform leading blank lines', () => {
    const frames = [frame('\n\nhello\nworld\n'), frame('\n\nfoo\nbar\n')];
    const result = trimBlankLines(frames);
    expect(result[0].text).toBe('hello\nworld\n');
    expect(result[1].text).toBe('foo\nbar\n');
  });

  it('trims to the minimum leading blank count', () => {
    const frames = [frame('\n\n\nhello\n'), frame('\nfoo\n')];
    const result = trimBlankLines(frames);
    // min is 1 (second frame), so trim 1 blank from each
    expect(result[0].text).toBe('\n\nhello\n');
    expect(result[1].text).toBe('foo\n');
  });

  it('returns empty array for empty input', () => {
    expect(trimBlankLines([])).toEqual([]);
  });

  it('trims color arrays in sync with text', () => {
    const colors = [[{ r: 255, g: 0, b: 0 }], [{ r: 0, g: 255, b: 0 }], [{ r: 0, g: 0, b: 255 }]];
    const frames = [frame('\nhello\nworld\n', colors)];
    const result = trimBlankLines(frames);
    // 1 leading blank trimmed, so colors should lose first row
    expect(result[0].colors).toEqual([
      [{ r: 0, g: 255, b: 0 }],
      [{ r: 0, g: 0, b: 255 }],
    ]);
  });

  it('handles frames that are all blank lines', () => {
    const frames = [frame('\n\n\n'), frame('\n\n\n')];
    const result = trimBlankLines(frames);
    // All lines blank — trims all, leaves empty text
    expect(result[0].text).toBe('');
  });
});
