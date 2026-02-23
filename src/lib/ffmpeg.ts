import { execFileSync } from 'node:child_process';
import ffmpeg from 'fluent-ffmpeg';
import type { VideoInfo } from '../types.js';

export function validateFfmpeg(): void {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    execFileSync('ffprobe', ['-version'], { stdio: 'ignore' });
  } catch {
    throw new Error(
      'ffmpeg and ffprobe are required but not found.\n' +
        'Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)',
    );
  }
}

export function probeVideo(videoPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new Error(`Failed to probe video: ${err.message}`));

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

      if (!videoStream) return reject(new Error('No video stream found'));

      let fps = 30;
      if (videoStream.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split('/');
        fps = parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(parts[0]);
      }

      resolve({
        duration: metadata.format.duration ?? 0,
        width: videoStream.width ?? 0,
        height: videoStream.height ?? 0,
        fps,
        hasAudio: !!audioStream,
      });
    });
  });
}
