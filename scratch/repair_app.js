const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appPath = path.resolve(__dirname, '../app.js');
console.log('Target app.js path:', appPath);

if (!fs.existsSync(appPath)) {
    console.error('app.js does not exist at:', appPath);
    process.exit(1);
}

const originalAppJs = fs.readFileSync(appPath, 'utf8');

// Step 1: Backup app.js
fs.writeFileSync(appPath + '.backup_final_clean', originalAppJs, 'utf8');
console.log('Backup created at app.js.backup_final_clean');

// 1. Where does numberToUrduWords end?
const numUrduMarker = "return parts.join(' ').trim() + ' روپے صرف';";
const numUrduIdx = originalAppJs.indexOf(numUrduMarker);
if (numUrduIdx === -1) {
    console.error('Could not find numUrduMarker');
    process.exit(1);
}
const closeBraceIdx = originalAppJs.indexOf('}', numUrduIdx);
const part1 = originalAppJs.substring(0, closeBraceIdx + 1);
console.log('Part 1 extracted, length:', part1.length);

// 2. Where does downloadReceiptImageDirect start?
const directImgMarker = "downloadReceiptImageDirect(options) {";
let directImgIdx = originalAppJs.indexOf(directImgMarker);
if (directImgIdx === -1) {
    console.error('Could not find directImgMarker');
    process.exit(1);
}
while (directImgIdx > 0 && originalAppJs[directImgIdx - 1] !== '\n') {
    directImgIdx--;
}

// 3. Where does renderAttendanceModule start?
const attModMarker = "renderAttendanceModule(container) {";
let attModIdx = originalAppJs.indexOf(attModMarker);
if (attModIdx === -1) {
    console.error('Could not find attModMarker');
    process.exit(1);
}
while (attModIdx > 0 && originalAppJs[attModIdx - 1] !== '\n') {
    attModIdx--;
}

const receiptHelpersPart = originalAppJs.substring(directImgIdx, attModIdx).trim();
console.log('Receipt helpers part extracted, length:', receiptHelpersPart.length);

// 4. Where does printAdmissionReceipt start (after Bait-ul-Maal)?
const admMarker = "printAdmissionReceipt(student, paidAmount, receiptNo, remaining) {";
let admIdx = originalAppJs.indexOf(admMarker);
if (admIdx === -1) {
    console.error('Could not find admMarker');
    process.exit(1);
}
while (admIdx > 0 && originalAppJs[admIdx - 1] !== '\n') {
    admIdx--;
}
const afterAccountsPart = originalAppJs.substring(admIdx);
console.log('After accounts part extracted, length:', afterAccountsPart.length);

// 5. Load the 3 clean modules
const cleanReceipt = fs.readFileSync(path.resolve(__dirname, 'clean_receipt.txt'), 'utf8');
const cleanAttendance = fs.readFileSync(path.resolve(__dirname, 'clean_attendance.txt'), 'utf8');
const cleanBaitUlMaal = fs.readFileSync(path.resolve(__dirname, 'clean_baitulmaal.txt'), 'utf8');

// 6. Assemble final app.js
const finalAppJs = [
    part1,
    cleanReceipt,
    receiptHelpersPart,
    cleanAttendance,
    cleanBaitUlMaal,
    afterAccountsPart
].join('\n\n');

console.log('Final app.js assembled, total length:', finalAppJs.length);

// 7. Validate syntax using vm.Script to verify full JavaScript validity
try {
    new vm.Script(finalAppJs, { filename: 'app.js' });
    console.log('==================================================');
    console.log('VALIDATION PASSED! Final app.js is 100% syntactically valid!');
    console.log('==================================================');
    fs.writeFileSync(appPath, finalAppJs, 'utf8');
    console.log('SUCCESSFULLY REPLACED app.js WITH CLEAN CODE!');
} catch (e) {
    console.error('SYNTAX VALIDATION FAILED:');
    console.error(e.stack);
    process.exit(1);
}
