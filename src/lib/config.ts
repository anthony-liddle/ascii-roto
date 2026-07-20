import path from 'node:path';
import type { OutputFormat, PipelineConfig } from '../types.js';

const VALID_FORMATS = ['mp4', 'js', 'html'] as const;

export function buildConfig(
  inputPath: string,
  opts: Record<string, unknown>,
): PipelineConfig {
  return {
    input: inputPath,
    output: path.resolve(String(opts.output)),
    width: parsePositiveInt('--width', opts.width),
    fps: parsePositiveNumber('--fps', opts.fps),
    color: Boolean(opts.color),
    chars: String(opts.chars),
    fontSize: parsePositiveInt('--font-size', opts.fontSize),
    bg: String(opts.bg),
    fg: String(opts.fg),
    videoWidth: parseEvenPositiveInt('--video-width', opts.videoWidth),
    videoHeight: parseEvenPositiveInt('--video-height', opts.videoHeight),
    formats: parseFormats(String(opts.format)),
    trim: Boolean(opts.trim),
    audio: Boolean(opts.audio),
    keepTemp: Boolean(opts.keepTemp),
    name: sanitizeName(opts.name, inputPath),
  };
}

function parseFormats(raw: string): OutputFormat[] {
  const entries = raw
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f !== '');
  if (entries.length === 0) {
    throw new Error(`--format requires at least one of: ${VALID_FORMATS.join(', ')}`);
  }
  const invalid = entries.filter(
    (f) => !(VALID_FORMATS as readonly string[]).includes(f),
  );
  if (invalid.length > 0) {
    throw new Error(
      `Invalid --format value(s): ${invalid.join(', ')}. Valid formats: ${VALID_FORMATS.join(', ')}`,
    );
  }
  return [...new Set(entries)] as OutputFormat[];
}

function parsePositiveNumber(flag: string, value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${flag} must be a positive number, got: ${String(value)}`);
  }
  return n;
}

function parsePositiveInt(flag: string, value: unknown): number {
  const n = parsePositiveNumber(flag, value);
  if (!Number.isInteger(n)) {
    throw new Error(`${flag} must be a whole number, got: ${String(value)}`);
  }
  return n;
}

function parseEvenPositiveInt(flag: string, value: unknown): number {
  const n = parsePositiveInt(flag, value);
  if (n % 2 !== 0) {
    throw new Error(
      `${flag} must be an even number (yuv420p encoding requires it), got: ${String(value)}`,
    );
  }
  return n;
}

function sanitizeName(name: unknown, inputPath: string): string {
  const base =
    name == null || name === ''
      ? path.basename(inputPath, path.extname(inputPath))
      : String(name);
  return path.basename(base);
}
