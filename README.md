# ascii-roto

ASCII rotoscoping tool — convert video to ASCII art with optional color.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

## Features

- Convert any video to ASCII art (MP4, JS module, or HTML player)
- B&W and full-color modes
- Configurable character ramp, dimensions, FPS, and font size
- Self-contained HTML player with play/pause and keyboard controls
- JS module output for embedding in web apps
- Automatic blank line trimming
- Audio passthrough in MP4 output

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- ffmpeg (`brew install ffmpeg` on macOS)

### Install

```bash
git clone https://github.com/anthonyliddle/ascii-roto.git
cd ascii-roto
pnpm install
```

### Usage

```bash
# Basic B&W conversion
pnpm dev -- ./video.mov

# Color mode with all output formats
pnpm dev -- ./video.mov --color --format mp4,js,html

# Custom settings
pnpm dev -- ./video.mov -w 120 --fps 24 --no-audio --format mp4
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output <dir>` | Output directory | `./output` |
| `-w, --width <n>` | ASCII width in characters | `80` |
| `-f, --fps <n>` | Frames per second | `12` |
| `-c, --color` | Enable color mode | off |
| `--chars <string>` | Character ramp (dark to light) | ` .:-=+*#%@` |
| `--font-size <n>` | Font size for rendered output | `10` |
| `--bg <color>` | Background color | `black` |
| `--fg <color>` | Foreground color (B&W mode) | `white` |
| `--video-width <n>` | Output video width (px) | `640` |
| `--video-height <n>` | Output video height (px) | `480` |
| `--format <formats>` | Output formats (comma-separated) | `mp4,js` |
| `--no-trim` | Skip blank line trimming | trim on |
| `--no-audio` | Omit audio from MP4 | audio on |
| `--keep-temp` | Keep intermediate files | off |
| `--name <string>` | Output filename base | input filename |

## Project Structure

```
src/
  cli.ts              # CLI entry point
  types.ts            # TypeScript interfaces
  pipeline/
    extract.ts        # FFmpeg frame extraction
    convert.ts        # Frame → ASCII conversion
    trim.ts           # Blank line trimming
    render.ts         # ASCII → PNG rendering
    combine.ts        # PNG → MP4 via FFmpeg
  output/
    mp4.ts            # MP4 output orchestration
    js-module.ts      # JS module compilation
    html.ts           # Self-contained HTML player
  lib/
    ffmpeg.ts         # FFmpeg validation + probing
    color.ts          # Color extraction
    characters.ts     # Character ramp logic
    progress.ts       # Progress reporting
    temp.ts           # Temp directory management
```

## Tech Stack

- TypeScript
- Node.js canvas (node-canvas)
- FFmpeg via fluent-ffmpeg
- Jimp for image processing
- Commander for CLI
- Chalk + Ora for terminal UI

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — Anthony Liddle
