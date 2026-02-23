import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import type { AsciiFrame, PipelineConfig } from '../../types.js';
import { generateHtml } from '../../output/html.js';

vi.mock('node:fs');

function makeConfig(overrides: Partial<PipelineConfig> = {}): PipelineConfig {
  return {
    input: '/tmp/input.mov',
    output: '/tmp/output',
    width: 80,
    fps: 12,
    color: false,
    chars: ' .:-=+*#%@',
    fontSize: 10,
    bg: 'black',
    fg: 'white',
    videoWidth: 640,
    videoHeight: 480,
    formats: ['html'],
    trim: true,
    audio: true,
    keepTemp: false,
    name: 'test',
    ...overrides,
  };
}

function captureWritten(): { get: () => string } {
  let written = '';
  vi.mocked(fs.writeFileSync).mockImplementation((_path, content) => {
    written = content as string;
  });
  return { get: () => written };
}

describe('generateHtml', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates valid HTML structure', () => {
    const capture = captureWritten();
    const frames: AsciiFrame[] = [{ text: 'hello\n' }];

    generateHtml(frames, makeConfig());

    const html = capture.get();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<div id="display">');
    expect(html).toContain('<div id="controls">');
    expect(html).toContain('<script>');
  });

  it('includes frame data in output', () => {
    const capture = captureWritten();
    const frames: AsciiFrame[] = [{ text: 'abc\n' }, { text: 'def\n' }];

    generateHtml(frames, makeConfig());

    const html = capture.get();
    expect(html).toContain('abc');
    expect(html).toContain('def');
  });

  it('escapes HTML special characters in title', () => {
    const capture = captureWritten();

    generateHtml([{ text: 'x\n' }], makeConfig({ name: '<script>alert(1)</script>' }));

    const html = capture.get();
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });

  it('generates color spans for color mode', () => {
    const capture = captureWritten();
    const frames: AsciiFrame[] = [
      { text: 'X\n', colors: [[{ r: 255, g: 128, b: 0 }]] },
    ];

    generateHtml(frames, makeConfig({ color: true }));

    const html = capture.get();
    expect(html).toContain('rgb(255,128,0)');
    expect(html).toContain('<span');
  });

  it('uses configured fps for interval', () => {
    const capture = captureWritten();
    generateHtml([{ text: 'x\n' }], makeConfig({ fps: 24 }));

    const html = capture.get();
    // 1000/24 ≈ 42
    expect(html).toContain('const INTERVAL = 42');
  });

  it('writes to correct output path', () => {
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});

    const result = generateHtml(
      [{ text: 'x\n' }],
      makeConfig({ output: '/out', name: 'demo' }),
    );

    expect(result).toBe('/out/demo.html');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/out/demo.html',
      expect.any(String),
      'utf-8',
    );
  });
});
