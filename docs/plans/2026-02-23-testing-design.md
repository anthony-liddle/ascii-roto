# Testing Design — ascii-roto

## Goal

Add a test suite for regression safety and CI gating. Unit tests cover pure logic (fast, no external deps). Integration tests exercise the full ffmpeg pipeline separately.

## Framework

Vitest — native ESM + TypeScript support, fast, Jest-like API.

## Test Structure

```
src/
  __tests__/
    unit/
      characters.test.ts
      color.test.ts
      trim.test.ts
      js-module.test.ts
      html.test.ts
      temp.test.ts
    integration/
      pipeline.test.ts
```

## Scripts

| Script | Runs | Purpose |
|--------|------|---------|
| `pnpm test` | Unit tests | CI required check, pre-commit hook |
| `pnpm test:unit` | Unit tests | Explicit unit-only |
| `pnpm test:integration` | Integration tests | Requires ffmpeg, slower |
| `pnpm test:watch` | All in watch mode | Development |

## Unit Tests

### characters.ts

- `getCharRamp`: returns default ramp when no arg, returns custom ramp when provided
- `luminanceToChar`: maps 0 to first char, 255 to last char, midpoint to middle char, clamps out-of-range
- `rgbToLuminance`: known values (pure red, green, blue, white, black), weighted formula correctness

### color.ts

- `intToRGB`: known hex values (0xFF000000 → {r:255,g:0,b:0}), zero, edge cases

### trim.ts

- No blank lines → frames unchanged
- Uniform leading blanks → all removed
- Mixed leading blanks → trims to minimum
- Empty frames array → returns empty
- Color arrays trimmed in sync with text lines

### js-module.ts (mock fs)

- B&W: generates valid JS with frame variables and export
- Color: generates frame objects with text + colors JSON
- Writes to correct output path

### html.ts (mock fs)

- Contains required HTML structure (DOCTYPE, display div, controls, script)
- Frame data embedded correctly
- `escapeHtml` handles &, <, >, "
- Color mode generates span elements with rgb styles

### temp.ts (real temp dirs)

- `createTempDir`: creates dir with frames/ and rendered/ subdirs
- `cleanupTempDir`: removes directory, no-ops on missing dir

## Integration Tests

### pipeline.test.ts

- Uses a tiny test fixture video (1s, 160x120, generated via ffmpeg in test setup)
- Runs: extract → convert → trim → generates MP4 output file
- Verifies output file exists and is non-empty
- Generates JS module and verifies it's valid JavaScript (dynamic import)

## CI Integration

- Add `test` script to `.github/workflows/test.yml`
- Unit tests only in CI (no ffmpeg requirement for the required check)
- Pre-commit hook runs `pnpm test`

## Config

Vitest workspace config with two projects (`unit` and `integration`) to enable selective execution via `--project`.
