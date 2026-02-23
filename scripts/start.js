const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { Jimp } = require('jimp');
const { intToRGBA } = require('@jimp/utils');
const { createCanvas } = require('canvas');
const path = require('path');

const FILE_NAME = "scissors3";

const ORIGINAL_VIDEO = `./raw/${FILE_NAME}.mov`;
const FRAME_DIR = './frames';
const ASCII_DIR = './ascii_frames';
const OUTPUT_VIDEO = `./output/${FILE_NAME}.mp4`;

const FPS = 12;

// Convert a single frame to ASCII art
async function frameToASCII(framePath, outputPath, width = 80) {
  const image = await Jimp.read(framePath);
  const asciiChars = ' .:-=+*#%@'; // ASCII gradient
  const asciiHeight = Math.round(image.bitmap.height / image.bitmap.width * width);
  image.resize({ w: width, h: asciiHeight }).greyscale();

  let asciiArt = '';
  for (let y = 0; y < asciiHeight; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = intToRGBA(image.getPixelColor(x, y));
      const charIndex = Math.floor((pixel.r / 255) * (asciiChars.length - 1));
      asciiArt += asciiChars[charIndex];
    }
    asciiArt += '\n';
  }

  fs.writeFileSync(outputPath, asciiArt);
}

// Extract frames from video
function extractFrames(videoPath, fps = FPS) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([`-r ${fps}`])
      .output(path.join(FRAME_DIR, 'frame%04d.png'))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// Render ASCII art to an image
async function renderASCIIToImage(asciiArt, outputPath) {
  const lines = asciiArt.split('\n');
  const fontSize = 10;
  const canvasWidth = lines[0].length * fontSize;
  const canvasHeight = lines.length * fontSize;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '2px';

  lines.forEach((line, y) => {
    ctx.fillText(line, 0, y * fontSize);
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

// Convert frames to ASCII art
async function convertFramesToASCII() {
  const files = fs.readdirSync(FRAME_DIR);
  for (const file of files) {
    const framePath = path.join(FRAME_DIR, file);
    const outputPath = path.join(ASCII_DIR, file.replace('.png', '.txt'));
    await frameToASCII(framePath, outputPath);
  }
}

// Convert ASCII frames to images
async function convertASCIIToImages() {
  const asciiFiles = fs.readdirSync(ASCII_DIR);
  for (const file of asciiFiles) {
    const asciiPath = path.join(ASCII_DIR, file);
    const outputPath = path.join(FRAME_DIR, file.replace('.txt', '.png'));

    const asciiArt = fs.readFileSync(asciiPath, 'utf-8');
    await renderASCIIToImage(asciiArt, outputPath);
  }
}

// Combine images into a video
function combineFrames(outputPath, outputWidth = 640, outputHeight = 480) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isDirectory()) {
      return reject(new Error(`${outputPath} is a directory. Please remove it or specify a different output file name.`));
    }

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Combining frames from ${FRAME_DIR} and audio from ${ORIGINAL_VIDEO}, outputting to ${outputPath}`);

    ffmpeg()
      .input(path.join(FRAME_DIR, 'frame%04d.png'))
      .input(ORIGINAL_VIDEO)
      .outputOptions([
        `-vf`, `fps=${FPS},scale=${outputWidth}:${outputHeight}:force_original_aspect_ratio=decrease,pad=${outputWidth}:${outputHeight}:(ow-iw)/2:(oh-ih)/2`,
        '-map', '0:v',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-strict', 'experimental',
        '-shortest',
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('Frames combined successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error combining frames:', err);
        reject(err);
      })
      .run();
  });
}

if (require.main === module) {
  console.log(`Processing ${ORIGINAL_VIDEO}`);

  if (!fs.existsSync(FRAME_DIR)) fs.mkdirSync(FRAME_DIR);
  if (!fs.existsSync(ASCII_DIR)) fs.mkdirSync(ASCII_DIR);

  (async () => {
    console.log('Extracting frames...');
    await extractFrames(ORIGINAL_VIDEO);

    console.log('Converting frames to ASCII...');
    await convertFramesToASCII();

    console.log('Converting ASCII art to images...');
    await convertASCIIToImages();

    console.log('Combining images into video...');
    await combineFrames(OUTPUT_VIDEO);

    console.log('Done! Output video:', OUTPUT_VIDEO);
  })();
}

module.exports = { FILE_NAME };
