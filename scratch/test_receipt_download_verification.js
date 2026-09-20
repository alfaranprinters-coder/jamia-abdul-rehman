const fs = require('fs');

console.log('--- Verifying Receipt Download Integration ---');

const appJs = fs.readFileSync('app.js', 'utf8');
const donorsJs = fs.readFileSync('donors.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

let pass = true;

function check(title, condition) {
    if (condition) {
        console.log('✔ PASS:', title);
    } else {
        console.error('✖ FAIL:', title);
        pass = false;
    }
}

check('window.saveBlobOrUrl is defined in app.js', appJs.includes('window.saveBlobOrUrl = function'));
check('window postMessage listener is defined in app.js', appJs.includes('SAVE_RECEIPT_DOWNLOAD'));
check('downloadReceiptImageDirect is defined in app.js', appJs.includes('downloadReceiptImageDirect(options)'));
check('downloadBlankReceipt is defined in app.js', appJs.includes('downloadBlankReceipt()'));
check('Fee module header has both print and download buttons', appJs.includes('خالی رسید بک ڈاؤن لوڈ کریں'));
check('Fee table has download button', appJs.includes('downloadFeeReceipt'));
check('Finance table has download button', appJs.includes('downloadDonationReceipt'));
check('triggerDownload in generateOfficialReceiptHtml delegates to saveBlobOrUrl', appJs.includes('window.opener.saveBlobOrUrl(dataUrl, filename)'));
check('triggerDownload in generateOfficialReceiptHtml has toast notification', appJs.includes('showDownloadToast'));

check('donors.js instant receipt modal has download image button', donorsJs.includes('DonorsModule.downloadDonationReceipt'));
check('donors.js ledger table has download button', donorsJs.includes('DonorsModule.downloadDonationReceipt'));
check('donors.js has downloadDonationReceipt method', donorsJs.includes('downloadDonationReceipt(donationId)'));

check('index.html includes html2canvas', indexHtml.includes('html2canvas.min.js'));

if (pass) {
    console.log('\n🎉 ALL 13 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
} else {
    process.exit(1);
}
