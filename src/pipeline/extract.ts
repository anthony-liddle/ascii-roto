import fs from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';

export async function extractFrames(
  videoPath: string,
  framesDir: string,
  fps: number,
): Promise<void> {
  fs.mkdirSync(framesDir, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([`-r ${fps}`])
      .output(path.join(framesDir, 'frame%06d.png'))
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}
