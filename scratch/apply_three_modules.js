const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bakPath = path.resolve(__dirname, '../app.js.bak');
const curPath = path.resolve(__dirname, '../app.js');

const bak = fs.readFileSync(bakPath, 'utf8');
let cur = fs.readFileSync(curPath, 'utf8');

// Helper to extract code between two markers
function extractBlock(source, startMarker, endMarker) {
    const startIdx = source.indexOf(startMarker);
    if (startIdx === -1) {
        throw new Error('Start marker not found: ' + startMarker);
    }
    const endIdx = source.indexOf(endMarker, startIdx);
    if (endIdx === -1) {
        throw new Error('End marker not found: ' + endMarker);
    }
    return source.substring(startIdx, endIdx);
}

// 1. Extract Staff Module
// In app.js.bak, let's find where Staff starts and ends
console.log('Finding Staff Module...');
const staffMarker = 'async renderStaffList(container) {';
const staffIdx = bak.indexOf(staffMarker);
// Look for preceding comments like // --- Staff Management ---
let staffStartIdx = staffIdx;
const staffComment = '// --- Staff Management ---';
const cIdx = bak.lastIndexOf(staffComment, staffIdx);
if (cIdx !== -1 && staffIdx - cIdx < 200) {
    staffStartIdx = cIdx;
} else {
    while (staffStartIdx > 0 && bak[staffStartIdx - 1] !== '\n') staffStartIdx--;
}

// Where does Staff end?
// In app.js.bak, staff functions are: renderStaffList, renderStaffForm, handleStaffSubmit, toggleStaffSubject, editStaff, deleteStaff.
// Let's see what comes after deleteStaff:
const deleteStaffMarker = 'deleteStaff(id) {';
const delStaffIdx = bak.indexOf(deleteStaffMarker);
if (delStaffIdx === -1) throw new Error('deleteStaff not found in bak');

// Find closing brace of deleteStaff
// We can find the next method or comment
// Let's check what method follows deleteStaff
const afterDel = bak.substring(delStaffIdx, delStaffIdx + 2000);
// Look for next async or method declaration
const nextMethodMatch = afterDel.substring(200).match(/\n\s{4}(?:async\s+)?[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{/);
let staffEndIdx;
if (nextMethodMatch) {
    staffEndIdx = delStaffIdx + 200 + nextMethodMatch.index;
} else {
    throw new Error('Could not find end of Staff block');
}
const staffBlock = bak.substring(staffStartIdx, staffEndIdx).trim();
console.log('Staff block extracted, length:', staffBlock.length);

// 2. Extract Fee Module
console.log('Finding Fee Module...');
const feeMarker = 'async renderFeeModule(container) {';
const feeIdx = bak.indexOf(feeMarker);
let feeStartIdx = feeIdx;
const feeComment = '// --- Fee Collection Module ---';
const fCommentIdx = bak.lastIndexOf(feeComment, feeIdx);
if (fCommentIdx !== -1 && feeIdx - fCommentIdx < 200) {
    feeStartIdx = fCommentIdx;
} else {
    while (feeStartIdx > 0 && bak[feeStartIdx - 1] !== '\n') feeStartIdx--;
}

// Fee module ends after printBlankReceipt or whatever is last in fee module
// In app.js.bak, what methods are in fee?
// renderFeeModule, filterFeeStudents, selectStudentForFee, updateFeeCalculation, updateArrearsPreview, handleFeeSubmit, printBlankReceipt
const printBlankMarker = 'printBlankReceipt() {';
const pbIdx = bak.indexOf(printBlankMarker);
let feeEndIdx;
if (pbIdx !== -1) {
    const afterPb = bak.substring(pbIdx, pbIdx + 2500);
    const nextAfterPb = afterPb.substring(100).match(/\n\s{4}(?:async\s+)?[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{/);
    if (nextAfterPb) {
        feeEndIdx = pbIdx + 100 + nextAfterPb.index;
    } else {
        throw new Error('Could not find end of Fee block');
    }
} else {
    throw new Error('printBlankReceipt not found in bak');
}
const feeBlock = bak.substring(feeStartIdx, feeEndIdx).trim();
console.log('Fee block extracted, length:', feeBlock.length);

// 3. Extract Salary Module
console.log('Finding Salary Module...');
const salaryMarker = 'async renderSalaryModule(container) {';
const salIdx = bak.indexOf(salaryMarker);
let salStartIdx = salIdx;
const salComment = '// --- Salary Management Module ---';
const sCommentIdx = bak.lastIndexOf(salComment, salIdx);
if (sCommentIdx !== -1 && salIdx - sCommentIdx < 200) {
    salStartIdx = sCommentIdx;
} else {
    while (salStartIdx > 0 && bak[salStartIdx - 1] !== '\n') salStartIdx--;
}

// Salary methods: renderSalaryModule, updateSalaryFilter, showPaySalaryForm, calculateNetSalary, handleSalarySubmit, renderAdvanceModule, handleAdvanceSubmit, printPayslip
const printPayslipMarker = 'printPayslip(';
const ppIdx = bak.indexOf(printPayslipMarker);
let salEndIdx;
if (ppIdx !== -1) {
    const afterPp = bak.substring(ppIdx, ppIdx + 3000);
    const nextAfterPp = afterPp.substring(200).match(/\n\s{4}(?:async\s+)?[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{/);
    if (nextAfterPp) {
        salEndIdx = ppIdx + 200 + nextAfterPp.index;
    } else {
        // Might be end of class or next comment
        const commentMatch = afterPp.substring(200).match(/\n\s{4}\/\//);
        if (commentMatch) {
            salEndIdx = ppIdx + 200 + commentMatch.index;
        } else {
            throw new Error('Could not find end of Salary block');
        }
    }
} else {
    throw new Error('printPayslip not found in bak');
}
const salaryBlock = bak.substring(salStartIdx, salEndIdx).trim();
console.log('Salary block extracted, length:', salaryBlock.length);

// 4. Check if student action helper `openFeeForStudent` is needed
let extraHelpers = '';
if (bak.includes('openFeeForStudent(studentId)') && !cur.includes('openFeeForStudent(studentId)')) {
    console.log('Extracting openFeeForStudent helper...');
    const ofsIdx = bak.indexOf('openFeeForStudent(studentId) {');
    while (ofsIdx > 0 && bak[ofsIdx - 1] !== '\n');
    const afterOfs = bak.substring(ofsIdx, ofsIdx + 800);
    const nextAfterOfs = afterOfs.substring(50).match(/\n\s{4}(?:async\s+)?[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{/);
    if (nextAfterOfs) {
        const ofsEnd = ofsIdx + 50 + nextAfterOfs.index;
        extraHelpers += '\n\n    ' + bak.substring(ofsIdx, ofsEnd).trim();
    }
}

// Combine all three modules code
const combinedThreeModules = `
    // =========================================================================
    // --- 1. STAFF MANAGEMENT MODULE (عملہ کی فہرست و فارم) ---
    // =========================================================================
    ${staffBlock}

    // =========================================================================
    // --- 2. FEE COLLECTION MODULE (فیس وصولی، بقایا جات و رسیدات) ---
    // =========================================================================
    ${feeBlock}

    // =========================================================================
    // --- 3. SALARY MANAGEMENT MODULE (تنخواہوں کا نظام، ایڈوانس و پے سلپ) ---
    // =========================================================================
    ${salaryBlock}
    ${extraHelpers}
`;

// Where to insert in app.js?
// Insert right before the last closing brace of MadrassahApp class.
// Let's find: `// Initialize Application` or `window.app = new MadrassahApp();`
const initAppMarker = 'window.app = new MadrassahApp();';
const initAppIdx = cur.indexOf(initAppMarker);
if (initAppIdx === -1) {
    throw new Error('initAppMarker not found in cur app.js');
}

// Find the last '}' before initAppMarker which closes class MadrassahApp
let lastBraceIdx = cur.lastIndexOf('}', initAppIdx);
if (lastBraceIdx === -1) {
    throw new Error('Closing brace of MadrassahApp not found');
}

console.log('Snippet before insertion point:\n', JSON.stringify(cur.substring(lastBraceIdx - 60, lastBraceIdx)));

const updatedAppJs = cur.substring(0, lastBraceIdx) + '\n' + combinedThreeModules + '\n' + cur.substring(lastBraceIdx);

// Validate with vm.Script
console.log('Validating updated code with vm.Script...');
try {
    new vm.Script(updatedAppJs, { filename: 'app.js' });
    console.log('===========================================================');
    console.log('VALIDATION PASSED! app.js with 3 restored modules is 100% valid!');
    console.log('===========================================================');
    fs.writeFileSync(curPath, updatedAppJs, 'utf8');
    console.log('app.js successfully updated on disk!');
} catch (err) {
    console.error('SYNTAX VALIDATION FAILED:', err.stack);
    process.exit(1);
}
