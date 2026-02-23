const fs = require('fs');
const path = require('path');
const { FILE_NAME } = require('./start');

if (!FILE_NAME) {
  console.error("Error: No file name provided.");
  process.exit(1);
}

console.log(`Compiling file: ${FILE_NAME}`);

const inputDir = './ascii_frames';
const outputFile = `./output/${FILE_NAME}.js`;

if (!fs.existsSync(inputDir)) {
  console.error(`Input directory ${inputDir} does not exist.`);
  process.exit(1);
}

const txtFiles = fs.readdirSync(inputDir).filter(file => file.endsWith('.txt'));

let outputContent = '';
let variables = [];

txtFiles.forEach((file, index) => {
  const filePath = path.join(inputDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const variableName = `file${index + 1}`;

  outputContent += `const ${variableName} = \`${fileContent}\`;\n`;
  variables.push(variableName);
});

outputContent += `\nconst animation = [${variables.join(', ')}];\n\nexport default animation;\n`;

fs.writeFileSync(outputFile, outputContent, 'utf-8');

console.log(`JavaScript file created successfully at ${outputFile}`);
