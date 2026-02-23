import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from 'canvas';
import type { AsciiFrame } from '../types.js';
import { updateStep } from '../lib/progress.js';

export async function renderFramesToImages(
  frames: AsciiFrame[],
  renderedDir: string,
  options: {
    fontSize: number;
    bg: string;
    fg: string;
    color: boolean;
    videoWidth: number;
    videoHeight: number;
  },
): Promise<void> {
  for (let i = 0; i < frames.length; i++) {
    updateStep(`Rendering frame ${i + 1}/${frames.length}`);
    const outputPath = path.join(
      renderedDir,
      `frame${String(i + 1).padStart(4, '0')}.png`,
    );
    renderFrame(frames[i], outputPath, options);
  }
}

function renderFrame(
  frame: AsciiFrame,
  outputPath: string,
  options: {
    fontSize: number;
    bg: string;
    fg: string;
    color: boolean;
    videoWidth: number;
    videoHeight: number;
  },
): void {
  const lines = frame.text.split('\n').filter((l) => l.length > 0);
  const { fontSize, bg, fg, color } = options;

  // Match original: canvas sized from ASCII art content
  const canvasWidth = (lines[0]?.length ?? 0) * fontSize;
  const canvasHeight = lines.length * fontSize;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';
  (ctx as unknown as Record<string, unknown>).letterSpacing = '2px';

  if (color && frame.colors) {
    // For color: render each character individually with its color,
    // but use the same x-positioning as the B&W full-line render.
    // Build each line char-by-char, tracking x via measureText on the
    // accumulated string prefix so spacing matches the B&W path exactly.
    for (let y = 0; y < lines.length; y++) {
      const lineColors = frame.colors[y];
      const line = lines[y];
      for (let x = 0; x < line.length; x++) {
        const c = lineColors?.[x];
        ctx.fillStyle = c ? `rgb(${c.r},${c.g},${c.b})` : fg;
        // Measure prefix to get the exact x position the font engine would use
        const xPos = ctx.measureText(line.slice(0, x)).width;
        ctx.fillText(line[x], xPos, y * fontSize);
      }
    }
  } else {
    ctx.fillStyle = fg;
    for (let y = 0; y < lines.length; y++) {
      ctx.fillText(lines[y], 0, y * fontSize);
    }
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}
