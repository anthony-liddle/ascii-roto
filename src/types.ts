export interface PixelColor {
  r: number;
  g: number;
  b: number;
}

export interface AsciiFrame {
  text: string;
  colors?: PixelColor[][];
}

export type OutputFormat = 'mp4' | 'js' | 'html';

export interface PipelineConfig {
  input: string;
  output: string;
  width: number;
  fps: number;
  color: boolean;
  chars: string;
  fontSize: number;
  bg: string;
  fg: string;
  videoWidth: number;
  videoHeight: number;
  formats: OutputFormat[];
  trim: boolean;
  audio: boolean;
  keepTemp: boolean;
  name: string;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
}
