import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createCanvas } from 'canvas';
import { Jimp } from 'jimp';
import { renderFramesToImages } from '../../pipeline/render.js';

describe('monospace positioning equivalence', () => {
  it('per-char x advance equals measured prefix width (justifies x * charWidth)', () => {
    const ctx = createCanvas(10, 10).getContext('2d');
    ctx.font = '10px monospace';
    const charWidth = ctx.measureText('M').width;
    const line = ' .:-=+*#%@';
    for (let x = 0; x <= line.length; x++) {
      expect(ctx.measureText(line.slice(0, x)).width).toBeCloseTo(x * charWidth, 3);
    }
  });
});

describe('renderFramesToImages', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascii-roto-render-'));

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes one PNG per frame with expected height, for B&W and color', async () => {
    const options = {
      fontSize: 10, bg: 'black', fg: 'white',
      color: true, videoWidth: 640, videoHeight: 480,
    };
    await renderFramesToImages(
      [
        { text: '@#\n.:\n', colors: [[{ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }], [{ r: 0, g: 0, b: 255 }, { r: 9, g: 9, b: 9 }]] },
        { text: '@#\n.:\n' },
      ],
      dir,
      options,
    );

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
    expect(files).toEqual(['frame000001.png', 'frame000002.png']);

    const img = await Jimp.read(path.join(dir, 'frame000001.png'));
    expect(img.bitmap.height).toBe(2 * 10); // 2 lines * fontSize
    expect(img.bitmap.width).toBeGreaterThan(0);
  });

  it('sizes the canvas to the measured text width so content is not left-shifted', async () => {
    const wdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascii-roto-width-'));
    await renderFramesToImages(
      [{ text: '@@@@\n@@@@\n' }],
      wdir,
      { fontSize: 10, bg: 'black', fg: 'white', color: false, videoWidth: 640, videoHeight: 480 },
    );
    const probe = createCanvas(1, 1).getContext('2d');
    probe.font = '10px monospace';
    const charWidth = probe.measureText('M').width;

    const img = await Jimp.read(path.join(wdir, 'frame000001.png'));
    expect(img.bitmap.width).toBe(Math.max(1, Math.ceil(4 * charWidth)));
    fs.rmSync(wdir, { recursive: true, force: true });
  });
});
