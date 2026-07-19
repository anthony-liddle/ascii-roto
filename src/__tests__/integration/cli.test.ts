import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const TSX = path.resolve('node_modules/.bin/tsx');
const CLI = path.resolve('src/cli.ts');

let testDir: string;

function ffmpegAvailable(): boolean {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function listTempDirs(): string[] {
  return fs
    .readdirSync(os.tmpdir())
    .filter((f) => f.startsWith('ascii-roto-'));
}

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
    expect(result.stderr).toContain('Error: Invalid --format value(s): bogus');
    // A controlled failure is a single clean console.error line, not a
    // Node crash dump (stack frames + "Node.js vX.Y.Z" runtime banner) or
    // an unhandled-rejection warning.
    expect(result.stderr).not.toMatch(/\n\s+at /);
    expect(result.stderr).not.toContain('Node.js v');
    expect(result.stderr).not.toContain('UnhandledPromiseRejection');
  });

  it('rejects a non-numeric --width with a message naming the flag', async () => {
    const input = path.join(testDir, 'fake2.mov');
    fs.writeFileSync(input, 'not a video');
    const result = await runCli([input, '--width', 'abc', '--format', 'js']);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/^Error: --width must be/);
    expect(result.stderr).not.toMatch(/\n\s+at /);
    expect(result.stderr).not.toContain('Node.js v');
    expect(result.stderr).not.toContain('UnhandledPromiseRejection');
  });

  it.skipIf(!ffmpegAvailable())(
    'cleans up the temp dir when a failure happens after extraction',
    async () => {
      const fixture = path.join(testDir, 'fixture.mp4');
      execFileSync('ffmpeg', [
        '-f', 'lavfi',
        '-i', 'testsrc=duration=1:size=160x120:rate=6',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-y',
        fixture,
      ], { stdio: 'ignore' });

      const outDir = path.join(testDir, 'readonly-output');
      fs.mkdirSync(outDir);
      fs.chmodSync(outDir, 0o555);

      const before = listTempDirs();

      try {
        const result = await runCli([
          fixture,
          '--format', 'js',
          '-o', outDir,
        ]);

        expect(result.code).toBe(1);
        expect(listTempDirs()).toEqual(before);
      } finally {
        fs.chmodSync(outDir, 0o755);
      }
    },
  );
});
