import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const TSX = path.resolve('node_modules/.bin/tsx');
const CLI = path.resolve('src/cli.ts');

let testDir: string;

async function runCli(args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync(TSX, [CLI, ...args]);
    return { code: 0, stdout, stderr };
  } catch (err) {
    const e = err as { code?: number; stdout?: string; stderr?: string };
    return { code: e.code ?? -1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

describe('cli error handling', () => {
  beforeAll(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascii-roto-cli-'));
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('exits 1 with a clear message for a missing input file', async () => {
    const result = await runCli(['/nonexistent/video.mov']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Input file not found');
  });

  it('rejects an invalid --format before doing any work', async () => {
    const input = path.join(testDir, 'fake.mov');
    fs.writeFileSync(input, 'not a video');
    const result = await runCli([input, '--format', 'bogus']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Invalid --format');
  });

  it('rejects a non-numeric --width with a message naming the flag', async () => {
    const input = path.join(testDir, 'fake2.mov');
    fs.writeFileSync(input, 'not a video');
    const result = await runCli([input, '--width', 'abc', '--format', 'js']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('--width');
  });
});
