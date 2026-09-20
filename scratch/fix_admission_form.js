const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appPath = path.resolve(__dirname, '../app.js');
let appJs = fs.readFileSync(appPath, 'utf8');

console.log('Original length:', appJs.length);

// 1. Locate the exact start of the cut
const startMarker = '                    <div style="display: flex; flex-direction: column; gap: 10px;">\n                        ${hasPaid ? `';
const endMarker = '            <div class="card" style="padding:0; overflow:hidden;">\n                <table id="studentTable">';

const startIdx = appJs.indexOf(startMarker);
const endIdx = appJs.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find markers:', { startIdx, endIdx });
    process.exit(1);
}

console.log('Found cut between indices:', startIdx, 'and', endIdx);

const replacement = `                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        \${hasPaid ? \`
                        <button id="btn_print_official_rec" class="btn" style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 11px; border-radius: 10px; font-size: 1.15rem; font-weight: bold; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 10px rgba(5,150,105,0.3);">
                            <i class="fas fa-receipt"></i> باضابطہ فیس وصولی رسید پرنٹ کریں (Official Receipt)
                        </button>
                        \` : ''}

                        <button id="btn_print_admission_challan" class="btn" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 10px; border-radius: 10px; font-size: 1.05rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-file-invoice"></i> داخلہ فیس چالان پرنٹ کریں (2 کاپیاں: دفتر / طالب علم)
                        </button>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px;">
                            <button id="btn_view_360_dossier" class="btn" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px; border-radius: 8px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <i class="fas fa-fingerprint"></i> ۳۶۰° مکمل فائل
                            </button>
                            <button onclick="document.getElementById('admission-success-modal').remove(); app.navigate('students');" class="btn" style="background: #64748b; color: white; border: none; padding: 8px; border-radius: 8px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <i class="fas fa-list"></i> طلباء کی فہرست
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        \`;

        document.body.appendChild(modal);

        // Bind events
        if (hasPaid) {
            document.getElementById('btn_print_official_rec')?.addEventListener('click', () => {
                this.printAdmissionReceipt(student, paidAmount, receiptNo, remaining);
            });
        }
        document.getElementById('btn_print_admission_challan')?.addEventListener('click', () => {
            this.printAdmissionChallan(student, paidAmount);
        });
        document.getElementById('btn_view_360_dossier')?.addEventListener('click', () => {
            modal.remove();
            this.showUniversalDossier(student.id, 'student');
        });
    }

    // =========================================================================
    // --- ADMISSION FORM & ASSESSMENT HELPERS ---
    // =========================================================================
    toggleHifzTestSection(isOpen) {
        const sec = document.getElementById('hifzTestSection');
        const chk = document.getElementById('isTransferHifzCheck');
        if (isOpen === undefined) {
            isOpen = sec ? (sec.style.display === 'none' || getComputedStyle(sec).display === 'none') : (chk ? !chk.checked : true);
        }
        isOpen = Boolean(isOpen);
        if (chk && chk.checked !== isOpen) {
            chk.checked = isOpen;
        }
        if (sec) {
            sec.style.display = isOpen ? 'block' : 'none';
            if (isOpen) {
                setTimeout(() => {
                    try {
                        sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } catch(e) {}
                }, 50);
            }
        }
    }

    calculateHifzTestScore() {
        const totalEl = document.getElementById('hifzTestTotalMarks');
        const obtEl = document.getElementById('hifzTestObtainedMarks');
        const gradeEl = document.getElementById('hifzTestGrade');
        if (!totalEl || !obtEl || !gradeEl) return;
        
        const total = parseFloat(totalEl.value) || 100;
        const obtVal = String(obtEl.value || '').trim();
        if (obtVal === '') {
            gradeEl.value = '';
            return;
        }
        const obt = parseFloat(obtVal);
        if (isNaN(obt)) {
            gradeEl.value = '';
            return;
        }
        const perc = Math.round((obt / total) * 100);
        let grade = 'راسب (Fail)';
        if (perc >= 85) grade = \`ممتاز (A+) - \${perc}%\`;
        else if (perc >= 70) grade = \`جید جداً (A) - \${perc}%\`;
        else if (perc >= 60) grade = \`جید (B) - \${perc}%\`;
        else if (perc >= 50) grade = \`مقبول (C) - \${perc}%\`;
        else grade = \`ناقص / محتاجِ محنت - \${perc}%\`;
        
        gradeEl.value = grade;
    }

    updateDivisions(province) {
        const divSelect = document.getElementById('addr_division');
        const distSelect = document.getElementById('addr_district');
        const tehSelect = document.getElementById('addr_tehsil');
        if (!divSelect) return;
        
        divSelect.innerHTML = '<option value="">انتخاب کریں</option>';
        if (distSelect) distSelect.innerHTML = '<option value="">انتخاب کریں</option>';
        if (tehSelect) tehSelect.innerHTML = '<option value="">انتخاب کریں</option>';

        if (typeof PakistanAddressData !== 'undefined' && province && PakistanAddressData[province]) {
            Object.keys(PakistanAddressData[province]).forEach(div => {
                divSelect.innerHTML += \`<option value="\${div}">\${div}</option>\`;
            });
        }
    }

    updateDistricts(division) {
        const provEl = document.getElementById('addr_province');
        const province = provEl ? provEl.value : '';
        const distSelect = document.getElementById('addr_district');
        const tehSelect = document.getElementById('addr_tehsil');
        if (!distSelect) return;
        
        distSelect.innerHTML = '<option value="">انتخاب کریں</option>';
        if (tehSelect) tehSelect.innerHTML = '<option value="">انتخاب کریں</option>';

        if (typeof PakistanAddressData !== 'undefined' && province && division && PakistanAddressData[province]?.[division]) {
            Object.keys(PakistanAddressData[province][division]).forEach(dist => {
                distSelect.innerHTML += \`<option value="\${dist}">\${dist}</option>\`;
            });
        }
    }

    updateTehsils(district) {
        const provEl = document.getElementById('addr_province');
        const divEl = document.getElementById('addr_division');
        const province = provEl ? provEl.value : '';
        const division = divEl ? divEl.value : '';
        const tehSelect = document.getElementById('addr_tehsil');
        if (!tehSelect) return;
        
        tehSelect.innerHTML = '<option value="">انتخاب کریں</option>';

        if (typeof PakistanAddressData !== 'undefined' && province && division && district && PakistanAddressData[province]?.[division]?.[district]) {
            PakistanAddressData[province][division][district].forEach(teh => {
                tehSelect.innerHTML += \`<option value="\${teh}">\${teh}</option>\`;
            });
        }
    }

    calculatePercentage() {
        const totalEl = document.getElementById('totalMarks');
        const obtEl = document.getElementById('obtainedMarks');
        const percInput = document.getElementById('percentage');
        if (!totalEl || !obtEl || !percInput) return;
        
        const total = parseFloat(totalEl.value);
        const obtained = parseFloat(obtEl.value);
        
        if (!isNaN(total) && !isNaN(obtained) && total > 0) {
            const p = (obtained / total) * 100;
            percInput.value = p.toFixed(1) + '%';
        } else {
            percInput.value = '';
        }
    }

    calculateAdmissionTotalFee() {
        const adm = parseFloat(document.getElementById('student_admission_fee')?.value || 0) || 0;
        const mon = parseFloat(document.getElementById('student_monthly_fee')?.value || 0) || 0;
        const totalInput = document.getElementById('totalAdmissionFee');
        if (totalInput) {
            totalInput.value = (adm + mon) > 0 ? (adm + mon) : '';
        }
    }

    updateMadrsaClasses(dept) {
        const classContainer = document.getElementById('class_selection_container');
        const classSelect = document.getElementById('student_class');
        const paidNowContainer = document.getElementById('paid_now_container');
        if (!classContainer || !classSelect) return;
        
        const classes = (this.madrsaDepartments && this.madrsaDepartments[dept]) ? this.madrsaDepartments[dept] : [];
        if (classes.length > 0) {
            classContainer.style.display = '';
            classSelect.innerHTML = '<option value="">انتخاب کریں</option>' + 
                classes.map(c => \`<option value="\${c}">\${c}</option>\`).join('');
            if (paidNowContainer) paidNowContainer.style.gridColumn = '';
        } else {
            classContainer.style.display = 'none';
            classSelect.innerHTML = '<option value="">انتخاب کریں</option>';
            if (paidNowContainer) paidNowContainer.style.gridColumn = 'span 2';
        }
    }

    async renderStudentList(container) {
        const students = await MadrassahDB.getAllStudents(this.currentSection);
        const isBanat = this.currentSection === 'banat';
        const sectionLabel = isBanat ? 'بنات' : 'بنین';

        container.innerHTML = \`
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <h2 style="color:var(--primary);"><i class="fas fa-users-viewfinder"></i> \${isBanat ? 'طالبات کی فہرست (بنات)' : 'طلباء کی فہرست (بنین)'}</h2>
                <div style="display:flex; gap:1rem;">
                    <input type="text" id="studentSearch" placeholder="نام سے تلاش کریں..." oninput="app.filterStudents(this.value)" style="padding:0.5rem 1rem; border-radius:10px; border:1px solid #ddd; width:250px;">
                    <button class="btn btn-sm" onclick="app.printClassIDCards()" style="background:#6366f1; color:white; border:none; border-radius:10px; padding:0 15px;"><i class="fas fa-print"></i> \${isBanat ? 'کلاس کارڈز (مع محارم)' : 'کلاس کارڈز'}</button>
                    <button class="btn btn-primary btn-sm" onclick="app.navigate('admission')"><i class="fas fa-plus"></i> نیا داخلہ</button>
                </div>
            </div>

            <div class="card" style="padding:0; overflow:hidden;">
                <table id="studentTable">\`;

const newAppJs = appJs.substring(0, startIdx) + replacement + appJs.substring(endIdx + endMarker.length);

// Verify syntax
console.log('Verifying syntax with vm.Script...');
try {
    new vm.Script(newAppJs);
    console.log('Syntax valid!');
} catch (e) {
    console.error('Syntax error in new app.js:', e);
    process.exit(1);
}

// Backup current before writing
fs.writeFileSync(appPath + '.bak_before_hifz_fix', appJs, 'utf8');
fs.writeFileSync(appPath, newAppJs, 'utf8');
console.log('Successfully updated app.js! New length:', newAppJs.length);
