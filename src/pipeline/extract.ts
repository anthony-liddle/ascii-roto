import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';

export function extractFrames(
  videoPath: string,
  framesDir: string,
  fps: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([`-r ${fps}`])
      .output(path.join(framesDir, 'frame%04d.png'))
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}
