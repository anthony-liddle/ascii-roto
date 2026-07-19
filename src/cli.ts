#!/usr/bin/env node

import { program } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import type { PipelineConfig } from './types.js';
import { validateFfmpeg, probeVideo } from './lib/ffmpeg.js';
import { buildConfig } from './lib/config.js';
import { createTempDir, cleanupTempDir } from './lib/temp.js';
import { startStep, succeedStep, failStep, summary } from './lib/progress.js';
import { extractFrames } from './pipeline/extract.js';
import { convertFramesToAscii } from './pipeline/convert.js';
import { trimBlankLines } from './pipeline/trim.js';
import { generateMp4 } from './output/mp4.js';
import { generateJsModule } from './output/js-module.js';
import { generateHtml } from './output/html.js';

// pnpm injects a bare '--' when forwarding args via `pnpm run dev -- args`.
// Strip only the first occurrence so a second '--' keeps its conventional
// "end of options" meaning.
const separatorIndex = process.argv.indexOf('--', 2);
const argv =
  separatorIndex === -1
    ? process.argv
    : process.argv.filter((_, i) => i !== separatorIndex);

program
  .name('ascii-roto')
  .description('ASCII rotoscoping tool — convert video to ASCII art')
  .version('0.1.0')
  .argument('<input>', 'Input video file')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-w, --width <n>', 'ASCII width in characters', '80')
  .option('-f, --fps <n>', 'Frames per second', '12')
  .option('-c, --color', 'Enable color mode', false)
  .option('--chars <string>', 'Character ramp, dark→light', ' .:-=+*#%@')
  .option('--font-size <n>', 'Font size for rendered output', '10')
  .option('--bg <color>', 'Background color', 'black')
  .option('--fg <color>', 'Foreground color for B&W', 'white')
  .option('--video-width <n>', 'Output video width px', '640')
  .option('--video-height <n>', 'Output video height px', '480')
  .option('--format <formats>', 'Comma-separated: mp4,js,html', 'mp4,js')
  .option('--no-trim', 'Skip blank line trimming')
  .option('--no-audio', 'Omit audio from MP4')
  .option('--keep-temp', 'Keep intermediate files', false)
  .option('--name <string>', 'Output filename base (default: input filename)')
  .action(run);

await program.parseAsync(argv);

async function run(inputArg: string, opts: Record<string, unknown>) {
  const inputPath = path.resolve(inputArg);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exitCode = 1;
    return;
  }

  let config: PipelineConfig;
  try {
    config = buildConfig(inputPath, opts);
  } catch (err) {
    console.error(`Error: ${messageOf(err)}`);
    process.exitCode = 1;
    return;
  }

  let tempDir = '';

  try {
    fs.mkdirSync(config.output, { recursive: true });

    startStep('Validating ffmpeg...');
    validateFfmpeg();
    succeedStep('ffmpeg found');

    startStep('Probing video...');
    const videoInfo = await probeVideo(config.input);
    succeedStep(
      `Video: ${videoInfo.width}x${videoInfo.height}, ${videoInfo.duration.toFixed(1)}s, audio: ${videoInfo.hasAudio ? 'yes' : 'no'}`,
    );

    tempDir = createTempDir();

    startStep('Extracting frames...');
    const framesDir = path.join(tempDir, 'frames');
    await extractFrames(config.input, framesDir, config.fps);
    const frameCount = fs
      .readdirSync(framesDir)
      .filter((f) => f.endsWith('.png')).length;
    if (frameCount === 0) {
      throw new Error('No frames were extracted — is this a valid video file?');
    }
    succeedStep(`Extracted ${frameCount} frames`);

    startStep('Converting to ASCII...');
    let frames = await convertFramesToAscii(
      framesDir,
      config.width,
      config.chars,
      config.color,
    );
    succeedStep(`Converted ${frames.length} frames to ASCII`);

    if (config.trim) {
      startStep('Trimming blank lines...');
      frames = trimBlankLines(frames);
      succeedStep('Trimmed blank lines');
    }

    const outputs: string[] = [];

    if (config.formats.includes('mp4')) {
      startStep('Generating MP4...');
      const mp4Path = await generateMp4(frames, config, videoInfo, tempDir);
      succeedStep(`MP4: ${mp4Path}`);
      outputs.push(mp4Path);
    }

    if (config.formats.includes('js')) {
      startStep('Generating JS module...');
      const jsPath = generateJsModule(frames, config);
      succeedStep(`JS: ${jsPath}`);
      outputs.push(jsPath);
    }

    if (config.formats.includes('html')) {
      startStep('Generating HTML player...');
      const htmlPath = generateHtml(frames, config);
      succeedStep(`HTML: ${htmlPath}`);
      outputs.push(htmlPath);
    }

    summary(outputs.map((o) => path.relative(process.cwd(), o)));
  } catch (err) {
    failStep(messageOf(err));
    process.exitCode = 1;
  } finally {
    if (tempDir && !config.keepTemp) {
      cleanupTempDir(tempDir);
    }
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
