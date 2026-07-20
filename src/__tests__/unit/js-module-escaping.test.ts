import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PipelineConfig } from '../../types.js';
import { generateJsModule } from '../../output/js-module.js';

const HOSTILE_TEXT = 'a`b${process.exit(1)}c\\d\n';

function makeConfig(overrides: Partial<PipelineConfig>): PipelineConfig {
  return {
    input: '/tmp/in.mov', output: '/tmp/out', width: 80, fps: 12,
    color: false, chars: ' .:-=+*#%@', fontSize: 10, bg: 'black', fg: 'white',
    videoWidth: 640, videoHeight: 480, formats: ['js'], trim: true,
    audio: true, keepTemp: false, name: 'test', ...overrides,
  };
}

describe('generated JS module escaping', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascii-roto-escape-'));

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('round-trips B&W frame text containing `, ${, and backslashes', async () => {
    const jsPath = generateJsModule(
      [{ text: HOSTILE_TEXT }],
      makeConfig({ output: dir, name: 'hostile' }),
    );
    // Node treats bare .js in a dir with no package.json as CJS; copy to .mjs
    // to force ESM parsing for the import.
    const mjsPath = path.join(dir, 'hostile.mjs');
    fs.copyFileSync(jsPath, mjsPath);
    const mod = await import(pathToFileURL(mjsPath).href);
    expect(mod.default).toEqual([HOSTILE_TEXT]);
  });

  it('round-trips color frame text', async () => {
    const jsPath = generateJsModule(
      [{ text: HOSTILE_TEXT, colors: [[{ r: 1, g: 2, b: 3 }]] }],
      makeConfig({ output: dir, name: 'hostile-color', color: true }),
    );
    const mjsPath = path.join(dir, 'hostile-color.mjs');
    fs.copyFileSync(jsPath, mjsPath);
    const mod = await import(pathToFileURL(mjsPath).href);
    expect(mod.default[0].text).toBe(HOSTILE_TEXT);
    expect(mod.default[0].colors).toEqual([[{ r: 1, g: 2, b: 3 }]]);
  });
});
