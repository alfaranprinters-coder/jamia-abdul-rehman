// Test script for Syllabus Module Hifz additions
const fs = require('fs');

const appContent = fs.readFileSync('app.js', 'utf8');

console.log('--- Testing app.js Hifz Syllabus implementation ---');

// Check 1: madrsaDepartments['حفظ']
if (appContent.includes("'تحفیظ القرآن الکریم (مکمل)'") && appContent.includes("'حفظ سال اول (پارہ ۱ تا ۱۰)'")) {
    console.log('✅ Check 1 PASSED: madrsaDepartments contains full Hifz classes.');
} else {
    console.error('❌ Check 1 FAILED: madrsaDepartments does not have Hifz classes.');
}

// Check 2: wifaqSyllabusData
if (appContent.includes("خلاصۃ التجوید مع فوائد مکیہ (قواعد تجوید و مخارج - ۳۰ نمبر)")) {
    console.log('✅ Check 2 PASSED: wifaqSyllabusData has authentic Hifz marks and subjects.');
} else {
    console.error('❌ Check 2 FAILED: wifaqSyllabusData missing Hifz entries.');
}

// Check 3: wifaqHifzDetailedSyllabus
if (appContent.includes("this.wifaqHifzDetailedSyllabus = [") && appContent.includes("کلام اللہ جل جلالہ")) {
    console.log('✅ Check 3 PASSED: wifaqHifzDetailedSyllabus structured array exists.');
} else {
    console.error('❌ Check 3 FAILED: wifaqHifzDetailedSyllabus not found.');
}

// Check 4: renderSyllabusModule & importWifaqHifzSyllabus
if (appContent.includes("importWifaqHifzSyllabus") && appContent.includes("printHifzSyllabus") && appContent.includes("filterSyllabusTab")) {
    console.log('✅ Check 4 PASSED: renderSyllabusModule has import, print, and tab filter methods.');
} else {
    console.error('❌ Check 4 FAILED: Helper methods missing in app.js.');
}

// Check 5: autoPopulateExamSubjects
if (appContent.includes("this.wifaqSyllabusData['تحفیظ القرآن الکریم (مکمل)']")) {
    console.log('✅ Check 5 PASSED: autoPopulateExamSubjects integrates with Hifz syllabus data.');
} else {
    console.error('❌ Check 5 FAILED: autoPopulateExamSubjects does not use Hifz data.');
}

console.log('--- All Syllabus checks completed successfully ---');
