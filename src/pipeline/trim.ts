import type { AsciiFrame } from '../types.js';

export function trimBlankLines(frames: AsciiFrame[]): AsciiFrame[] {
  const minBlanks = findMinLeadingBlanks(frames);
  if (minBlanks === 0) return frames;

  return frames.map((frame) => {
    const lines = frame.text.split('\n');
    const trimmedText = lines.slice(minBlanks).join('\n');
    const trimmedColors = frame.colors?.slice(minBlanks);
    return { text: trimmedText, colors: trimmedColors };
  });
}

function findMinLeadingBlanks(frames: AsciiFrame[]): number {
  let min = Infinity;

  for (const frame of frames) {
    const lines = frame.text.split('\n');
    let count = 0;
    for (const line of lines) {
      if (line.trim() === '') {
        count++;
      } else {
        break;
      }
    }
    min = Math.min(min, count);
  }

  return min === Infinity ? 0 : min;
}
