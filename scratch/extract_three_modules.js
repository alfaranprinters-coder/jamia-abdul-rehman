const fs = require('fs');
const path = require('path');

const bakPath = path.resolve(__dirname, '../app.js.bak');
const curPath = path.resolve(__dirname, '../app.js');

const bak = fs.readFileSync(bakPath, 'utf8');
const cur = fs.readFileSync(curPath, 'utf8');

// Function to find method bounds in a class
function findMethodBlock(source, startMarker, endMarker) {
    const startIdx = source.indexOf(startMarker);
    if (startIdx === -1) {
        console.error('Marker not found:', startMarker);
        return null;
    }
    const endIdx = source.indexOf(endMarker, startIdx);
    if (endIdx === -1) {
        console.error('End marker not found:', endMarker);
        return null;
    }
    return {
        startIdx,
        endIdx,
        content: source.substring(startIdx, endIdx)
    };
}

console.log('--- Staff Module ---');
// Staff module starts with comment or renderStaffList
const staffStart = bak.indexOf('// --- Staff Management ---');
console.log('staffStart (comment):', staffStart);
const staffStartToUse = staffStart !== -1 ? staffStart : bak.indexOf('async renderStaffList(container)');
console.log('staffStartToUse:', staffStartToUse);

// What comes after staff?
// Let's see next section comment or method after deleteStaff
const deleteStaffIdx = bak.indexOf('deleteStaff(id)');
console.log('deleteStaffIdx:', deleteStaffIdx);
// Find next method or comment after deleteStaff
const afterStaffSnippet = bak.substring(deleteStaffIdx, deleteStaffIdx + 1000);
console.log('After deleteStaff snippet:\n', afterStaffSnippet);

console.log('\n--- Fee Module ---');
const feeStart = bak.indexOf('// --- Fee Collection Module ---');
console.log('feeStart (comment):', feeStart);
const feeStartToUse = feeStart !== -1 ? feeStart : bak.indexOf('async renderFeeModule(container)');
console.log('feeStartToUse:', feeStartToUse);

const printBlankReceiptIdx = bak.indexOf('printBlankReceipt()');
console.log('printBlankReceiptIdx:', printBlankReceiptIdx);
const afterFeeSnippet = bak.substring(printBlankReceiptIdx, printBlankReceiptIdx + 1000);
console.log('After printBlankReceipt snippet:\n', afterFeeSnippet);

console.log('\n--- Salary Module ---');
const salaryStart = bak.indexOf('// --- Salary Management Module ---');
console.log('salaryStart (comment):', salaryStart);
const salaryStartToUse = salaryStart !== -1 ? salaryStart : bak.indexOf('async renderSalaryModule(container)');
console.log('salaryStartToUse:', salaryStartToUse);

const printPayslipIdx = bak.indexOf('printPayslip(');
console.log('printPayslipIdx:', printPayslipIdx);
const afterSalarySnippet = bak.substring(printPayslipIdx, printPayslipIdx + 1000);
console.log('After printPayslip snippet:\n', afterSalarySnippet);
