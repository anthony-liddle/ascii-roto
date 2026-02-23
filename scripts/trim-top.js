const fs = require('fs');
const path = require('path');
const { findLowestBlankLineCount } = require('./count-blanks');

const directoryPath = './ascii_frames';

const files = fs.readdirSync(directoryPath);
const trimCount = findLowestBlankLineCount(directoryPath);

files.forEach(file => {
  if (path.extname(file) === '.txt') {
    const filePath = path.join(directoryPath, file);
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').slice(trimCount).join('\n');
    fs.writeFileSync(filePath, lines, 'utf8');
    console.log(`Trimmed ${file}`);
  }
});
