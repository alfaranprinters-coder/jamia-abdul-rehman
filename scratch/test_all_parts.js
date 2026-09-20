const fs = require('fs');
const path = require('path');
const vm = require('vm');

const cleanReceipt = fs.readFileSync(path.resolve(__dirname, 'clean_receipt.txt'), 'utf8');
const cleanAttendance = fs.readFileSync(path.resolve(__dirname, 'clean_attendance.txt'), 'utf8');
const cleanBaitUlMaal = fs.readFileSync(path.resolve(__dirname, 'clean_baitulmaal.txt'), 'utf8');

// Test 1: cleanReceipt
try {
    new vm.Script(`class TestReceipt {\n${cleanReceipt}\n}`, { filename: 'test_receipt.js' });
    console.log('cleanReceipt: PASSED');
} catch (e) {
    console.error('cleanReceipt FAILED:', e.stack);
}

// Test 2: cleanAttendance
try {
    new vm.Script(`class TestAttendance {\n${cleanAttendance}\n}`, { filename: 'test_attendance.js' });
    console.log('cleanAttendance: PASSED');
} catch (e) {
    console.error('cleanAttendance FAILED:', e.stack);
}

// Test 3: cleanBaitUlMaal
try {
    new vm.Script(`class TestBaitUlMaal {\n${cleanBaitUlMaal}\n}`, { filename: 'test_baitulmaal.js' });
    console.log('cleanBaitUlMaal: PASSED');
} catch (e) {
    console.error('cleanBaitUlMaal FAILED:', e.stack);
}
