const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
let content = fs.readFileSync(appPath, 'utf8');

const targetStr = `        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'داخلہ فیس وصولی رسید (Admission Fee Receipt)',
            receiptNo: receiptNo || ('ADM-' + Math.floor(100000 + Math.random() * 900000)),
            bookNo: '1',
            amount: paidAmount,
            amountInWords: amountWords,
            payeeName: payee,
            address: addr,
            onAccountOf: purpose,
            dateStr: Date.now()
        });
            <head>`;

const altTargetStr = `        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'داخلہ فیس وصولی رسید (Admission Fee Receipt)',
            receiptNo: receiptNo || ('ADM-' + Math.floor(100000 + Math.random() * 900000)),
            bookNo: '1',
            amount: paidAmount,
            amountInWords: amountWords,
            payeeName: payee,
            address: addr,
            onAccountOf: purpose,
            dateStr: Date.now()
        });\r\n            <head>`;

const replacementStr = `        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'داخلہ فیس وصولی رسید (Admission Fee Receipt)',
            receiptNo: receiptNo || ('ADM-' + Math.floor(100000 + Math.random() * 900000)),
            bookNo: '1',
            amount: paidAmount,
            amountInWords: amountWords,
            payeeName: payee,
            address: addr,
            onAccountOf: purpose,
            dateStr: Date.now()
        });

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
        } else {
            alert('براؤزر نے پاپ اپ بلاک کر دیا ہے۔ براہ کرم اسکرین پر موجود "رسید پرنٹ کریں" کا بٹن دبائیں۔');
        }
    }

    printAdmissionChallan(student, paidAmount = null) {
        if (!student) return;
        const admFee = parseInt(student.admissionFee || 0);
        const monFee = parseInt(student.monthlyFee || 0);
        const total = (student.totalFee ? parseInt(student.totalFee) : (admFee + monFee)) || parseInt(student.arrears || 0);
        
        let actualPaid = 0;
        if (paidAmount !== null && paidAmount !== undefined && !isNaN(paidAmount) && paidAmount > 0) {
            actualPaid = parseInt(paidAmount);
        } else if (student.paidNow !== undefined && student.paidNow !== null && !isNaN(student.paidNow) && student.paidNow > 0) {
            actualPaid = parseInt(student.paidNow);
        }
        
        const remaining = (student.arrears !== undefined && student.arrears !== null && !isNaN(student.arrears)) 
            ? parseInt(student.arrears) 
            : Math.max(0, total - actualPaid);
        const date = new Date().toLocaleDateString('ur-PK');
        const code = student.uniqueCode || ('STU-' + (1000 + parseInt(student.id || 0)));

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('براؤزر نے پاپ اپ بلاک کر دیا ہے۔ براہ کرم براؤزر میں پاپ اپس کی اجازت دیں۔');
            return;
        }
        
        printWindow.document.write(\`
            <html lang="ur" dir="rtl">
            <head>\`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    console.log('Target string replaced successfully (LF)');
} else if (content.includes(altTargetStr)) {
    content = content.replace(altTargetStr, replacementStr);
    console.log('Target string replaced successfully (CRLF)');
} else {
    // Fuzzy search around generateOfficialReceiptHtml
    const marker = "receiptTitle: 'داخلہ فیس وصولی رسید (Admission Fee Receipt)',";
    const idx = content.indexOf(marker);
    if (idx !== -1) {
        const headIdx = content.indexOf('<head>', idx);
        if (headIdx !== -1 && headIdx - idx < 500) {
            const before = content.substring(0, idx - 60); // from before generateOfficialReceiptHtml
            // Let's find 'const html = this.generateOfficialReceiptHtml'
            const constHtmlIdx = content.lastIndexOf('const html = this.generateOfficialReceiptHtml', idx);
            const after = content.substring(headIdx + '<head>'.length);
            content = content.substring(0, constHtmlIdx) + replacementStr + after;
            console.log('Replaced via fuzzy index matching!');
        } else {
            console.error('headIdx not found near marker');
        }
    } else {
        console.error('Marker not found!');
    }
}

// Now replace amount-table inside printAdmissionChallan
const tableTarget = `<table class="amount-table">
                                        <thead><tr><th>تفصیل</th><th>رقم (روپے)</th></tr></thead>
                                        <tbody>
                                            <tr><td>داخلہ فیس (Admission Fee)</td><td>\${student.admissionFee || 0}</td></tr>
                                            <tr><td>ماہانہ فیس (Monthly Fee)</td><td>\${student.monthlyFee || 0}</td></tr>
                                            <tr class="total-row"><td>کل واجب الادا رقم</td><td>\${total} /-</td></tr>
                                            \${paidAmount > 0 ? \`<tr class="paid-row"><td>وصول شدہ رقم (Received)</td><td>\${paidAmount} /-</td></tr>\` : ''}
                                            \${remaining > 0 ? \`<tr style="color:#dc2626;"><td>بقایا جات (Balance)</td><td>\${remaining} /-</td></tr>\` : ''}
                                        </tbody>
                                    </table>`;

const tableReplacement = `<table class="amount-table">
                                        <thead><tr><th>تفصیل</th><th>رقم (روپے)</th></tr></thead>
                                        <tbody>
                                            <tr><td>داخلہ فیس (Admission Fee)</td><td>\${admFee > 0 ? ('Rs. ' + admFee.toLocaleString()) : (total > 0 && monFee === 0 ? ('Rs. ' + total.toLocaleString()) : '—')}</td></tr>
                                            <tr><td>ماہانہ فیس (Monthly Fee)</td><td>\${monFee > 0 ? ('Rs. ' + monFee.toLocaleString()) : '—'}</td></tr>
                                            <tr class="total-row"><td>کل واجب الادا رقم (Total Dues)</td><td>Rs. \${total.toLocaleString()} /-</td></tr>
                                            \${actualPaid > 0 ? \`<tr class="paid-row" style="background:#f0fdf4; color:#166534;"><td>وصول شدہ رقم (Received)</td><td>Rs. \${actualPaid.toLocaleString()} /-</td></tr>\` : ''}
                                            \${remaining > 0 ? \`<tr style="background:#fef2f2; color:#dc2626; font-size:1.3rem;"><td>داخلہ کے وقت کا بقایا (Admission Arrears)</td><td>Rs. \${remaining.toLocaleString()} /-</td></tr>\` : \`<tr style="background:#f0fdf4; color:#166534;"><td>کیفیت ادائیگی</td><td>مکمل ادا شدہ (بے باق)</td></tr>\`}
                                        </tbody>
                                    </table>`;

if (content.includes(tableTarget)) {
    content = content.replace(tableTarget, tableReplacement);
    console.log('Challan table replaced successfully!');
} else {
    // Replace CRLF variant
    const tableTargetCRLF = tableTarget.replace(/\n/g, '\r\n');
    if (content.includes(tableTargetCRLF)) {
        content = content.replace(tableTargetCRLF, tableReplacement.replace(/\n/g, '\r\n'));
        console.log('Challan table replaced successfully (CRLF)!');
    } else {
        console.warn('Table target not found directly, checking regex...');
        const tableRegex = /<table class="amount-table">[\s\S]*?<\/table>/;
        content = content.replace(tableRegex, tableReplacement);
        console.log('Challan table replaced via regex!');
    }
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('DONE!');
