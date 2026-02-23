const fs = require('fs');
const path = require('path');

const directoryPath = './ascii_frames';

function countLeadingBlankLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let count = 0;

    for (const line of lines) {
        if (line.trim() === '') {
            count++;
        } else {
            break;
        }
    }
    return count;
}

function findLowestBlankLineCount(dir) {
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.txt'));
    let minCount = Infinity;

    for (const file of files) {
        const filePath = path.join(dir, file);
        const blankLines = countLeadingBlankLines(filePath);
        minCount = Math.min(minCount, blankLines);
    }

    return minCount === Infinity ? 0 : minCount;
}

if (require.main === module) {
    const lowestCount = findLowestBlankLineCount(directoryPath);
    console.log(`Lowest leading blank line count: ${lowestCount}`);
}

module.exports = { findLowestBlankLineCount };
