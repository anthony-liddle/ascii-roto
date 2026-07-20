import { describe, it, expect } from 'vitest';
import { sortFrameFiles } from '../../pipeline/convert.js';

describe('sortFrameFiles', () => {
  it('sorts frame numbers numerically, not lexicographically', () => {
    const files = ['frame10000.png', 'frame9999.png', 'frame1001.png', 'frame0001.png'];
    expect(sortFrameFiles(files)).toEqual([
      'frame0001.png',
      'frame1001.png',
      'frame9999.png',
      'frame10000.png',
    ]);
  });

  it('does not mutate its input', () => {
    const files = ['frame0002.png', 'frame0001.png'];
    sortFrameFiles(files);
    expect(files).toEqual(['frame0002.png', 'frame0001.png']);
  });
});
