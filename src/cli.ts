#!/usr/bin/env node

import { program } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import type { OutputFormat, PipelineConfig } from './types.js';
import { validateFfmpeg, probeVideo } from './lib/ffmpeg.js';
import { getCharRamp } from './lib/characters.js';
import { createTempDir, cleanupTempDir } from './lib/temp.js';
import { startStep, succeedStep, failStep, summary } from './lib/progress.js';
import { extractFrames } from './pipeline/extract.js';
import { convertFramesToAscii } from './pipeline/convert.js';
import { trimBlankLines } from './pipeline/trim.js';
import { generateMp4 } from './output/mp4.js';
import { generateJsModule } from './output/js-module.js';
import { generateHtml } from './output/html.js';

// Strip bare '--' that pnpm injects when forwarding args via `pnpm run dev -- args`
const argv = process.argv.filter((arg, i) => !(arg === '--' && i >= 2));

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

program.parse(argv);

async function run(inputArg: string, opts: Record<string, unknown>) {
  const inputPath = path.resolve(inputArg as string);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const formats = (opts.format as string)
    .split(',')
    .map((f) => f.trim()) as OutputFormat[];

  const config: PipelineConfig = {
    input: inputPath,
    output: path.resolve(opts.output as string),
    width: Number(opts.width),
    fps: Number(opts.fps),
    color: opts.color as boolean,
    chars: getCharRamp(opts.chars as string),
    fontSize: Number(opts.fontSize),
    bg: opts.bg as string,
    fg: opts.fg as string,
    videoWidth: Number(opts.videoWidth),
    videoHeight: Number(opts.videoHeight),
    formats,
    trim: opts.trim as boolean,
    audio: opts.audio as boolean,
    keepTemp: opts.keepTemp as boolean,
    name:
      (opts.name as string) ||
      path.basename(inputPath, path.extname(inputPath)),
  };

  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output, { recursive: true });
  }

  let tempDir = '';

  try {
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
    const frameCount = fs.readdirSync(framesDir).filter((f) => f.endsWith('.png')).length;
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
    failStep((err as Error).message);
    process.exit(1);
  } finally {
    if (tempDir && !config.keepTemp) {
      cleanupTempDir(tempDir);
    }
  }
}
