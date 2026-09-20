const fs = require('fs');
const path = require('path');

console.log('--- Applying Receipt Download Fixes ---');

// =========================================================================
// 1. UPDATE app.js
// =========================================================================
let appJs = fs.readFileSync('app.js', 'utf8');

// A. Insert window.saveBlobOrUrl before class MadrassahApp if not present
if (!appJs.includes('window.saveBlobOrUrl = function')) {
    const classMarker = 'class MadrassahApp {';
    const downloaderCode = `
// Universal Downloader for Receipts & Documents (Handles Blobs, DataURIs, and Opener Delegation)
window.saveBlobOrUrl = function(blobOrDataUrl, filename) {
    try {
        let downloadUrl = blobOrDataUrl;
        let isBlob = false;
        if (blobOrDataUrl instanceof Blob) {
            downloadUrl = URL.createObjectURL(blobOrDataUrl);
            isBlob = true;
        }
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename || 'رسید.png';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            if (a.parentNode) a.parentNode.removeChild(a);
            if (isBlob) URL.revokeObjectURL(downloadUrl);
        }, 30000);
        return true;
    } catch(err) {
        console.error('saveBlobOrUrl error:', err);
        return false;
    }
};

window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'SAVE_RECEIPT_DOWNLOAD') {
        window.saveBlobOrUrl(e.data.dataUrl, e.data.filename);
    }
});

`;
    appJs = appJs.replace(classMarker, downloaderCode + classMarker);
    console.log('Added window.saveBlobOrUrl to app.js');
}

// B. Add download methods in MadrassahApp (downloadReceiptImageDirect, downloadBlankReceipt, downloadFeeReceipt, downloadDonationReceipt)
if (!appJs.includes('downloadReceiptImageDirect(options)')) {
    const printBlankMarker = 'printBlankReceipt() {';
    const directDownloadMethods = `    async downloadReceiptImageDirect(options) {
        return new Promise((resolve, reject) => {
            try {
                const isBlank = !!options.isBlank;
                const numAmount = options.amount ? Number(options.amount).toLocaleString('en-US') : '';
                let dateVal = '';
                if (!isBlank) {
                    let raw = options.dateStr;
                    let d = null;
                    if (raw) {
                        if (raw instanceof Date) d = raw;
                        else if (typeof raw === 'number') d = new Date(raw);
                        else if (typeof raw === 'string') {
                            const m = raw.match(/^(\\d{1,4})[\\/\\-\\.](\\d{1,2})[\\/\\-\\.](\\d{1,4})$/);
                            if (m) {
                                let p1 = m[1], p2 = m[2], p3 = m[3];
                                if (p1.length === 4) dateVal = \`\${p3.padStart(2, '0')} / \${p2.padStart(2, '0')} / \${p1}\`;
                                else {
                                    let yr = p3.length === 2 ? '20' + p3 : p3;
                                    dateVal = \`\${p1.padStart(2, '0')} / \${p2.padStart(2, '0')} / \${yr}\`;
                                }
                            } else {
                                const parsed = new Date(raw);
                                if (!isNaN(parsed.getTime())) d = parsed;
                                else dateVal = raw;
                            }
                        }
                    }
                    if (!dateVal) {
                        if (!d || isNaN(d.getTime())) d = new Date();
                        const dd = String(d.getDate()).padStart(2, '0');
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const yyyy = d.getFullYear();
                        dateVal = \`\${dd} / \${mm} / \${yyyy}\`;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = 1680;
                canvas.height = 954;
                const ctx = canvas.getContext('2d');

                const bgImg = new Image();
                bgImg.onload = () => {
                    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

                    // 1. Hawala / Receipt No
                    if (options.receiptNo) {
                        ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
                        ctx.fillStyle = '#1e3a8a';
                        ctx.textAlign = 'center';
                        ctx.fillText(String(options.receiptNo).trim(), canvas.width * 0.812, canvas.height * 0.33);
                    }

                    // 2. Date
                    if (!isBlank && dateVal) {
                        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
                        ctx.fillStyle = '#0f172a';
                        ctx.textAlign = 'center';
                        ctx.fillText(dateVal.trim(), canvas.width * 0.15, canvas.height * 0.33);
                    }

                    // 3. Payee Name
                    if (options.payeeName) {
                        ctx.font = 'bold 34px "Jameel Noori Nastaleeq", "Amiri", serif';
                        ctx.fillStyle = '#065f46';
                        ctx.textAlign = 'right';
                        ctx.fillText(String(options.payeeName).trim(), canvas.width * 0.67, canvas.height * 0.435);
                    }

                    // 4. Address
                    const addr = options.address !== undefined && options.address !== '' ? options.address : 'بوسال کالونی، ضلع خانیوال';
                    if (addr) {
                        ctx.font = 'bold 28px "Jameel Noori Nastaleeq", "Amiri", serif';
                        ctx.fillStyle = '#1e293b';
                        ctx.textAlign = 'right';
                        ctx.fillText(String(addr).trim(), canvas.width * 0.71, canvas.height * 0.525);
                    }

                    // 5. Purpose (On account of)
                    if (options.onAccountOf) {
                        ctx.font = 'bold 28px "Jameel Noori Nastaleeq", "Amiri", serif';
                        ctx.fillStyle = '#1e293b';
                        ctx.textAlign = 'right';
                        ctx.fillText(String(options.onAccountOf).trim(), canvas.width * 0.71, canvas.height * 0.61);
                    }

                    // 6. Amount in words
                    if (options.amountInWords) {
                        ctx.font = 'bold 28px "Jameel Noori Nastaleeq", "Amiri", serif';
                        ctx.fillStyle = '#0f172a';
                        ctx.textAlign = 'right';
                        ctx.fillText(String(options.amountInWords).trim(), canvas.width * 0.63, canvas.height * 0.695);
                    }

                    // 7. Amount in medallion
                    if (numAmount) {
                        ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
                        ctx.fillStyle = '#1e3a8a';
                        ctx.textAlign = 'center';
                        ctx.fillText(numAmount.trim(), canvas.width * 0.815, canvas.height * 0.85);
                    }

                    // 8. Receiver
                    const rec = options.receivedBy || 'ناظم مالیات / سیکرٹری';
                    ctx.font = 'bold 26px "Jameel Noori Nastaleeq", "Amiri", serif';
                    ctx.fillStyle = '#0f172a';
                    ctx.textAlign = 'center';
                    ctx.fillText(rec.trim(), canvas.width * 0.18, canvas.height * 0.85);

                    const finishDownload = () => {
                        const safeName = \`\${options.payeeName ? options.payeeName.replace(/['"\\\\s]+/g, '_') : 'رسید'}_\${options.receiptNo || ''}.png\`;
                        const dataUrl = canvas.toDataURL('image/png');
                        window.saveBlobOrUrl(dataUrl, safeName);
                        resolve(true);
                    };

                    // 9. Official signature overlay if available
                    if (!isBlank && typeof RECEIPT_SIGNATURE_URI !== 'undefined' && RECEIPT_SIGNATURE_URI) {
                        const sigImg = new Image();
                        sigImg.onload = () => {
                            ctx.drawImage(sigImg, canvas.width * 0.12, canvas.height * 0.76, 170, 75);
                            finishDownload();
                        };
                        sigImg.onerror = () => {
                            finishDownload();
                        };
                        sigImg.src = RECEIPT_SIGNATURE_URI;
                        return;
                    }

                    finishDownload();
                };
                bgImg.onerror = (e) => {
                    console.error('Failed to load receipt background for direct download', e);
                    reject(e);
                };
                bgImg.src = RECEIPT_BLANK_URI;
            } catch(err) {
                console.error('downloadReceiptImageDirect error:', err);
                reject(err);
            }
        });
    }

    downloadBlankReceipt() {
        return this.downloadReceiptImageDirect({
            receiptTitle: 'رسید بک (Official Receipt)',
            receiptNo: '',
            amount: '',
            amountInWords: '',
            payeeName: 'خالی_رسید',
            address: '',
            onAccountOf: '',
            dateStr: '',
            receivedBy: '',
            isBlank: true
        });
    }

    downloadFeeReceipt(fee) {
        const amountWords = this.numberToUrduWords(fee.amount);
        const payee = \`\${fee.studentName || '---'} \${fee.fatherName ? 'ولد ' + fee.fatherName : ''}\`;
        const purpose = \`\${fee.feeType || 'فیس'} \${fee.month ? ' (برائے ' + fee.month + ')' : ''} \${fee.className ? '- درجہ ' + fee.className : ''}\`;
        
        return this.downloadReceiptImageDirect({
            receiptTitle: 'فیس وصولی کی رسید (Fee Receipt)',
            receiptNo: fee.receiptNo || 'REC-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: fee.amount,
            amountInWords: amountWords,
            payeeName: payee,
            onAccountOf: purpose,
            dateStr: fee.timestamp || fee.date || ''
        });
    }

    async downloadDonationReceipt(id) {
        const txs = await MadrassahDB.getAllTransactions();
        const t = txs.find(x => x.id === id);
        if (!t) return;
        
        const amountWords = this.numberToUrduWords(t.amount);
        const payee = t.name ? (t.name + (t.phone ? \` (\${t.phone})\` : '')) : 'عام تعاون کنندہ';
        const purpose = \`\${t.category || 'عطیات / زکوٰۃ / صدقات'} \${t.description ? '(' + t.description + ')' : ''}\`;
        
        return this.downloadReceiptImageDirect({
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
    }

`;
    appJs = appJs.replace(printBlankMarker, directDownloadMethods + printBlankMarker);
    console.log('Added direct download methods to MadrassahApp in app.js');
}

// C. Update triggerDownload inside generateOfficialReceiptHtml
const oldTriggerStart = '    function triggerDownload(blobOrDataUrl, filename) {';
const oldTriggerEnd = '    function downloadReceiptImage(filename) {';
const newTriggerCode = `    function triggerDownload(blobOrDataUrl, filename) {
        if (blobOrDataUrl instanceof Blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                executeDownload(reader.result, filename);
            };
            reader.readAsDataURL(blobOrDataUrl);
        } else {
            executeDownload(blobOrDataUrl, filename);
        }
    }

    function executeDownload(dataUrl, filename) {
        let saved = false;
        // 1. Delegate directly to opener
        try {
            if (window.opener && !window.opener.closed && typeof window.opener.saveBlobOrUrl === 'function') {
                window.opener.saveBlobOrUrl(dataUrl, filename);
                saved = true;
            }
        } catch(e) {
            console.warn('Opener saveBlobOrUrl error:', e);
        }

        // 2. PostMessage to opener
        if (!saved) {
            try {
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({ type: 'SAVE_RECEIPT_DOWNLOAD', dataUrl: dataUrl, filename: filename }, '*');
                    saved = true;
                }
            } catch(e) {
                console.warn('postMessage error:', e);
            }
        }

        // 3. Direct browser anchor download with data URL
        try {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 10000);
        } catch(err) {
            console.error('Direct download error:', err);
        }

        // Show toast notification
        showDownloadToast(filename);
    }

    function showDownloadToast(filename) {
        let toast = document.getElementById('receipt-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'receipt-toast';
            toast.className = 'no-print';
            toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#065f46; color:white; padding:12px 28px; border-radius:30px; font-family:"Segoe UI", Arial, sans-serif; font-size:1.1rem; font-weight:bold; box-shadow:0 6px 20px rgba(0,0,0,0.3); z-index:99999; display:flex; align-items:center; gap:10px;';
            toast.innerHTML = '<i class="fas fa-check-circle" style="color:#4ade80; font-size:1.3rem;"></i> <span>رسید فائل ڈاؤن لوڈ ہو رہی ہے: ' + filename + '</span>';
            document.body.appendChild(toast);
        }
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }

`;

if (appJs.includes(oldTriggerStart) && appJs.includes(oldTriggerEnd)) {
    const p1 = appJs.indexOf(oldTriggerStart);
    const p2 = appJs.indexOf(oldTriggerEnd);
    appJs = appJs.substring(0, p1) + newTriggerCode + appJs.substring(p2);
    console.log('Updated triggerDownload inside generateOfficialReceiptHtml in app.js');
}

// D. Add "خالی رسید بک ڈاؤن لوڈ کریں" in renderFeeModule header
const oldFeeBtn = '<button class="btn btn-primary" onclick="app.printBlankReceipt()"><i class="fas fa-receipt"></i> \\u062E\\u0627\\u0644\\u06CC \\u0631\\u0633\\u06CC\\u062F \\u067E\\u0631\\u0646\\u0679 \\u06A9\\u0631\\u06CC\\u06BA</button>';
const newFeeBtns = `<div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="app.printBlankReceipt()"><i class="fas fa-print"></i> خالی رسید پرنٹ / PDF</button>
                    <button class="btn" style="background:#059669; color:white;" onclick="app.downloadBlankReceipt()"><i class="fas fa-download"></i> خالی رسید بک ڈاؤن لوڈ کریں</button>
                </div>`;
if (appJs.includes(oldFeeBtn)) {
    appJs = appJs.replace(oldFeeBtn, newFeeBtns);
    console.log('Updated Fee module header with download button in app.js');
}

// E. Add download button in fees table
const oldFeeTableBtn = '<button class="btn btn-sm" onclick="app.printFeeReceipt(${JSON.stringify(f).replace(/"/g, \'&quot;\')})"><i class="fas fa-print"></i> رسید</button>';
const newFeeTableBtn = `<button class="btn btn-sm" onclick="app.printFeeReceipt(\${JSON.stringify(f).replace(/"/g, '&quot;')})" title="رسید پرنٹ / PDF"><i class="fas fa-print"></i> رسید</button>
                                    <button class="btn btn-sm" style="background:#059669; color:white; margin-right:4px;" onclick="app.downloadFeeReceipt(\${JSON.stringify(f).replace(/"/g, '&quot;')})" title="رسید تصویر ڈاؤن لوڈ کریں"><i class="fas fa-download"></i></button>`;
if (appJs.includes(oldFeeTableBtn)) {
    appJs = appJs.replace(oldFeeTableBtn, newFeeTableBtn);
    console.log('Added download button to fee history table in app.js');
}

// F. Add download button in finance transactions table
const oldFinanceBtn = '${t.type === \'Income\' ? `<button class="btn btn-sm" onclick="app.printDonationReceipt(${t.id})" title="رسید"><i class="fas fa-print"></i></button>` : \'\'}';
const newFinanceBtn = '${t.type === \'Income\' ? `<button class="btn btn-sm" onclick="app.printDonationReceipt(${t.id})" title="رسید پرنٹ / PDF"><i class="fas fa-print"></i></button> <button class="btn btn-sm" style="background:#059669; color:white; margin-right:4px;" onclick="app.downloadDonationReceipt(${t.id})" title="رسید تصویر ڈاؤن لوڈ کریں"><i class="fas fa-download"></i></button>` : \'\'}';
if (appJs.includes(oldFinanceBtn)) {
    appJs = appJs.replace(oldFinanceBtn, newFinanceBtn);
    console.log('Added download button to finance table in app.js');
}

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('app.js written successfully.');

// =========================================================================
// 2. UPDATE donors.js
// =========================================================================
let donorsJs = fs.readFileSync('donors.js', 'utf8');

// A. In showInstantReceiptModal, add direct download button
const oldModalBtn = `<button onclick="DonorsModule.printDonationReceipt('\${donation.id}')" class="btn" style="background:#0284c7; color:white; font-size:1.1rem; font-weight:bold; padding:12px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(2,132,199,0.3);">
                                <i class="fas fa-print"></i> باضابطہ رسید پرنٹ کریں (Print Official A5 Receipt)
                            </button>`;
const newModalBtn = `<button onclick="DonorsModule.printDonationReceipt('\${donation.id}')" class="btn" style="background:#0284c7; color:white; font-size:1.1rem; font-weight:bold; padding:12px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(2,132,199,0.3);">
                                <i class="fas fa-print"></i> باضابطہ رسید پرنٹ / PDF (Print / Save PDF)
                            </button>
                            <button onclick="DonorsModule.downloadDonationReceipt('\${donation.id}')" class="btn" style="background:#059669; color:white; font-size:1.05rem; font-weight:bold; padding:12px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(5,150,105,0.3);">
                                <i class="fas fa-file-arrow-down"></i> رسید کی تصویر ڈاؤن لوڈ کریں (Download PNG Image)
                            </button>`;
if (donorsJs.includes(oldModalBtn)) {
    donorsJs = donorsJs.replace(oldModalBtn, newModalBtn);
    console.log('Added direct image download button to instant receipt modal in donors.js');
}

// B. In ledger table, add download button
const oldLedgerBtn = `<button onclick="DonorsModule.printDonationReceipt('\${d.id}')" class="btn" style="background:#0284c7; color:white; border:none; padding:4px 10px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="رسید پرنٹ کریں">
                                                <i class="fas fa-print"></i> رسید
                                            </button>`;
const newLedgerBtn = `<button onclick="DonorsModule.printDonationReceipt('\${d.id}')" class="btn" style="background:#0284c7; color:white; border:none; padding:4px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="رسید پرنٹ / PDF">
                                                <i class="fas fa-print"></i> رسید
                                            </button>
                                            <button onclick="DonorsModule.downloadDonationReceipt('\${d.id}')" class="btn" style="background:#059669; color:white; border:none; padding:4px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer;" title="رسید تصویر ڈاؤن لوڈ کریں">
                                                <i class="fas fa-download"></i> ڈاؤن لوڈ
                                            </button>`;
if (donorsJs.includes(oldLedgerBtn)) {
    donorsJs = donorsJs.replace(oldLedgerBtn, newLedgerBtn);
    console.log('Added download button to donation ledger table in donors.js');
}

// C. In monthly cards, add download button
const oldMonthCardBtn = `<button onclick="DonorsModule.printDonationReceipt('\${don.id}')" title="رسید پرنٹ کریں" style="background:#dcfce7; border:none; color:#15803d; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8rem;">
                                                            <i class="fas fa-print"></i> رسید
                                                        </button>`;
const newMonthCardBtn = `<button onclick="DonorsModule.printDonationReceipt('\${don.id}')" title="رسید پرنٹ / PDF" style="background:#dcfce7; border:none; color:#15803d; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8rem;">
                                                            <i class="fas fa-print"></i> رسید
                                                        </button>
                                                        <button onclick="DonorsModule.downloadDonationReceipt('\${don.id}')" title="رسید تصویر ڈاؤن لوڈ کریں" style="background:#d1fae5; border:none; color:#065f46; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8rem;">
                                                            <i class="fas fa-download"></i>
                                                        </button>`;
if (donorsJs.includes(oldMonthCardBtn)) {
    donorsJs = donorsJs.replace(oldMonthCardBtn, newMonthCardBtn);
    console.log('Added download button to monthly donor cards in donors.js');
}

// D. Add downloadDonationReceipt method to DonorsModule
if (!donorsJs.includes('downloadDonationReceipt(donationId)')) {
    const printMethodMarker = '    async printDonationReceipt(donationId) {';
    const downloadMethodCode = `    async downloadDonationReceipt(donationId) {
        const donations = await MadrassahDB.getAllDonorDonations();
        const d = donations.find(item => String(item.id) === String(donationId) || parseInt(item.id) === parseInt(donationId));
        if (!d) {
            alert('رسید کا ریکارڈ نہیں مل سکا!');
            return;
        }

        const donor = await MadrassahDB.getDonorById(d.donorId);
        const donorName = donor ? donor.name : (d.donorName || 'معاون محترم');
        const fatherName = donor ? donor.fatherName : '';
        const payee = \`\${donorName} \${fatherName ? 'ولد ' + fatherName : ''} [\${donor ? (donor.donorCode || '') : ''}]\`;
        const address = donor ? [donor.address, donor.city].filter(Boolean).join('، ') : '';
        const monthName = d.monthName || this.getMonthName(d.monthIndex);
        const purpose = \`ماہانہ معاونت بابت ماہ \${monthName} \${d.year}ء [مد: \${d.fundType || 'عام عطیہ'}]\` + (d.paymentMethod ? ' — بذریعہ: ' + d.paymentMethod : '') + (donor && donor.whatsapp ? ' (واٹس ایپ: ' + donor.whatsapp + ')' : '');

        const amountWords = (window.app && typeof window.app.numberToUrduWords === 'function') 
            ? window.app.numberToUrduWords(d.amount) 
            : \`\${d.amount} روپے صرف\`;

        if (window.app && typeof window.app.downloadReceiptImageDirect === 'function') {
            await window.app.downloadReceiptImageDirect({
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
        } else {
            this.printDonationReceipt(donationId);
        }
    },

`;
    donorsJs = donorsJs.replace(printMethodMarker, downloadMethodCode + printMethodMarker);
    console.log('Added downloadDonationReceipt method to DonorsModule in donors.js');
}

fs.writeFileSync('donors.js', donorsJs, 'utf8');
console.log('donors.js written successfully.');
console.log('--- All receipt download fixes applied! ---');
