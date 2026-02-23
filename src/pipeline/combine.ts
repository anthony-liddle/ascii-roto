import fs from 'node:fs';
import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';

export function combineFrames(options: {
  renderedDir: string;
  outputPath: string;
  inputVideo: string;
  fps: number;
  videoWidth: number;
  videoHeight: number;
  audio: boolean;
  hasAudio: boolean;
}): Promise<void> {
  const { renderedDir, outputPath, inputVideo, fps, videoWidth, videoHeight, audio, hasAudio } =
    options;

  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const cmd = ffmpeg()
      .input(path.join(renderedDir, 'frame%04d.png'))
      .inputFPS(fps);

    const includeAudio = audio && hasAudio;
    if (includeAudio) {
      cmd.input(inputVideo);
    }

    const outputOptions = [
      `-vf`,
      `fps=${fps},scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=decrease,pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2`,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
    ];

    if (includeAudio) {
      outputOptions.push('-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-shortest');
    }

    cmd
      .outputOptions(outputOptions)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}
