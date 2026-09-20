const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

const target = '    numberToUrduWords(num) {';
const helperCode = `    formatWhatsAppNumber(rawPhone) {
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

if (!appJs.includes('formatWhatsAppNumber(rawPhone) {')) {
    appJs = appJs.replace(target, helperCode + target);
    fs.writeFileSync('app.js', appJs, 'utf8');
    console.log('Successfully added formatWhatsAppNumber to MadrassahApp in app.js');
} else {
    console.log('formatWhatsAppNumber is already present in app.js');
}
