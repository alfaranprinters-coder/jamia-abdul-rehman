$appPath = "d:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js"
$hifzPath = "d:\Project\managment Softwares\madrsa abdul rehman bin auf\hifz.js"

$appContent = [System.IO.File]::ReadAllText($appPath)
$hifzContent = [System.IO.File]::ReadAllText($hifzPath)

$downloadScriptTag = @"
<script>
function downloadDoc(filename) {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
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
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
"@

# Helper to inject downloadScriptTag before </head> or after <title>
function Inject-HeadTag([string]$code, [string]$titleSearch) {
    if ($code.Contains($titleSearch)) {
        return $code.Replace($titleSearch, "$titleSearch`n$downloadScriptTag")
    }
    return $code
}

# 1. Receipt Book
$oldReceiptBtn = @"
    <div class="no-print" style="position:fixed; bottom:25px; left:0; right:0; text-align:center; z-index:999;">
        <button onclick="window.print()" style="padding:12px 45px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-family:'Jameel Noori Nastaleeq', 'Noto Sans Urdu', sans-serif; font-weight:bold; box-shadow:0 6px 18px rgba(0,0,0,0.35); display:inline-flex; align-items:center; gap:10px;">
            <i class="fas fa-print"></i> رسید پرنٹ کریں (Print Receipt)
        </button>
    </div>
"@

$newReceiptBtn = @"
    <div class="no-print" style="position:fixed; bottom:25px; left:0; right:0; text-align:center; z-index:999; display:flex; justify-content:center; gap:15px;">
        <button onclick="window.print()" style="padding:12px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-family:'Jameel Noori Nastaleeq', 'Noto Sans Urdu', sans-serif; font-weight:bold; box-shadow:0 6px 18px rgba(0,0,0,0.35); display:inline-flex; align-items:center; gap:10px;">
            <i class="fas fa-print"></i> رسید پرنٹ کریں (Print Receipt)
        </button>
        <button onclick="downloadDoc('${options.payeeName ? options.payeeName.replace(/\s+/g, '_') : 'رسید'}_${options.receiptNo || ''}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-family:'Jameel Noori Nastaleeq', 'Noto Sans Urdu', sans-serif; font-weight:bold; box-shadow:0 6px 18px rgba(0,0,0,0.35); display:inline-flex; align-items:center; gap:10px;">
            <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Receipt)
        </button>
    </div>
"@

$appContent = Inject-HeadTag $appContent "<title>`${options.receiptTitle || 'رسید بک'}</title>"
$appContent = $appContent.Replace($oldReceiptBtn, $newReceiptBtn)

# 2. Student Details
$oldStudDetailsBtn = @"
                <div class="no-print" style="position:fixed; bottom:20px; left:0; right:0; text-align:center; z-index:999;">
                    <button onclick="window.print()" style="padding:12px 45px; background:`${isBanat ? '#9d174d' : '#065f46'}; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-weight:bold; box-shadow:0 6px 15px rgba(0,0,0,0.3); font-family:inherit;">
                        <i class="fas fa-print"></i> پرنٹ کریں (A4)
                    </button>
                </div>
"@

$newStudDetailsBtn = @"
                <div class="no-print" style="position:fixed; bottom:20px; left:0; right:0; text-align:center; z-index:999; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:`${isBanat ? '#9d174d' : '#065f46'}; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-weight:bold; box-shadow:0 6px 15px rgba(0,0,0,0.3); font-family:inherit;">
                        <i class="fas fa-print"></i> پرنٹ کریں (A4)
                    </button>
                    <button onclick="downloadDoc('فارم_طالب_علم_${student.name ? student.name.replace(/\s+/g, '_') : 'Student'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.25rem; font-weight:bold; box-shadow:0 6px 15px rgba(0,0,0,0.3); font-family:inherit;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Form)
                    </button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>داخلہ فارم - `${student.name}</title>"
$appContent = $appContent.Replace($oldStudDetailsBtn, $newStudDetailsBtn)

# 3. Attendance Register
$oldAttRegBtn = @"
                <div class="no-print" style="text-align:center; margin-top:20px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);">پرنٹ رجسٹر (A4 Landscape)</button>
                </div>
"@

$newAttRegBtn = @"
                <div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-print"></i> پرنٹ رجسٹر (A4 Landscape)</button>
                    <button onclick="downloadDoc('حاضری_رجسٹر_${className.replace(/\s+/g, '_')}')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Register)</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>حاضری رجسٹر - `${className}</title>"
$appContent = $appContent.Replace($oldAttRegBtn, $newAttRegBtn)

# 4. Fee Receipt
$oldFeeReceiptBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:5px; cursor:pointer; font-size:1.1rem;">پرنٹ کریں</button>
                </div>
"@

$newFeeReceiptBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem; color:white;"><i class="fas fa-print"></i> پرنٹ کریں</button>
                    <button onclick="downloadDoc('فیس_رسید_${student.name ? student.name.replace(/\s+/g, '_') : 'Receipt'}')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem; color:white;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>فیس رسید - `${student.name}</title>"
$appContent = $appContent.Replace($oldFeeReceiptBtn, $newFeeReceiptBtn)

# 5. Fee Report
$oldFeeReportBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="padding:12px 50px; background:#059669; color:white; border:none; border-radius:30px; font-size:1.2rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);">پرنٹ کریں</button>
                </div>
"@

$newFeeReportBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#059669; color:white; border:none; border-radius:30px; font-size:1.2rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);"><i class="fas fa-print"></i> پرنٹ کریں</button>
                    <button onclick="downloadDoc('فیس_چالان_رپورٹ')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.2rem; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>فیس چالان رپورٹ</title>"
$appContent = $appContent.Replace($oldFeeReportBtn, $newFeeReportBtn)

# 6. Salary Slip
$oldSalaryBtn = @"
                <div class="no-print" style="text-align:center; margin-top:20px;"><button onclick="window.print()" class="btn btn-primary">پرنٹ کریں</button></div>
"@

$newSalaryBtn = @"
                <div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" class="btn btn-primary"><i class="fas fa-print"></i> پرنٹ کریں</button>
                    <button onclick="downloadDoc('تنخواہ_سلپ_${staff.name ? staff.name.replace(/\s+/g, '_') : 'Staff'}')" class="btn" style="background:#0284c7; color:white;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>تنخواہ سلپ - `${staff.name}</title>"
$appContent = $appContent.Replace($oldSalaryBtn, $newSalaryBtn)

# 7. Accounts Report
$oldAccountsBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:5px; cursor:pointer; font-size:1.1rem;">رپورٹ پرنٹ کریں</button>
                </div>
"@

$newAccountsBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem;"><i class="fas fa-print"></i> رپورٹ پرنٹ کریں</button>
                    <button onclick="downloadDoc('حسابات_رپورٹ')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:25px; cursor:pointer; font-size:1.1rem;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>حسابات رپورٹ - `${title}</title>"
$appContent = $appContent.Replace($oldAccountsBtn, $newAccountsBtn)

# 8. Staff Card
$oldStaffCardBtn = @"
                <div class="no-print" style="position:fixed; bottom:20px; left:0; right:0; text-align:center;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.2rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);">پرنٹ کریں (A4)</button>
                </div>
"@

$newStaffCardBtn = @"
                <div class="no-print" style="position:fixed; bottom:20px; left:0; right:0; text-align:center; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.2rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-print"></i> پرنٹ کریں (A4)</button>
                    <button onclick="downloadDoc('عملہ_شناختی_کارڈز')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.2rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>عملہ شناختی کارڈز</title>"
$appContent = $appContent.Replace($oldStaffCardBtn, $newStaffCardBtn)

# 9. Staff Details
$oldStaffDetailsBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);">پرنٹ کریں (A4)</button>
                </div>
"@

$newStaffDetailsBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-print"></i> پرنٹ کریں (A4)</button>
                    <button onclick="downloadDoc('فارم_عملہ_${s.name ? s.name.replace(/\s+/g, '_') : 'Staff'}')" style="padding:10px 40px; background:#0284c7; color:white; border:none; border-radius:30px; cursor:pointer; font-size:1.1rem; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>تفصیل عملہ - `${s.name}</title>"
$appContent = $appContent.Replace($oldStaffDetailsBtn, $newStaffDetailsBtn)

# 10. Date Sheet
$oldDateSheetBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px;"><button onclick="window.print()" style="padding:15px 60px; background:#1e3a8a; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;">ڈیٹ شیٹ پرنٹ کریں</button></div>
"@

$newDateSheetBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#1e3a8a; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;"><i class="fas fa-print"></i> ڈیٹ شیٹ پرنٹ کریں</button>
                    <button onclick="downloadDoc('ڈیٹ_شیٹ_${exam.title ? exam.title.replace(/\s+/g, '_') : 'DateSheet'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>ڈیٹ شیٹ - `${exam.title}</title>"
$appContent = $appContent.Replace($oldDateSheetBtn, $newDateSheetBtn)

# 11. Result Card
$oldResultCardBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px;"><button onclick="window.print()" style="padding:15px 60px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;">رزلٹ کارڈ پرنٹ کریں</button></div>
"@

$newResultCardBtn = @"
                <div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;"><i class="fas fa-print"></i> رزلٹ کارڈ پرنٹ کریں</button>
                    <button onclick="downloadDoc('رزلٹ_کارڈ_${student.name ? student.name.replace(/\s+/g, '_') : 'ResultCard'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer;"><i class="fas fa-download"></i> ڈاؤن لوڈ کریں</button>
                </div>
"@

$appContent = Inject-HeadTag $appContent "<title>رزلٹ کارڈ - `${student.name}</title>"
$appContent = $appContent.Replace($oldResultCardBtn, $newResultCardBtn)


# --- HIFZ.JS ---

# 12. Hifz Exam Result Card
$oldHifzExamBtn = @"
                <div class="no-print" style="text-align:center; margin-top:25px;">
                    <button onclick="window.print()" style="padding:10px 40px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        پرنٹ کریں (Print)
                    </button>
                </div>
"@

$newHifzExamBtn = @"
                <div class="no-print" style="text-align:center; margin-top:25px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 35px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-print"></i> پرنٹ کریں (Print)
                    </button>
                    <button onclick="downloadDoc('حفظ_رزلٹ_کارڈ_${student.name ? student.name.replace(/\s+/g, '_') : 'ResultCard'}')" style="padding:10px 35px; background:#0284c7; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download)
                    </button>
                </div>
"@

$hifzContent = Inject-HeadTag $hifzContent "<title>امتحانی رزلٹ کارڈ - `${student.name}</title>"
$hifzContent = $hifzContent.Replace($oldHifzExamBtn, $newHifzExamBtn)

# 13. Hifz Parent Report
$oldHifzParentBtn = @"
                <div class="no-print" style="text-align:center; margin-top:25px;">
                    <button onclick="window.print()" style="padding:10px 45px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        پرنٹ یا PDF محفوظ کریں
                    </button>
                </div>
"@

$newHifzParentBtn = @"
                <div class="no-print" style="text-align:center; margin-top:25px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:10px 35px; background:#065f46; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-print"></i> پرنٹ یا PDF محفوظ کریں
                    </button>
                    <button onclick="downloadDoc('حفظ_سرپرست_رپورٹ_${student.name ? student.name.replace(/\s+/g, '_') : 'Report'}')" style="padding:10px 35px; background:#0284c7; color:white; border:none; border-radius:25px; font-size:1.2rem; cursor:pointer;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download)
                    </button>
                </div>
"@

$hifzContent = Inject-HeadTag $hifzContent "<title>ماہانہ رپورٹس براءے سرپرست - `${student.name}</title>"
$hifzContent = $hifzContent.Replace($oldHifzParentBtn, $newHifzParentBtn)

# 14. Hifz Certificate
$oldHifzCertBtn = @"
                <div class="no-print" style="text-align:center; margin-top:20px;">
                    <button onclick="window.print()" style="padding:12px 50px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-print"></i> سند پرنٹ فرمائیں (Print Certificate)
                    </button>
                </div>
"@

$newHifzCertBtn = @"
                <div class="no-print" style="text-align:center; margin-top:20px; display:flex; justify-content:center; gap:15px;">
                    <button onclick="window.print()" style="padding:12px 40px; background:#065f46; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-print"></i> سند پرنٹ فرمائیں (Print Certificate)
                    </button>
                    <button onclick="downloadDoc('سند_ختم_قرآن_${student.name ? student.name.replace(/\s+/g, '_') : 'Certificate'}')" style="padding:12px 40px; background:#0284c7; color:white; border:none; border-radius:30px; font-size:1.3rem; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (Download Certificate)
                    </button>
                </div>
"@

$hifzContent = Inject-HeadTag $hifzContent "<title>سندِ حفظ القرآن الكريم - `${student.name}</title>"
$hifzContent = $hifzContent.Replace($oldHifzCertBtn, $newHifzCertBtn)

[System.IO.File]::WriteAllText($appPath, $appContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($hifzPath, $hifzContent, [System.Text.Encoding]::UTF8)

Write-Host "Successfully updated app.js and hifz.js via PowerShell script!"
