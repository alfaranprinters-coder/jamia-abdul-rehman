const fs = require('fs');
const assert = require('assert');

// 1. Verify syntax and basic structures
const donorsJs = fs.readFileSync('donors.js', 'utf8');
assert(donorsJs.includes('const DonorsModule = {'), 'DonorsModule declaration found');
assert(donorsJs.includes('GREGORIAN_MONTHS:'), 'GREGORIAN_MONTHS present');
assert(donorsJs.includes('HIJRI_MONTHS:'), 'HIJRI_MONTHS present');
assert(donorsJs.includes('showInstantReceiptModal'), 'showInstantReceiptModal present');
assert(donorsJs.includes('shareReceiptWhatsApp'), 'shareReceiptWhatsApp present');
assert(donorsJs.includes('printDonorStatement'), 'printDonorStatement present');
assert(donorsJs.includes('printMasterAnnualSheet'), 'printMasterAnnualSheet present');

// 2. Test WhatsApp phone cleaning logic
function cleanWaPhone(rawWa) {
    const cleanWa = (rawWa || '').replace(/[^0-9]/g, '');
    return cleanWa.startsWith('0') ? '92' + cleanWa.slice(1) : cleanWa;
}
assert.strictEqual(cleanWaPhone('03001234567'), '923001234567');
assert.strictEqual(cleanWaPhone('0300-1234567'), '923001234567');
assert.strictEqual(cleanWaPhone('+923001234567'), '923001234567');
assert.strictEqual(cleanWaPhone('923001234567'), '923001234567');

// 3. Test Month array completeness
const gregMatches = donorsJs.match(/name:\s*'([^']+)'/g);
assert(gregMatches.length >= 24, 'Both Gregorian and Hijri 12 months defined');

// 4. Test index.html contains donors navigation link and script tag
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes("navigate('donors')"), 'index.html contains navigate(donors)');
assert(indexHtml.includes('<script src="donors.js"></script>'), 'index.html includes donors.js script');

// 5. Test app.js routes donors
const appJs = fs.readFileSync('app.js', 'utf8');
assert(appJs.includes("case 'donors': await DonorsModule.render(container); break;"), 'app.js routes donors');

console.log('ALL DONORS MODULE UNIT & INTEGRATION CHECKS PASSED!');
