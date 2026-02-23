import fs from 'node:fs';
import path from 'node:path';
import { Jimp } from 'jimp';
import { intToRGB } from '../lib/color.js';
import { luminanceToChar, rgbToLuminance } from '../lib/characters.js';
import type { AsciiFrame, PixelColor } from '../types.js';
import { updateStep } from '../lib/progress.js';

export async function convertFramesToAscii(
  framesDir: string,
  width: number,
  charRamp: string,
  color: boolean,
): Promise<AsciiFrame[]> {
  const files = fs
    .readdirSync(framesDir)
    .filter((f) => f.endsWith('.png'))
    .sort();

  const frames: AsciiFrame[] = [];

  for (let i = 0; i < files.length; i++) {
    updateStep(`Converting frame ${i + 1}/${files.length}`);
    const framePath = path.join(framesDir, files[i]);
    const frame = await frameToAscii(framePath, width, charRamp, color);
    frames.push(frame);
  }

  return frames;
}

async function frameToAscii(
  framePath: string,
  width: number,
  charRamp: string,
  color: boolean,
): Promise<AsciiFrame> {
  const image = await Jimp.read(framePath);
  const asciiHeight = Math.round(
    (image.bitmap.height / image.bitmap.width) * width,
  );
  image.resize({ w: width, h: asciiHeight });

  if (!color) {
    image.greyscale();
  }

  let text = '';
  const colors: PixelColor[][] | undefined = color ? [] : undefined;

  for (let y = 0; y < asciiHeight; y++) {
    let line = '';
    const lineColors: PixelColor[] = [];

    for (let x = 0; x < width; x++) {
      const pixel = intToRGB(image.getPixelColor(x, y));
      const luminance = color
        ? rgbToLuminance(pixel.r, pixel.g, pixel.b)
        : pixel.r; // greyscale: r=g=b
      const char = luminanceToChar(luminance, charRamp);
      line += char;
      if (color) lineColors.push(pixel);
    }

    text += line + '\n';
    if (colors) colors.push(lineColors);
  }

  return { text, colors };
}
