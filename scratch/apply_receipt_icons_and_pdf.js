const fs = require('fs');

console.log('--- Applying Receipt Icons, Direct PDF Download, and Removing HTML ---');

// =========================================================================
// 1. CREATE receipt.html
// =========================================================================
const receiptHtmlContent = `<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>رسید - مدرسہ عبد الرحمن بن عوف</title>
</head>
<body style="margin:0; padding:0; background:#0f172a;">
    <script>
        let options = {};
        try {
            const raw = localStorage.getItem('mms_active_receipt');
            if (raw) options = JSON.parse(raw);
        } catch(e) {}

        if (window.opener && window.opener.app && typeof window.opener.app.generateOfficialReceiptHtml === 'function') {
            document.open();
            document.write(window.opener.app.generateOfficialReceiptHtml(options));
            document.close();
        } else {
            const s = document.createElement('script');
            s.src = 'app.js';
            s.onload = function() {
                try {
                    const appInstance = new MadrassahApp();
                    document.open();
                    document.write(appInstance.generateOfficialReceiptHtml(options));
                    document.close();
                } catch(err) {
                    console.error('Error rendering receipt standalone:', err);
                }
            };
            document.head.appendChild(s);
        }
    </script>
</body>
</html>`;

fs.writeFileSync('receipt.html', receiptHtmlContent, 'utf8');
console.log('Created receipt.html successfully.');

// =========================================================================
// 2. UPDATE app.js
// =========================================================================
let appJs = fs.readFileSync('app.js', 'utf8');

// A. Add openReceiptWindow method to MadrassahApp if not present
if (!appJs.includes('openReceiptWindow(options) {')) {
    const target = '    printBlankReceipt() {';
    const openReceiptWindowCode = `    openReceiptWindow(options) {
        try {
            localStorage.setItem('mms_active_receipt', JSON.stringify(options));
            const win = window.open('receipt.html', '_blank');
            if (!win) {
                const fallbackWin = window.open('', '_blank');
                if (fallbackWin) {
                    fallbackWin.document.write(this.generateOfficialReceiptHtml(options));
                    fallbackWin.document.close();
                } else {
                    alert('براہِ کرم براؤزر سے پاپ اپ ونڈو (Pop-up) کی اجازت دیں۔');
                }
            }
        } catch(e) {
            console.warn('openReceiptWindow error, fallback to direct document.write:', e);
            const fallbackWin = window.open('', '_blank');
            if (fallbackWin) {
                fallbackWin.document.write(this.generateOfficialReceiptHtml(options));
                fallbackWin.document.close();
            }
        }
    }

`;
    appJs = appJs.replace(target, openReceiptWindowCode + target);
    console.log('Added openReceiptWindow to MadrassahApp in app.js');
}

// B. Update printBlankReceipt to use openReceiptWindow
appJs = appJs.replace(
`    printBlankReceipt() {
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'رسید بک (Official Receipt)',
            receiptNo: '',
            amount: '',
            amountInWords: '',
            payeeName: '',
            address: '',
            onAccountOf: '',
            dateStr: '',
            receivedBy: '',
            isBlank: true
        });
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
    }`,
`    printBlankReceipt() {
        this.openReceiptWindow({
            receiptTitle: 'رسید بک (Official Receipt)',
            receiptNo: '',
            amount: '',
            amountInWords: '',
            payeeName: '',
            address: '',
            onAccountOf: '',
            dateStr: '',
            receivedBy: '',
            isBlank: true
        });
    }`
);

// C. Update printFeeReceipt to use openReceiptWindow
appJs = appJs.replace(
`        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'فیس وصولی کی رسید (Fee Receipt)',
            receiptNo: fee.receiptNo || 'REC-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: fee.amount,
            amountInWords: amountWords,
            payeeName: payee,
            onAccountOf: purpose,
            dateStr: fee.timestamp || fee.date || ''
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();`,
`        this.openReceiptWindow({
            receiptTitle: 'فیس وصولی کی رسید (Fee Receipt)',
            receiptNo: fee.receiptNo || 'REC-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: fee.amount,
            amountInWords: amountWords,
            payeeName: payee,
            onAccountOf: purpose,
            dateStr: fee.timestamp || fee.date || ''
        });`
);

// D. Update printAdmissionReceipt to use openReceiptWindow
appJs = appJs.replace(
`        const html = this.generateOfficialReceiptHtml({
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
        }`,
`        this.openReceiptWindow({
            receiptTitle: 'داخلہ فیس وصولی رسید (Admission Fee Receipt)',
            receiptNo: receiptNo || ('ADM-' + Math.floor(100000 + Math.random() * 900000)),
            bookNo: '1',
            amount: paidAmount,
            amountInWords: amountWords,
            payeeName: payee,
            address: addr,
            onAccountOf: purpose,
            dateStr: Date.now()
        });`
);

// E. Update printMonthlyReceipt to use openReceiptWindow
appJs = appJs.replace(
`        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'فیس وصولی رسید (Payment Receipt)',
            receiptNo: feeData.receiptNo || 'FEE-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: feeData.amount,
            amountInWords: amountWords,
            payeeName: payee,
            address: student.address || '',
            onAccountOf: purpose,
            dateStr: feeData.date || feeData.timestamp || Date.now()
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();`,
`        this.openReceiptWindow({
            receiptTitle: 'فیس وصولی رسید (Payment Receipt)',
            receiptNo: feeData.receiptNo || 'FEE-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: feeData.amount,
            amountInWords: amountWords,
            payeeName: payee,
            address: student.address || '',
            onAccountOf: purpose,
            dateStr: feeData.date || feeData.timestamp || Date.now()
        });`
);

// F. Update printDonationReceipt to use openReceiptWindow
appJs = appJs.replace(
`        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'ڈونیشن / تعاون کی رسید (Donation Receipt)',
            receiptNo: t.receiptNo || 'DON-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: t.amount,
            amountInWords: amountWords,
            payeeName: payee,
            address: t.address || '',
            onAccountOf: purpose,
            dateStr: t.date || Date.now()
        });

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }`,
`        this.openReceiptWindow({
            receiptTitle: 'ڈونیشن / تعاون کی رسید (Donation Receipt)',
            receiptNo: t.receiptNo || 'DON-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: t.amount,
            amountInWords: amountWords,
            payeeName: payee,
            address: t.address || '',
            onAccountOf: purpose,
            dateStr: t.date || Date.now()
        });`
);

// G. Now update generateOfficialReceiptHtml script and action buttons:
// Find script section in generateOfficialReceiptHtml
const headScriptsMarker = '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>';
const newHeadScripts = `<script src="assets/js/html2canvas.min.js"></script>
    <script src="assets/js/jspdf.umd.min.js"></script>
    <script>
    if (typeof html2canvas === 'undefined') {
        document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\\/script>');
    }
    if (typeof window.jspdf === 'undefined') {
        document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\\/script>');
    }
    </script>`;

if (appJs.includes(headScriptsMarker)) {
    appJs = appJs.replace(headScriptsMarker, newHeadScripts);
    console.log('Updated head scripts in generateOfficialReceiptHtml');
}

// Find downloadReceiptImage and fallbackCanvasDraw in generateOfficialReceiptHtml to add downloadReceiptPdf
const oldDownloadFuncsStart = '    function downloadReceiptImage(filename) {';
const oldDownloadFuncsEnd = '    function downloadDoc(filename) {';

const newDownloadFuncs = `    function downloadReceiptPdf(filename) {
        const btn = document.getElementById('btn-download-pdf');
        const origHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
        }

        const safeName = (filename || 'رسید') + '.pdf';
        const receiptEl = document.querySelector('.receipt-container');

        const doPdfExport = (canvas) => {
            try {
                if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                    console.warn('jsPDF not loaded, fallback to window.print');
                    window.print();
                    return;
                }
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const { jsPDF } = window.jspdf;
                // A5 landscape dimensions: 210mm x 148mm
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a5'
                });
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 148, undefined, 'FAST');

                // 1. Delegate to opener if available
                try {
                    if (window.opener && !window.opener.closed && typeof window.opener.saveBlobOrUrl === 'function') {
                        const blob = pdf.output('blob');
                        window.opener.saveBlobOrUrl(blob, safeName);
                    }
                } catch(e) {}

                // 2. Direct save via jsPDF
                pdf.save(safeName);

                showDownloadToast('پی ڈی ایف محفوظ ہو گئی: ' + safeName);
            } catch(e) {
                console.error('PDF export error:', e);
                window.print();
            } finally {
                if (btn) { btn.innerHTML = origHtml; btn.disabled = false; }
            }
        };

        if (typeof html2canvas !== 'undefined' && receiptEl) {
            html2canvas(receiptEl, {
                scale: 2.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#fbf8f0'
            }).then(canvas => {
                doPdfExport(canvas);
            }).catch(err => {
                console.warn('html2canvas error, fallback to 2D canvas draw:', err);
                fallbackCanvasDraw(safeName, btn, origHtml, (canvas) => doPdfExport(canvas));
            });
        } else {
            fallbackCanvasDraw(safeName, btn, origHtml, (canvas) => doPdfExport(canvas));
        }
    }

    function downloadReceiptImage(filename) {
        const btn = document.getElementById('btn-download-img');
        const origText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
        }

        const safeName = (filename || 'رسید') + '.png';
        const receiptEl = document.querySelector('.receipt-container');

        if (typeof html2canvas !== 'undefined' && receiptEl) {
            html2canvas(receiptEl, {
                scale: 2.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#fbf8f0'
            }).then(canvas => {
                canvas.toBlob(blob => {
                    triggerDownload(blob, safeName);
                    if (btn) { btn.innerHTML = origText; btn.disabled = false; }
                }, 'image/png');
            }).catch(err => {
                console.warn('html2canvas error, fallback to canvas draw:', err);
                fallbackCanvasDraw(safeName, btn, origText);
            });
        } else {
            fallbackCanvasDraw(safeName, btn, origText);
        }
    }

    function fallbackCanvasDraw(safeName, btn, origText, onCanvasReady) {
        try {
            const bgImg = document.querySelector('.receipt-bg');
            const canvas = document.createElement('canvas');
            canvas.width = 1680;
            canvas.height = 954;
            const ctx = canvas.getContext('2d');

            const drawFields = () => {
                const hawala = document.querySelector('.val-hawala');
                const dateDigits = document.querySelector('.val-date .date-digits');
                const name = document.querySelector('.val-name');
                const address = document.querySelector('.val-address');
                const purpose = document.querySelector('.val-purpose');
                const words = document.querySelector('.val-words');
                const amount = document.querySelector('.medallion-amount-text');
                const receiver = document.querySelector('.val-receiver');

                if (hawala && hawala.innerText) {
                    ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
                    ctx.fillStyle = '#1e3a8a';
                    ctx.textAlign = 'center';
                    ctx.fillText(hawala.innerText.trim(), canvas.width * 0.812, canvas.height * 0.33);
                }

                if (dateDigits && dateDigits.innerText) {
                    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
                    ctx.fillStyle = '#0f172a';
                    ctx.textAlign = 'center';
                    ctx.fillText(dateDigits.innerText.trim(), canvas.width * 0.15, canvas.height * 0.33);
                }

                if (name && name.innerText) {
                    ctx.font = 'bold 34px "Jameel Noori Nastaleeq", "Amiri", serif';
                    ctx.fillStyle = '#065f46';
                    ctx.textAlign = 'right';
                    ctx.fillText(name.innerText.trim(), canvas.width * 0.67, canvas.height * 0.435);
                }

                if (address && address.innerText) {
                    ctx.font = 'bold 28px "Jameel Noori Nastaleeq", "Amiri", serif';
                    ctx.fillStyle = '#1e293b';
                    ctx.textAlign = 'right';
                    ctx.fillText(address.innerText.trim(), canvas.width * 0.71, canvas.height * 0.525);
                }

                if (purpose && purpose.innerText) {
                    ctx.font = 'bold 28px "Jameel Noori Nastaleeq", "Amiri", serif';
                    ctx.fillStyle = '#1e293b';
                    ctx.textAlign = 'right';
                    ctx.fillText(purpose.innerText.trim(), canvas.width * 0.71, canvas.height * 0.61);
                }

                if (words && words.innerText) {
                    ctx.font = 'bold 28px "Jameel Noori Nastaleeq", "Amiri", serif';
                    ctx.fillStyle = '#0f172a';
                    ctx.textAlign = 'right';
                    ctx.fillText(words.innerText.trim(), canvas.width * 0.63, canvas.height * 0.695);
                }

                if (amount && amount.innerText) {
                    ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
                    ctx.fillStyle = '#1e3a8a';
                    ctx.textAlign = 'center';
                    ctx.fillText(amount.innerText.trim(), canvas.width * 0.815, canvas.height * 0.85);
                }

                if (receiver && receiver.innerText) {
                    ctx.font = 'bold 26px "Jameel Noori Nastaleeq", "Amiri", serif';
                    ctx.fillStyle = '#0f172a';
                    ctx.textAlign = 'center';
                    ctx.fillText(receiver.innerText.trim(), canvas.width * 0.18, canvas.height * 0.85);
                }

                if (typeof onCanvasReady === 'function') {
                    onCanvasReady(canvas);
                    return;
                }

                canvas.toBlob(blob => {
                    triggerDownload(blob, safeName);
                    if (btn) { btn.innerHTML = origText; btn.disabled = false; }
                }, 'image/png');
            };

            if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
                ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                drawFields();
            } else if (bgImg) {
                bgImg.onload = () => {
                    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                    drawFields();
                };
            } else {
                drawFields();
            }
        } catch(e) {
            console.error('Fallback canvas draw failed:', e);
            if (btn) { btn.innerHTML = origText; btn.disabled = false; }
            window.print();
        }
    }

`;

if (appJs.includes(oldDownloadFuncsStart) && appJs.includes(oldDownloadFuncsEnd)) {
    const p1 = appJs.indexOf(oldDownloadFuncsStart);
    const p2 = appJs.indexOf(oldDownloadFuncsEnd);
    appJs = appJs.substring(0, p1) + newDownloadFuncs + appJs.substring(p2);
    console.log('Updated download functions in generateOfficialReceiptHtml');
}

// H. Remove HTML button and bulky text banner, replace with 3 clean floating circular icon buttons
const oldButtonsMarkerStart = '    <!-- Guidance Tip for PDF -->';
const oldButtonsMarkerEnd = '</body>\n</html>`;';

const safeFilenameExpr = `\${options.payeeName ? options.payeeName.replace(/['"\\\\s]+/g, '_') : 'رسید'}_\${options.receiptNo || ''}`;

const newCleanButtons = `    <!-- Floating Icon-Only Action Buttons (No HTML, Pure Icons) -->
    <div class="no-print" style="position:fixed; bottom:25px; left:50%; transform:translateX(-50%); z-index:99999; display:flex; align-items:center; gap:16px; background:rgba(15,23,42,0.88); backdrop-filter:blur(10px); padding:10px 22px; border-radius:50px; box-shadow:0 10px 35px rgba(0,0,0,0.4); border:1.5px solid rgba(255,255,255,0.18);">
        <!-- 1. Print / Save as PDF Button -->
        <button onclick="window.print()" title="پرنٹ / Save as PDF" style="width:52px; height:52px; border-radius:50%; background:#065f46; color:white; border:none; cursor:pointer; font-size:1.4rem; display:flex; align-items:center; justify-content:center; transition:all 0.2s ease-in-out; box-shadow:0 4px 15px rgba(6,95,70,0.45);" onmouseover="this.style.transform='scale(1.15)'; this.style.background='#047857';" onmouseout="this.style.transform='scale(1)'; this.style.background='#065f46';">
            <i class="fas fa-print"></i>
        </button>

        <!-- 2. Direct PDF File Download Button -->
        <button id="btn-download-pdf" onclick="downloadReceiptPdf('${safeFilenameExpr}')" title="پی ڈی ایف فائل ڈاؤن لوڈ کریں (Download PDF File)" style="width:52px; height:52px; border-radius:50%; background:#dc2626; color:white; border:none; cursor:pointer; font-size:1.4rem; display:flex; align-items:center; justify-content:center; transition:all 0.2s ease-in-out; box-shadow:0 4px 15px rgba(220,38,38,0.45);" onmouseover="this.style.transform='scale(1.15)'; this.style.background='#b91c1c';" onmouseout="this.style.transform='scale(1)'; this.style.background='#dc2626';">
            <i class="fas fa-file-pdf"></i>
        </button>

        <!-- 3. Direct Image (PNG) Download Button -->
        <button id="btn-download-img" onclick="downloadReceiptImage('${safeFilenameExpr}')" title="تصویر محفوظ کریں (Download PNG Image)" style="width:52px; height:52px; border-radius:50%; background:#0284c7; color:white; border:none; cursor:pointer; font-size:1.4rem; display:flex; align-items:center; justify-content:center; transition:all 0.2s ease-in-out; box-shadow:0 4px 15px rgba(2,132,199,0.45);" onmouseover="this.style.transform='scale(1.15)'; this.style.background='#0369a1';" onmouseout="this.style.transform='scale(1)'; this.style.background='#0284c7';">
            <i class="fas fa-image"></i>
        </button>
    </div>
</body>
</html>\`;`;

if (appJs.includes(oldButtonsMarkerStart)) {
    const b1 = appJs.indexOf(oldButtonsMarkerStart);
    const b2 = appJs.indexOf(oldButtonsMarkerEnd, b1);
    if (b2 !== -1) {
        appJs = appJs.substring(0, b1) + newCleanButtons + appJs.substring(b2 + oldButtonsMarkerEnd.length);
        console.log('Replaced bottom bar with icon-only buttons (removed HTML & text banner) in app.js');
    }
}

// Remove downloadDoc function if present since HTML button is removed
if (appJs.includes('function downloadDoc(filename) {')) {
    appJs = appJs.replace(/    function downloadDoc\(filename\) \{[\s\S]*?    \}\n/g, '');
    console.log('Removed downloadDoc (HTML download) function from app.js');
}

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('app.js written successfully.');

// =========================================================================
// 3. UPDATE donors.js
// =========================================================================
let donorsJs = fs.readFileSync('donors.js', 'utf8');

donorsJs = donorsJs.replace(
`        if (window.app && typeof window.app.generateOfficialReceiptHtml === 'function') {
            const html = window.app.generateOfficialReceiptHtml({
                receiptTitle: 'رسیدِ عطیہ برائے مستقل معاونین (Permanent Donor Receipt)',
                receiptNo: d.receiptNo || ('DNR-' + d.id),
                bookNo: '1',
                amount: d.amount,
                amountInWords: amountWords,
                payeeName: payee,
                address: address,
                onAccountOf: purpose,
                dateStr: d.paymentDate || d.createdAt || Date.now(),
                receivedBy: d.receivedBy || 'ناظم مالیات / خازن'
            });

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.focus();
            } else {
                alert('براہِ کرم براؤزر سے پاپ اپ ونڈو (Pop-up) کی اجازت دیں۔');
            }
        }`,
`        if (window.app && typeof window.app.openReceiptWindow === 'function') {
            window.app.openReceiptWindow({
                receiptTitle: 'رسیدِ عطیہ برائے مستقل معاونین (Permanent Donor Receipt)',
                receiptNo: d.receiptNo || ('DNR-' + d.id),
                bookNo: '1',
                amount: d.amount,
                amountInWords: amountWords,
                payeeName: payee,
                address: address,
                onAccountOf: purpose,
                dateStr: d.paymentDate || d.createdAt || Date.now(),
                receivedBy: d.receivedBy || 'ناظم مالیات / خازن'
            });
        } else if (window.app && typeof window.app.generateOfficialReceiptHtml === 'function') {
            const html = window.app.generateOfficialReceiptHtml({
                receiptTitle: 'رسیدِ عطیہ برائے مستقل معاونین (Permanent Donor Receipt)',
                receiptNo: d.receiptNo || ('DNR-' + d.id),
                bookNo: '1',
                amount: d.amount,
                amountInWords: amountWords,
                payeeName: payee,
                address: address,
                onAccountOf: purpose,
                dateStr: d.paymentDate || d.createdAt || Date.now(),
                receivedBy: d.receivedBy || 'ناظم مالیات / خازن'
            });
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            }
        }`
);

fs.writeFileSync('donors.js', donorsJs, 'utf8');
console.log('donors.js written successfully.');

// =========================================================================
// 4. UPDATE index.html (use local scripts)
// =========================================================================
let indexHtml = fs.readFileSync('index.html', 'utf8');
if (indexHtml.includes('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')) {
    indexHtml = indexHtml.replace(
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>',
        '<script src="assets/js/html2canvas.min.js"></script>\n    <script src="assets/js/jspdf.umd.min.js"></script>'
    );
    fs.writeFileSync('index.html', indexHtml, 'utf8');
    console.log('index.html updated with local html2canvas and jspdf scripts.');
}

console.log('--- All changes completed! ---');
