import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import type { AsciiFrame, PipelineConfig } from '../../types.js';
import { generateJsModule } from '../../output/js-module.js';

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
    formats: ['js'],
    trim: true,
    audio: true,
    keepTemp: false,
    name: 'test',
    ...overrides,
  };
}

describe('generateJsModule', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates B&W module with frame variables and default export', () => {
    let written = '';
    vi.mocked(fs.writeFileSync).mockImplementation((_path, content) => {
      written = content as string;
    });

    const frames: AsciiFrame[] = [
      { text: 'frame1\n' },
      { text: 'frame2\n' },
    ];

    const result = generateJsModule(frames, makeConfig());

    expect(result).toBe('/tmp/output/test.js');
    expect(written).toContain('const file1');
    expect(written).toContain('const file2');
    expect(written).toContain('export default animation');
  });

  it('generates color module with text and colors', () => {
    let written = '';
    vi.mocked(fs.writeFileSync).mockImplementation((_path, content) => {
      written = content as string;
    });

    const frames: AsciiFrame[] = [
      { text: 'X\n', colors: [[{ r: 255, g: 0, b: 0 }]] },
    ];

    const result = generateJsModule(frames, makeConfig({ color: true }));

    expect(result).toBe('/tmp/output/test.js');
    expect(written).toContain('text:');
    expect(written).toContain('colors:');
    expect(written).toContain('export default animation');
  });

  it('writes to the correct output path', () => {
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});

    const config = makeConfig({ output: '/my/dir', name: 'anim' });
    const result = generateJsModule([{ text: 'hi\n' }], config);

    expect(result).toBe('/my/dir/anim.js');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/my/dir/anim.js',
      expect.any(String),
      'utf-8',
    );
  });
});
