const fs = require('fs');

const bak = fs.readFileSync('app.js.bak', 'utf8');
const cur = fs.readFileSync('app.js', 'utf8');

const list = [
    'renderStaffList',
    'renderStaffForm',
    'renderSalaryModule',
    'renderFeeModule'
];

list.forEach(fn => {
    const idxBak = bak.indexOf(fn + '(');
    const idxBakDef = bak.indexOf(fn + '(container)');
    const idxCur = cur.indexOf(fn + '(');
    const idxCurDef = cur.indexOf(fn + '(container)');
    console.log(`${fn}:`);
    console.log(`  in bak: call at ${idxBak}, def at ${idxBakDef}`);
    console.log(`  in cur: call at ${idxCur}, def at ${idxCurDef}`);
});
