import type { AsciiFrame, PipelineConfig, VideoInfo } from '../types.js';
import { renderFramesToImages } from '../pipeline/render.js';
import { combineFrames } from '../pipeline/combine.js';
import path from 'node:path';

export async function generateMp4(
  frames: AsciiFrame[],
  config: PipelineConfig,
  videoInfo: VideoInfo,
  tempDir: string,
): Promise<string> {
  const renderedDir = path.join(tempDir, 'rendered');
  const outputPath = path.join(config.output, `${config.name}.mp4`);

  await renderFramesToImages(frames, renderedDir, {
    fontSize: config.fontSize,
    bg: config.bg,
    fg: config.fg,
    color: config.color,
    videoWidth: config.videoWidth,
    videoHeight: config.videoHeight,
  });

  await combineFrames({
    renderedDir,
    outputPath,
    inputVideo: config.input,
    fps: config.fps,
    videoWidth: config.videoWidth,
    videoHeight: config.videoHeight,
    audio: config.audio,
    hasAudio: videoInfo.hasAudio,
  });

  return outputPath;
}
