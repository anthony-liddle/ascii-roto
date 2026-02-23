import fs from 'node:fs';
import path from 'node:path';
import type { AsciiFrame, PipelineConfig } from '../types.js';

export function generateJsModule(
  frames: AsciiFrame[],
  config: PipelineConfig,
): string {
  const outputPath = path.join(config.output, `${config.name}.js`);

  if (config.color) {
    return generateColorModule(frames, outputPath);
  }
  return generateBwModule(frames, outputPath);
}

function generateBwModule(frames: AsciiFrame[], outputPath: string): string {
  let content = '';
  const variables: string[] = [];

  frames.forEach((frame, index) => {
    const varName = `file${index + 1}`;
    content += `const ${varName} = \`${frame.text}\`;\n`;
    variables.push(varName);
  });

  content += `\nconst animation = [${variables.join(', ')}];\n\nexport default animation;\n`;

  fs.writeFileSync(outputPath, content, 'utf-8');
  return outputPath;
}

function generateColorModule(
  frames: AsciiFrame[],
  outputPath: string,
): string {
  let content = '// ASCII animation with color data\n';
  content += '// Each frame has { text, colors } where colors is a 2D array of {r,g,b}\n\n';

  const frameStrings: string[] = [];

  for (const frame of frames) {
    const colorsJson = frame.colors
      ? JSON.stringify(frame.colors)
      : 'null';
    frameStrings.push(
      `  {\n    text: \`${frame.text}\`,\n    colors: ${colorsJson}\n  }`,
    );
  }

  content += `const animation = [\n${frameStrings.join(',\n')}\n];\n\nexport default animation;\n`;

  fs.writeFileSync(outputPath, content, 'utf-8');
  return outputPath;
}
