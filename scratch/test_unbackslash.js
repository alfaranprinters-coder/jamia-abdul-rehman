const fs = require('fs');
const path = require('path');
const vm = require('vm');

const redesignBaitUlMaalPath = path.resolve(__dirname, 'redesign_baitulmaal.js');
const rawScript = fs.readFileSync(redesignBaitUlMaalPath, 'utf8');

const startStr = 'const newBaitUlMaalCode = `';
const endStr = '`;\n\nappJs = appJs.substring';
const sIdx = rawScript.indexOf(startStr);
const eIdx = rawScript.indexOf(endStr);

if (sIdx === -1 || eIdx === -1) {
    console.error('Could not extract from redesign_baitulmaal.js');
    process.exit(1);
}

let code = rawScript.substring(sIdx + startStr.length, eIdx);

// 1. Unescape backslashes before backticks and interpolation
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$\{/g, '${');

// 2. Class syntax: accountsFilter: { ... }, --> accountsFilter = { ... };
code = code.replace(/accountsFilter:\s*\{([^}]+)\},/, (m, p1) => {
    return `accountsFilter = {${p1}};`;
});

// 3. Remove trailing commas between class methods
code = code.replace(/\},(\s*\n\s*(?:async\s+)?[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{)/g, '}$1');
code = code.replace(/\},(\s*\n\s*\/\/)/g, '}$1');
code = code.replace(/\},(\s*$)/g, '}$1');

// Test if it parses cleanly inside a class
const testClass = `class TestClass {\n${code}\n}`;
try {
    new vm.Script(testClass, { filename: 'test_baitulmaal.js' });
    console.log('SUCCESS! Bait-ul-Maal class syntax is 100% valid!');
    fs.writeFileSync(path.resolve(__dirname, 'clean_baitulmaal.txt'), code, 'utf8');
    console.log('Saved to clean_baitulmaal.txt');
} catch (err) {
    console.error('Syntax error in Bait-ul-Maal:', err.message);
    console.error(err.stack);
    process.exit(1);
}
