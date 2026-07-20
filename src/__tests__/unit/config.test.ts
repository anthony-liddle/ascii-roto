import { describe, it, expect } from 'vitest';
import { buildConfig } from '../../lib/config.js';

const INPUT = '/videos/clip.mov';

function defaults(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    output: './output',
    width: '80',
    fps: '12',
    color: false,
    chars: ' .:-=+*#%@',
    fontSize: '10',
    bg: 'black',
    fg: 'white',
    videoWidth: '640',
    videoHeight: '480',
    format: 'mp4,js',
    trim: true,
    audio: true,
    keepTemp: false,
    ...overrides,
  };
}

describe('buildConfig', () => {
  it('builds a config from default commander options', () => {
    const config = buildConfig(INPUT, defaults());
    expect(config.width).toBe(80);
    expect(config.fps).toBe(12);
    expect(config.formats).toEqual(['mp4', 'js']);
    expect(config.name).toBe('clip');
  });

  it('rejects a non-numeric --width', () => {
    expect(() => buildConfig(INPUT, defaults({ width: 'abc' }))).toThrow(/--width/);
  });

  it('rejects a zero or negative --fps', () => {
    expect(() => buildConfig(INPUT, defaults({ fps: '0' }))).toThrow(/--fps/);
    expect(() => buildConfig(INPUT, defaults({ fps: '-5' }))).toThrow(/--fps/);
  });

  it('allows fractional --fps', () => {
    expect(buildConfig(INPUT, defaults({ fps: '23.976' })).fps).toBeCloseTo(23.976);
  });

  it('rejects a fractional --width', () => {
    expect(() => buildConfig(INPUT, defaults({ width: '80.5' }))).toThrow(/--width/);
  });

  it('rejects odd --video-width (yuv420p requires even dimensions)', () => {
    expect(() => buildConfig(INPUT, defaults({ videoWidth: '641' }))).toThrow(/--video-width/);
  });

  it('rejects unknown --format values, naming them', () => {
    expect(() => buildConfig(INPUT, defaults({ format: 'mp4,htm' }))).toThrow(/htm/);
  });

  it('rejects an empty --format list', () => {
    expect(() => buildConfig(INPUT, defaults({ format: ' , ' }))).toThrow(/--format/);
  });

  it('deduplicates repeated formats', () => {
    expect(buildConfig(INPUT, defaults({ format: 'js,js,mp4' })).formats).toEqual(['js', 'mp4']);
  });

  it('sanitizes --name to a basename so output cannot escape the output dir', () => {
    expect(buildConfig(INPUT, defaults({ name: '../../evil' })).name).toBe('evil');
  });

  it('falls back to the input basename when --name is absent', () => {
    expect(buildConfig('/v/my.video.mov', defaults()).name).toBe('my.video');
  });
});
