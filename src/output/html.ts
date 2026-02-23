import fs from 'node:fs';
import path from 'node:path';
import type { AsciiFrame, PipelineConfig } from '../types.js';

export function generateHtml(
  frames: AsciiFrame[],
  config: PipelineConfig,
): string {
  const outputPath = path.join(config.output, `${config.name}.html`);
  const frameData = buildFrameData(frames, config.color);
  const intervalMs = Math.round(1000 / config.fps);

  // Note: This generates a self-contained HTML file where all frame data is
  // produced by our own pipeline from video pixel data — no untrusted input.
  // Color frames use innerHTML with pre-escaped content for per-character coloring.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(config.name)} — ASCII Roto</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: ${config.bg};
    color: ${config.fg};
    font-family: monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    overflow: hidden;
  }
  #display {
    white-space: pre;
    font-size: ${config.fontSize}px;
    line-height: 1;
    letter-spacing: 0.1em;
  }
  #controls {
    position: fixed;
    bottom: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  #controls:hover { opacity: 1; }
  button {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.3);
    color: inherit;
    padding: 6px 16px;
    cursor: pointer;
    font-family: monospace;
    font-size: 13px;
    border-radius: 4px;
  }
  button:hover { background: rgba(255,255,255,0.2); }
  #counter {
    font-size: 12px;
    opacity: 0.7;
    min-width: 80px;
    text-align: center;
  }
</style>
</head>
<body>
<div id="display"></div>
<div id="controls">
  <button id="playPause">Pause</button>
  <span id="counter">1 / ${frames.length}</span>
</div>
<script>
const frames = ${frameData};
const INTERVAL = ${intervalMs};
const display = document.getElementById('display');
const playPause = document.getElementById('playPause');
const counter = document.getElementById('counter');
let index = 0;
let playing = true;
let timer = null;

function renderFrame(i) {
  const f = frames[i];
  if (typeof f === 'string') {
    display.textContent = f;
  } else {
    // Color frames contain pre-escaped HTML generated at build time
    // from video pixel data (not user input)
    display.innerHTML = f.html;
  }
  counter.textContent = (i + 1) + ' / ' + frames.length;
}

function tick() {
  renderFrame(index);
  index = (index + 1) % frames.length;
}

function play() {
  playing = true;
  playPause.textContent = 'Pause';
  timer = setInterval(tick, INTERVAL);
}

function pause() {
  playing = false;
  playPause.textContent = 'Play';
  clearInterval(timer);
}

playPause.addEventListener('click', () => playing ? pause() : play());

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
  if (e.code === 'ArrowRight') { pause(); index = (index + 1) % frames.length; renderFrame(index); }
  if (e.code === 'ArrowLeft') { pause(); index = (index - 1 + frames.length) % frames.length; renderFrame(index); }
});

renderFrame(0);
play();
</script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

function buildFrameData(frames: AsciiFrame[], color: boolean): string {
  if (!color) {
    const items = frames.map((f) => '`' + f.text + '`');
    return `[\n${items.join(',\n')}\n]`;
  }

  const items = frames.map((frame) => {
    const lines = frame.text.split('\n').filter((l) => l.length > 0);
    let html = '';
    for (let y = 0; y < lines.length; y++) {
      for (let x = 0; x < lines[y].length; x++) {
        const c = frame.colors?.[y]?.[x];
        const char = escapeHtml(lines[y][x]);
        if (c) {
          html += `<span style="color:rgb(${c.r},${c.g},${c.b})">${char}</span>`;
        } else {
          html += char;
        }
      }
      html += '\\n';
    }
    return `  { html: \`${html}\` }`;
  });

  return `[\n${items.join(',\n')}\n]`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
