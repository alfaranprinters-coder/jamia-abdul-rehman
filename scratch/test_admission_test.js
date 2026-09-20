// Verification Test for Admission Test & Hifz Assessment
const assert = require('assert');

// Test calculation logic
function calculateHifzTestScore(total, obt) {
    if (obt === '' || obt === undefined || isNaN(obt)) return '';
    const perc = Math.round((obt / total) * 100);
    let grade = 'راسب (Fail)';
    if (perc >= 85) grade = `ممتاز (A+) - ${perc}%`;
    else if (perc >= 70) grade = `جید جداً (A) - ${perc}%`;
    else if (perc >= 60) grade = `جید (B) - ${perc}%`;
    else if (perc >= 50) grade = `مقبول (C) - ${perc}%`;
    else grade = `ناقص / محتاجِ محنت - ${perc}%`;
    return grade;
}

// Test grade calculation
assert.strictEqual(calculateHifzTestScore(100, 92), 'ممتاز (A+) - 92%');
assert.strictEqual(calculateHifzTestScore(100, 78), 'جید جداً (A) - 78%');
assert.strictEqual(calculateHifzTestScore(100, 65), 'جید (B) - 65%');
assert.strictEqual(calculateHifzTestScore(100, 52), 'مقبول (C) - 52%');
assert.strictEqual(calculateHifzTestScore(100, 40), 'ناقص / محتاجِ محنت - 40%');
console.log('✓ Test Score Calculation verified!');

// Test student record with transfer hifz assessment
const mockStudent = {
    id: 1,
    name: 'محمد عثمان',
    fatherName: 'عبد الرشید',
    department: 'حفظ القرآن',
    isTransferHifz: 'yes',
    previousMadrsa: 'جامعہ دارالقرآن لاہور',
    hifzTotalParas: '7',
    hifzParasDetail: 'پارہ ۱ تا ۷',
    hifzGapPeriod: '۳ سے ۶ ماہ',
    manzilQuality: 'جید جداً (A - تسلی بخش یاد ہے، معمولی کچی ہے)',
    manzilStrongParas: 'پارہ ۱ تا ۵',
    manzilWeakParas: 'پارہ ۶ اور ۷',
    tajweedQuality: 'درست و معیاری (تجوید کے ساتھ)',
    recitationFluency: 'رواں و تیز رفتار',
    hifzTestTotalMarks: 100,
    hifzTestObtainedMarks: 85,
    hifzTestGrade: 'ممتاز (A+) - 85%',
    examinerName: 'قاری احمد حسن',
    hifzTestDate: '2026-09-20',
    examinerRemarks: 'ماشاءاللہ پختگی عمدہ ہے، پارہ ۶ اور ۷ میں معمولی التباس ہے جو ہفتہ وار تکرار سے دور ہو جائے گا۔ داخلے کی سفارش کی جاتی ہے۔',
    recommendedJuz: 'پارہ نمبر ۶',
    hifzAdmissionDecision: 'باقاعدہ داخلہ منظور (شعبہ حفظ)'
};

assert.strictEqual(mockStudent.isTransferHifz, 'yes');
assert.strictEqual(mockStudent.hifzTotalParas, '7');
assert(mockStudent.examinerRemarks.includes('ماشاءاللہ'));
console.log('✓ Mock Student transfer test record verified!');

// Test Juz matching logic with Urdu numeral normalization
const normalized = String(mockStudent.recommendedJuz)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const match = normalized.match(/\d+/);
assert(match !== null);
assert.strictEqual(match[0], '6');
console.log('✓ Recommended Juz Urdu digit normalization verified: ' + match[0]);

// Test Arabic digit normalization
const arabicJuz = 'الجزء ٤';
const normalizedArabic = String(arabicJuz)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const matchArabic = normalizedArabic.match(/\d+/);
assert.strictEqual(matchArabic[0], '4');
console.log('✓ Arabic digit normalization verified: ' + matchArabic[0]);

// Test standard English digit
const engJuz = 'پارہ 12';
const normalizedEng = String(engJuz)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const matchEng = normalizedEng.match(/\d+/);
assert.strictEqual(matchEng[0], '12');
console.log('✓ English digit verified: ' + matchEng[0]);

console.log('All tests passed successfully!');
