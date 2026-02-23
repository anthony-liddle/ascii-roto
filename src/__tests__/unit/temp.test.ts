import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createTempDir, cleanupTempDir } from '../../lib/temp.js';

describe('createTempDir', () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    dirs.length = 0;
  });

  it('creates a directory that exists', () => {
    const dir = createTempDir();
    dirs.push(dir);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('creates frames/ subdirectory', () => {
    const dir = createTempDir();
    dirs.push(dir);
    expect(fs.existsSync(path.join(dir, 'frames'))).toBe(true);
  });

  it('creates rendered/ subdirectory', () => {
    const dir = createTempDir();
    dirs.push(dir);
    expect(fs.existsSync(path.join(dir, 'rendered'))).toBe(true);
  });

  it('creates unique directories each call', () => {
    const dir1 = createTempDir();
    const dir2 = createTempDir();
    dirs.push(dir1, dir2);
    expect(dir1).not.toBe(dir2);
  });
});

describe('cleanupTempDir', () => {
  it('removes an existing directory', () => {
    const dir = createTempDir();
    expect(fs.existsSync(dir)).toBe(true);
    cleanupTempDir(dir);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it('does not throw for non-existent directory', () => {
    expect(() => cleanupTempDir('/tmp/nonexistent-ascii-roto-test')).not.toThrow();
  });
});
