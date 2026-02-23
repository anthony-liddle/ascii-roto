import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { extractFrames } from '../../pipeline/extract.js';
import { convertFramesToAscii } from '../../pipeline/convert.js';
import { trimBlankLines } from '../../pipeline/trim.js';
import { generateJsModule } from '../../output/js-module.js';
import type { PipelineConfig } from '../../types.js';

const TEST_DIR = path.join(os.tmpdir(), `ascii-roto-integration-${Date.now()}`);
const FIXTURE_VIDEO = path.join(TEST_DIR, 'fixture.mp4');
const FRAMES_DIR = path.join(TEST_DIR, 'frames');
const OUTPUT_DIR = path.join(TEST_DIR, 'output');

function ffmpegAvailable(): boolean {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('pipeline integration', () => {
  beforeAll(() => {
    if (!ffmpegAvailable()) {
      return;
    }

    fs.mkdirSync(FRAMES_DIR, { recursive: true });
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Generate a tiny 1-second test video (160x120, solid color with movement)
    execFileSync('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'testsrc=duration=1:size=160x120:rate=6',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-y',
      FIXTURE_VIDEO,
    ], { stdio: 'ignore' });
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it.skipIf(!ffmpegAvailable())('extracts frames from video', async () => {
    await extractFrames(FIXTURE_VIDEO, FRAMES_DIR, 6);

    const frames = fs.readdirSync(FRAMES_DIR).filter((f) => f.endsWith('.png'));
    expect(frames.length).toBeGreaterThan(0);
  });

  it.skipIf(!ffmpegAvailable())('converts extracted frames to ASCII', async () => {
    const ramp = ' .:-=+*#%@';
    const asciiFrames = await convertFramesToAscii(FRAMES_DIR, 40, ramp, false);

    expect(asciiFrames.length).toBeGreaterThan(0);
    expect(asciiFrames[0].text.length).toBeGreaterThan(0);
  });

  it.skipIf(!ffmpegAvailable())('trims and generates JS module', async () => {
    const ramp = ' .:-=+*#%@';
    const asciiFrames = await convertFramesToAscii(FRAMES_DIR, 40, ramp, false);
    const trimmed = trimBlankLines(asciiFrames);

    const config: PipelineConfig = {
      input: FIXTURE_VIDEO,
      output: OUTPUT_DIR,
      width: 40,
      fps: 6,
      color: false,
      chars: ramp,
      fontSize: 10,
      bg: 'black',
      fg: 'white',
      videoWidth: 640,
      videoHeight: 480,
      formats: ['js'],
      trim: true,
      audio: false,
      keepTemp: false,
      name: 'test-output',
    };

    const jsPath = generateJsModule(trimmed, config);

    expect(fs.existsSync(jsPath)).toBe(true);
    expect(fs.statSync(jsPath).size).toBeGreaterThan(0);
  });
});
