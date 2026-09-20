const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

let inTemplate = false;
let inStr = false;
let line = 1;

for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '\n') line++;
    if (line > 3245) break;

    if (c === '`') {
        inTemplate = !inTemplate;
        if (line > 2140) console.log('Template at line', line, inTemplate ? 'OPENED' : 'CLOSED');
    }
}
console.log('At line 3237, inTemplate is:', inTemplate);
