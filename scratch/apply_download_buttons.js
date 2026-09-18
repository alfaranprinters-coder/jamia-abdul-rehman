const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
const hifzPath = path.join(__dirname, '..', 'hifz.js');

let appContent = fs.readFileSync(appPath, 'utf8');
let hifzContent = fs.readFileSync(hifzPath, 'utf8');

const downloadScriptTag = `<script>
function downloadDoc(filename) {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    const htmlContent = '<!DOCTYPE html>\\n' + clone.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || 'دستاویز') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">`;

// Function to inject helper script before </head> or <style>
function injectScriptInHead(htmlSnippet) {
    if (htmlSnippet.includes('downloadDoc(')) return htmlSnippet;
    if (htmlSnippet.includes('</head>')) {
        return htmlSnippet.replace('</head>', `${downloadScriptTag}\n</head>`);
    }
    return downloadScriptTag + '\n' + htmlSnippet;
}

// 1. Official Receipt HTML
if (appContent.includes('printBlankReceipt()')) {
    appContent = appContent.replace(
        `    <div class="no-print" style="position:fixed; bottom:25px; left:0; right:0; text-align:center; z-index:999;">
        <button onclick="window.print()" style="padding:12px 45px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-family:'Jameel Noori Nastaleeq', 'Noto Sans Urdu', sans-serif; font-weight:bold; box-shadow:0 6px 18px rgba(0,0,0,0.35); display:inline-flex; align-items:center; gap:10px;">
            <i class="fas fa-print"></i> رسید پرنٹ کریں (Print Receipt)
        </button>
    </div>`,
        `    <div class="no-print" style="position:fixed; bottom:25px; left:0; right:0; text-align:center; z-index:999; display:flex; justify-content:center; gap:15px;">
        <button onclick="window.print()" style="padding:12px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-family:'Jameel Noori Nastaleeq', 'Noto Sans Urdu', sans-serif; font-weight:bold; box-shadow:0 6px 18px rgba(0,0,0,0.35); display:inline-flex; align-items:center; gap:10px;">
            <i class="fas fa-print"></i> رسید پرنٹ کریں (Print Receipt)
        </button>
        <button onclick="downloadDoc('\${(options.payeeName || 'رسید').replace(/['\"\\\\s]+/g, '_')}_\${options.receiptNo || ''}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-family:'Jameel Noori Nastaleeq', 'Noto Sans Urdu', sans-serif; font-weight:bold; box-shadow:0 6px 18px rgba(0,0,0,0.35); display:inline-flex; align-items:center; gap:10px;">
            <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Receipt)
        </button>
    </div>`
    );
}

// Add downloadScriptTag to generateOfficialReceiptHtml head
appContent = appContent.replace(
    `<title>\${options.receiptTitle || 'رسید بک'}</title>`,
    `<title>\${options.receiptTitle || 'رسید بک'}</title>\n${downloadScriptTag}`
);

// 2. Student Details Form
appContent = appContent.replace(
    `<title>داخلہ فارم - \${student.name}</title>`,
    `<title>داخلہ فارم - \${student.name}</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="position:fixed; bottom:20px; left:0; right:0; text-align:center; z-index:999;">
                    <button onclick="window.print()" style="padding:12px 45px; background:\${isBanat ? '#9d174d' : '#065f46'}; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-weight:bold; box-shadow:0 6px 15px rgba(0,0,0,0.3); font-family:inherit;">
                        <i class="fas fa-print"></i> پرنٹ کریں (A4)
                    </button>
                </div>`,
    `<div class="no-print" style="position:fixed; bottom:20px; left:0; right:0; text-align:center; z-index:999; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:\${isBanat ? '#9d174d' : '#065f46'}; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-weight:bold; box-shadow:0 6px 15px rgba(0,0,0,0.3); font-family:inherit;">
                        <i class="fas fa-print"></i> پرنٹ کریں (A4)
                    </button>
                    <button onclick="downloadDoc('فارم_طالب_علم_\${student.name ? student.name.replace(/['\"\\\\s]+/g, '_') : 'Student'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-weight:bold; box-shadow:0 6px 15px rgba(0,0,0,0.3); font-family:inherit;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Form)
                    </button>
                </div>`
);

// 3. Attendance Register
appContent = appContent.replace(
    `<title>حاضری رجسٹر - \${className}</title>`,
    `<title>حاضری رجسٹر - \${className}</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:20px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);">پرنٹ رجسٹر (A4 Landscape)</button>
                </div>`,
    `<div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-print"></i> پرنٹ رجسٹر (A4 Landscape)</button>
                    <button onclick="downloadDoc('حاضری_رجسٹر_\${className.replace(/['\"\\\\s]+/g, '_')}')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Register)</button>
                </div>`
);

// 4. Fee Receipt
appContent = appContent.replace(
    `<title>فیس رسید - \${student.name}</title>`,
    `<title>فیس رسید - \${student.name}</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:5px; cursor:pointer; font-size:1.1rem;">پرنٹ کریں</button>
                </div>`,
    `<div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem;"><i class="fas fa-print"></i> پرنٹ کریں</button>
                    <button onclick="downloadDoc('فیس_رسید_\${student.name ? student.name.replace(/['\"\\\\s]+/g, '_') : 'Receipt'}')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>`
);

// 5. Fee Report / Challan
appContent = appContent.replace(
    `<title>فیس چالان رپورٹ</title>`,
    `<title>فیس چالان رپورٹ</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="padding:12px 50px; background:#059669; color:white; border:none; border-radius:30px; font-size:1.2rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);">پرنٹ کریں</button>
                </div>`,
    `<div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#059669; color:white; border:none; border-radius:30px; font-size:1.2rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);"><i class="fas fa-print"></i> پرنٹ کریں</button>
                    <button onclick="downloadDoc('فیس_چالان_رپورٹ')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.2rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>`
);

// 6. Salary Slip
appContent = appContent.replace(
    `<title>تنخواہ سلپ - \${staff.name}</title>`,
    `<title>تنخواہ سلپ - \${staff.name}</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:20px;"><button onclick="window.print()" class="btn btn-primary">پرنٹ کریں</button></div>`,
    `<div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" class="btn btn-primary"><i class="fas fa-print"></i> پرنٹ کریں</button>
                    <button onclick="downloadDoc('تنخواہ_سلپ_\${staff.name ? staff.name.replace(/['\"\\\\s]+/g, '_') : 'Staff'}')" class="btn" style="background:#0284c7; color:white;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>`
);

// 7. Accounts Report
appContent = appContent.replace(
    `<title>حسابات رپورٹ - \${title}</title>`,
    `<title>حسابات رپورٹ - \${title}</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:5px; cursor:pointer; font-size:1.1rem;">رپورٹ پرنٹ کریں</button>
                </div>`,
    `<div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem;"><i class="fas fa-print"></i> رپورٹ پرنٹ کریں</button>
                    <button onclick="downloadDoc('حسابات_رپورٹ')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>`
);

// 8. Staff Card
appContent = appContent.replace(
    `<title>عملہ شناختی کارڈز</title>`,
    `<title>عملہ شناختی کارڈز</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="position:fixed; bottom:20px; left:0; right:0; text-align:center;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.2rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);">پرنٹ کریں (A4)</button>
                </div>`,
    `<div class="no-print" style="position:fixed; bottom:20px; left:0; right:0; text-align:center; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.2rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-print"></i> پرنٹ کریں (A4)</button>
                    <button onclick="downloadDoc('عملہ_شناختی_کارڈز')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.2rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>`
);

// 9. Staff Details
appContent = appContent.replace(
    `<title>تفصیل عملہ - \${s.name}</title>`,
    `<title>تفصیل عملہ - \${s.name}</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);">پرنٹ کریں (A4)</button>
                </div>`,
    `<div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-print"></i> پرنٹ کریں (A4)</button>
                    <button onclick="downloadDoc('فارم_عملہ_\${s.name ? s.name.replace(/['\"\\\\s]+/g, '_') : 'Staff'}')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>`
);

// 10. Date Sheet
appContent = appContent.replace(
    `<title>ڈیٹ شیٹ - \${exam.title}</title>`,
    `<title>ڈیٹ شیٹ - \${exam.title}</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:30px;"><button onclick="window.print()" style="padding:15px 60px; background:#1e3a8a; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;">ڈیٹ شیٹ پرنٹ کریں</button></div>`,
    `<div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#1e3a8a; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;"><i class="fas fa-print"></i> ڈیٹ شیٹ پرنٹ کریں</button>
                    <button onclick="downloadDoc('ڈیٹ_شیٹ_\${exam.title ? exam.title.replace(/['\"\\\\s]+/g, '_') : 'DateSheet'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>`
);

// 11. Result Card
appContent = appContent.replace(
    `<title>رزلٹ کارڈ - \${student.name}</title>`,
    `<title>رزلٹ کارڈ - \${student.name}</title>\n${downloadScriptTag}`
);
appContent = appContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:30px;"><button onclick="window.print()" style="padding:15px 60px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;">رزلٹ کارڈ پرنٹ کریں</button></div>`,
    `<div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;"><i class="fas fa-print"></i> رزلٹ کارڈ پرنٹ کریں</button>
                    <button onclick="downloadDoc('رزلٹ_کارڈ_\${student.name ? student.name.replace(/['\"\\\\s]+/g, '_') : 'ResultCard'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>`
);


// HIFZ.JS replacements:

// 12. Hifz Exam Result Card
hifzContent = hifzContent.replace(
    `<title>امتحانی رزلٹ کارڈ - \${student.name}</title>`,
    `<title>امتحانی رزلٹ کارڈ - \${student.name}</title>\n${downloadScriptTag}`
);
hifzContent = hifzContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:25px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        پرنٹ کریں (Print)
                    </button>
                </div>`,
    `<div class="no-print" style="text-align:center; margin-top:25px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 35px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-print"></i> پرنٹ کریں (Print)
                    </button>
                    <button onclick="downloadDoc('حفظ_رزلٹ_کارڈ_\${student.name ? student.name.replace(/['\"\\\\s]+/g, '_') : 'ResultCard'}')" style="padding:10px 35px; background:#0284c7; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download)
                    </button>
                </div>`
);

// 13. Hifz Parent Report
hifzContent = hifzContent.replace(
    `<title>ماہانہ رپورٹس براءے سرپرست - \${student.name}</title>`,
    `<title>ماہانہ رپورٹس براءے سرپرست - \${student.name}</title>\n${downloadScriptTag}`
);
hifzContent = hifzContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:25px;">
                    <button onclick="window.print()" style="padding:10px 45px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        پرنٹ یا PDF محفوظ کریں
                    </button>
                </div>`,
    `<div class="no-print" style="text-align:center; margin-top:25px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 35px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-print"></i> پرنٹ یا PDF محفوظ کریں
                    </button>
                    <button onclick="downloadDoc('حفظ_سرپرست_رپورٹ_\${student.name ? student.name.replace(/['\"\\\\s]+/g, '_') : 'Report'}')" style="padding:10px 35px; background:#0284c7; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download)
                    </button>
                </div>`
);

// 14. Hifz Certificate
hifzContent = hifzContent.replace(
    `<title>سندِ حفظ القرآن الكريم - \${student.name}</title>`,
    `<title>سندِ حفظ القرآن الكريم - \${student.name}</title>\n${downloadScriptTag}`
);
hifzContent = hifzContent.replace(
    `<div class="no-print" style="text-align:center; margin-top:20px;">
                    <button onclick="window.print()" style="padding:12px 50px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-print"></i> سند پرنٹ فرمائیں (Print Certificate)
                    </button>
                </div>`,
    `<div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-print"></i> سند پرنٹ فرمائیں (Print Certificate)
                    </button>
                    <button onclick="downloadDoc('سند_ختم_قرآن_\${student.name ? student.name.replace(/['\"\\\\s]+/g, '_') : 'Certificate'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Certificate)
                    </button>
                </div>`
);

fs.writeFileSync(appPath, appContent, 'utf8');
fs.writeFileSync(hifzPath, hifzContent, 'utf8');

console.log("Successfully updated app.js and hifz.js with download buttons!");
