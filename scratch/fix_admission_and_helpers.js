const fs = require('fs');

console.log('--- Restoring printStudentForm and helper methods in app.js ---');

let appJs = fs.readFileSync('app.js', 'utf8');
const bakJs = fs.readFileSync('app.js.bak_admission_test', 'utf8');

// Extract printStudentForm from app.js.bak_admission_test
const bakStart = bakJs.indexOf('    async printStudentForm(studentId) {');
const bakEnd = bakJs.indexOf('    async editStudent(id) {');

if (bakStart === -1 || bakEnd === -1) {
    console.error('Could not find printStudentForm in backup!');
    process.exit(1);
}

const originalPrintStudentForm = bakJs.substring(bakStart, bakEnd);

// Find printStudentForm in current app.js
const curStart = appJs.indexOf('    async printStudentForm(studentId) {');
// Look for where numberToUrduWords starts in app.js
const curEnd = appJs.indexOf('    numberToUrduWords(num) {');

if (curStart === -1 || curEnd === -1) {
    console.error('Could not find markers in current app.js!');
    process.exit(1);
}

const replacement = originalPrintStudentForm + `
    // WhatsApp Number Normalizer for Pakistan & International
    formatWhatsAppNumber(rawPhone) {
        if (!rawPhone) return '';
        let digits = String(rawPhone).replace(/[^0-9]/g, '');
        if (!digits) return '';
        if (digits.startsWith('0092')) {
            digits = '92' + digits.slice(4);
        } else if (digits.startsWith('92')) {
            // Valid Pakistani international format
        } else if (digits.startsWith('0')) {
            digits = '92' + digits.slice(1);
        } else if (digits.length === 10 && digits.startsWith('3')) {
            digits = '92' + digits;
        }
        return digits;
    }

`;

appJs = appJs.substring(0, curStart) + replacement + appJs.substring(curEnd);

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Successfully restored printStudentForm and helper methods!');
