# Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Vitest test suite with unit tests for all pure logic and separated integration tests for the ffmpeg pipeline, wired into CI and pre-commit hooks.

**Architecture:** Vitest workspace with two projects (`unit` and `integration`). Unit tests live in `src/__tests__/unit/`, integration tests in `src/__tests__/integration/`. Unit tests mock `fs` where needed. Integration tests generate a tiny fixture video via ffmpeg in a setup script.

**Tech Stack:** Vitest, TypeScript, pnpm

---

### Task 1: Install Vitest and Configure Workspace

**Files:**
- Modify: `package.json` (add vitest devDependency and test scripts)
- Create: `vitest.workspace.ts` (workspace config defining unit + integration projects)
- Modify: `eslint.config.mjs` (ignore test files or add vitest globals)

**Step 1: Install vitest**

Run: `pnpm add -D vitest`

**Step 2: Add test scripts to package.json**

Add these scripts to the `"scripts"` section of `package.json`:

```json
"test": "vitest run --project unit",
"test:unit": "vitest run --project unit",
"test:integration": "vitest run --project integration",
"test:watch": "vitest"
```

**Step 3: Create vitest workspace config**

Create `vitest.workspace.ts`:

```ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['src/__tests__/unit/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'integration',
      include: ['src/__tests__/integration/**/*.test.ts'],
      testTimeout: 60_000,
    },
  },
]);
```

**Step 4: Verify vitest runs with no tests**

Run: `pnpm test`
Expected: Vitest runs, finds no tests, exits cleanly (no error).

**Step 5: Commit**

```
git add package.json pnpm-lock.yaml vitest.workspace.ts
git commit -m "chore: add vitest with workspace config for unit and integration tests"
```

---

### Task 2: Unit Tests — characters.ts

**Files:**
- Create: `src/__tests__/unit/characters.test.ts`
- Reference: `src/lib/characters.ts`

**Step 1: Write tests**

Create `src/__tests__/unit/characters.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getCharRamp, luminanceToChar, rgbToLuminance } from '../../lib/characters.js';

describe('getCharRamp', () => {
  it('returns default ramp when called with undefined', () => {
    expect(getCharRamp(undefined)).toBe(' .:-=+*#%@');
  });

  it('returns provided ramp string', () => {
    expect(getCharRamp('abc')).toBe('abc');
  });
});

describe('luminanceToChar', () => {
  const ramp = ' .:-=+*#%@';

  it('maps luminance 0 to first character', () => {
    expect(luminanceToChar(0, ramp)).toBe(' ');
  });

  it('maps luminance 255 to last character', () => {
    expect(luminanceToChar(255, ramp)).toBe('@');
  });

  it('maps mid luminance to middle character', () => {
    const result = luminanceToChar(128, ramp);
    const index = ramp.indexOf(result);
    expect(index).toBeGreaterThan(0);
    expect(index).toBeLessThan(ramp.length - 1);
  });

  it('works with single character ramp', () => {
    expect(luminanceToChar(0, 'X')).toBe('X');
    expect(luminanceToChar(255, 'X')).toBe('X');
  });
});

describe('rgbToLuminance', () => {
  it('returns 0 for black', () => {
    expect(rgbToLuminance(0, 0, 0)).toBe(0);
  });

  it('returns ~255 for white', () => {
    expect(rgbToLuminance(255, 255, 255)).toBeCloseTo(255, 0);
  });

  it('weights green highest', () => {
    const red = rgbToLuminance(255, 0, 0);
    const green = rgbToLuminance(0, 255, 0);
    const blue = rgbToLuminance(0, 0, 255);
    expect(green).toBeGreaterThan(red);
    expect(red).toBeGreaterThan(blue);
  });

  it('matches standard luminance formula', () => {
    expect(rgbToLuminance(100, 150, 200)).toBeCloseTo(
      0.299 * 100 + 0.587 * 150 + 0.114 * 200,
    );
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS.

**Step 3: Commit**

```
git add src/__tests__/unit/characters.test.ts
git commit -m "test: add unit tests for character ramp and luminance functions"
```

---

### Task 3: Unit Tests — color.ts

**Files:**
- Create: `src/__tests__/unit/color.test.ts`
- Reference: `src/lib/color.ts`

**Step 1: Write tests**

Create `src/__tests__/unit/color.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { intToRGB } from '../../lib/color.js';

describe('intToRGB', () => {
  it('extracts pure red', () => {
    // 0xFF000000 = red=255, green=0, blue=0, alpha=0
    expect(intToRGB(0xff000000)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('extracts pure green', () => {
    expect(intToRGB(0x00ff0000)).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('extracts pure blue', () => {
    expect(intToRGB(0x0000ff00)).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('extracts mixed color', () => {
    // 0x80C0E000 = r=128, g=192, b=224
    expect(intToRGB(0x80c0e000)).toEqual({ r: 128, g: 192, b: 224 });
  });

  it('returns all zeros for 0x00000000', () => {
    expect(intToRGB(0x00000000)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('returns 255 for all channels with 0xFFFFFF00', () => {
    expect(intToRGB(0xffffff00)).toEqual({ r: 255, g: 255, b: 255 });
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS.

**Step 3: Commit**

```
git add src/__tests__/unit/color.test.ts
git commit -m "test: add unit tests for intToRGB color extraction"
```

---

### Task 4: Unit Tests — trim.ts

**Files:**
- Create: `src/__tests__/unit/trim.test.ts`
- Reference: `src/pipeline/trim.ts`

**Step 1: Write tests**

Create `src/__tests__/unit/trim.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { trimBlankLines } from '../../pipeline/trim.js';
import type { AsciiFrame } from '../../types.js';

function frame(text: string, colors?: AsciiFrame['colors']): AsciiFrame {
  return { text, colors };
}

describe('trimBlankLines', () => {
  it('returns frames unchanged when no leading blanks', () => {
    const frames = [frame('hello\nworld\n'), frame('foo\nbar\n')];
    expect(trimBlankLines(frames)).toEqual(frames);
  });

  it('trims uniform leading blank lines', () => {
    const frames = [frame('\n\nhello\nworld\n'), frame('\n\nfoo\nbar\n')];
    const result = trimBlankLines(frames);
    expect(result[0].text).toBe('hello\nworld\n');
    expect(result[1].text).toBe('foo\nbar\n');
  });

  it('trims to the minimum leading blank count', () => {
    const frames = [frame('\n\n\nhello\n'), frame('\nfoo\n')];
    const result = trimBlankLines(frames);
    // min is 1 (second frame), so trim 1 blank from each
    expect(result[0].text).toBe('\n\nhello\n');
    expect(result[1].text).toBe('foo\n');
  });

  it('returns empty array for empty input', () => {
    expect(trimBlankLines([])).toEqual([]);
  });

  it('trims color arrays in sync with text', () => {
    const colors = [[{ r: 255, g: 0, b: 0 }], [{ r: 0, g: 255, b: 0 }], [{ r: 0, g: 0, b: 255 }]];
    const frames = [frame('\nhello\nworld\n', colors)];
    const result = trimBlankLines(frames);
    // 1 leading blank trimmed, so colors should lose first row
    expect(result[0].colors).toEqual([
      [{ r: 0, g: 255, b: 0 }],
      [{ r: 0, g: 0, b: 255 }],
    ]);
  });

  it('handles frames that are all blank lines', () => {
    const frames = [frame('\n\n\n'), frame('\n\n\n')];
    const result = trimBlankLines(frames);
    // All lines blank — trims all, leaves empty text
    expect(result[0].text).toBe('');
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS.

**Step 3: Commit**

```
git add src/__tests__/unit/trim.test.ts
git commit -m "test: add unit tests for blank line trimming"
```

---

### Task 5: Unit Tests — js-module.ts

**Files:**
- Create: `src/__tests__/unit/js-module.test.ts`
- Reference: `src/output/js-module.ts`

**Step 1: Write tests**

Create `src/__tests__/unit/js-module.test.ts`:

```ts
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
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS.

**Step 3: Commit**

```
git add src/__tests__/unit/js-module.test.ts
git commit -m "test: add unit tests for JS module output generation"
```

---

### Task 6: Unit Tests — html.ts

**Files:**
- Create: `src/__tests__/unit/html.test.ts`
- Reference: `src/output/html.ts`

**Step 1: Write tests**

Create `src/__tests__/unit/html.test.ts`:

```ts
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
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS.

**Step 3: Commit**

```
git add src/__tests__/unit/html.test.ts
git commit -m "test: add unit tests for HTML player output generation"
```

---

### Task 7: Unit Tests — temp.ts

**Files:**
- Create: `src/__tests__/unit/temp.test.ts`
- Reference: `src/lib/temp.ts`

**Step 1: Write tests**

Create `src/__tests__/unit/temp.test.ts`:

```ts
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
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test`
Expected: All tests PASS.

**Step 3: Commit**

```
git add src/__tests__/unit/temp.test.ts
git commit -m "test: add unit tests for temp directory management"
```

---

### Task 8: Integration Tests — pipeline.test.ts

**Files:**
- Create: `src/__tests__/integration/pipeline.test.ts`
- Reference: `src/pipeline/extract.ts`, `src/pipeline/convert.ts`, `src/pipeline/trim.ts`, `src/output/js-module.ts`

**Step 1: Write integration test**

Create `src/__tests__/integration/pipeline.test.ts`:

```ts
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
```

**Step 2: Run integration tests to verify they pass**

Run: `pnpm test:integration`
Expected: All tests PASS (or skip if ffmpeg not installed).

**Step 3: Commit**

```
git add src/__tests__/integration/pipeline.test.ts
git commit -m "test: add integration tests for extract-convert-trim pipeline"
```

---

### Task 9: Wire Up CI and Pre-commit Hook

**Files:**
- Modify: `.github/workflows/test.yml` (add `pnpm test` step)
- Modify: `.husky/pre-commit` (add `pnpm test`)

**Step 1: Add test step to CI workflow**

In `.github/workflows/test.yml`, add after the `pnpm build` line:

```yaml
      - run: pnpm test
```

**Step 2: Add test to pre-commit hook**

Update `.husky/pre-commit` to:

```
pnpm typecheck && pnpm lint && pnpm test
```

**Step 3: Verify locally**

Run: `pnpm test`
Expected: All unit tests PASS.

**Step 4: Commit**

```
git add .github/workflows/test.yml .husky/pre-commit
git commit -m "ci: add unit tests to CI workflow and pre-commit hook"
```

---

### Task 10: Final Verification

**Step 1: Run full unit test suite**

Run: `pnpm test`
Expected: All unit tests PASS.

**Step 2: Run integration tests**

Run: `pnpm test:integration`
Expected: All integration tests PASS (or skip gracefully if ffmpeg unavailable).

**Step 3: Run full pre-commit checks**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: All checks PASS.
