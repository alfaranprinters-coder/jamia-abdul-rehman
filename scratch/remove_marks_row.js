const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appPath = path.resolve(__dirname, '../app.js');
let content = fs.readFileSync(appPath, 'utf8');

const targetSnippet = `<div class="form-group-horizontal"><label>کل نمبر</label><input type="number" id="totalMarks"`;

const idx = content.indexOf(targetSnippet);
if (idx === -1) {
    console.error('Target snippet not found!');
    process.exit(1);
}

// Find the opening <div of this grid container (which starts with <div style="display: grid; grid-template-columns: repeat(3, 1fr);)
const containerStart = content.lastIndexOf('<div style="display: grid; grid-template-columns: repeat(3, 1fr);', idx);
if (containerStart === -1) {
    console.error('Container start not found!');
    process.exit(1);
}

// Also check if there is a comment right before it: <!-- Previous Results & Reason for Leaving -->
const commentStr = '<!-- Previous Results & Reason for Leaving -->';
const commentIdx = content.lastIndexOf(commentStr, containerStart);
const sliceStart = (commentIdx !== -1 && (containerStart - commentIdx) < 100) ? commentIdx : containerStart;

// Find the closing </div> of this grid container
const containerEnd = content.indexOf('</div>', content.indexOf('id="percentage"', idx));
if (containerEnd === -1) {
    console.error('Container end not found!');
    process.exit(1);
}
const sliceEnd = containerEnd + '</div>'.length;

console.log('Found chunk to remove:\n', content.substring(sliceStart, sliceEnd));

// Check if followed by newlines and spaces
let endPos = sliceEnd;
while (endPos < content.length && (content[endPos] === '\r' || content[endPos] === '\n' || content[endPos] === ' ' || content[endPos] === '\t')) {
    if (content.substr(endPos, 2) === '\r\n') {
        endPos += 2;
        break;
    } else if (content[endPos] === '\n') {
        endPos += 1;
        break;
    }
    endPos++;
}

let startPos = sliceStart;
// If sliceStart is preceded by indentation on that line, include leading whitespace
while (startPos > 0 && (content[startPos - 1] === ' ' || content[startPos - 1] === '\t')) {
    startPos--;
}

const newContent = content.substring(0, startPos) + content.substring(endPos);

console.log('Testing syntax with vm.Script...');
try {
    new vm.Script(newContent);
    console.log('SUCCESS: Syntax is 100% valid!');
} catch (e) {
    console.error('SYNTAX ERROR:', e);
    process.exit(1);
}

fs.writeFileSync(appPath, newContent, 'utf8');
console.log('SUCCESS: app.js updated successfully! New length:', newContent.length);
