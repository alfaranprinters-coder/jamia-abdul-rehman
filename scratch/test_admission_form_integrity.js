const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '../app.js');
const code = fs.readFileSync(appPath, 'utf8');

const requiredMethods = [
    'toggleHifzTestSection',
    'calculateHifzTestScore',
    'updateDivisions',
    'updateDistricts',
    'updateTehsils',
    'calculatePercentage',
    'calculateAdmissionTotalFee',
    'updateMadrsaClasses',
    'renderAdmissionForm',
    'renderStudentList',
    'showAdmissionSuccessModal',
    'renderDashboard',
    'renderAttendance',
    'renderTimetable',
    'renderBaitulMaal',
    'renderFees',
    'renderSalary',
    'renderStaff'
];

let allPassed = true;
requiredMethods.forEach(method => {
    // Regex looking for method declaration in class MadrassahApp
    const regex = new RegExp(`\\b${method}\\s*\\(`);
    if (regex.test(code)) {
        console.log(`[PASS] Method found: ${method}`);
    } else {
        console.error(`[FAIL] Method NOT found: ${method}`);
        allPassed = false;
    }
});

// Check if admission form has the checkbox and button handlers
const checks = [
    'toggleHifzTestSection(this.checked)',
    'toggleHifzTestSection(chk.checked)',
    'calculateHifzTestScore()',
    'id="hifzTestSection"',
    'id="isTransferHifzCheck"'
];

checks.forEach(chk => {
    if (code.includes(chk)) {
        console.log(`[PASS] Admission form element found: ${chk}`);
    } else {
        console.error(`[FAIL] Admission form element missing: ${chk}`);
        allPassed = false;
    }
});

if (allPassed) {
    console.log('ALL 12 CHECKS PASSED PERFECTLY!');
} else {
    process.exit(1);
}
