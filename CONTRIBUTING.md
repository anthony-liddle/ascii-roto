# Contributing

Thanks for your interest in contributing to ascii-roto!

## Development Setup

```bash
# Clone the repo
git clone https://github.com/anthonyliddle/ascii-roto.git
cd ascii-roto

# Install dependencies (requires pnpm)
pnpm install

# Run in development mode
pnpm dev -- ./path/to/video.mov

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm typecheck
```

### Prerequisites

- Node.js 22+
- pnpm 10+
- ffmpeg and ffprobe installed (`brew install ffmpeg` on macOS)

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `revert`

Commits are validated by commitlint via a git hook.

## Code Style

- TypeScript with strict mode
- ESLint with flat config
- ESM (`import`/`export`)

## PR Process

1. Fork and create a feature branch (`feat/my-feature`)
2. Make your changes
3. Ensure `pnpm lint` and `pnpm typecheck` pass
4. Submit a PR against `main`
