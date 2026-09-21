const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
let content = fs.readFileSync(appPath, 'utf8');

const startMarker = '    // =========================================================================\r\n    // --- 2. FEE COLLECTION & STUDENT FINANCIAL LEDGER MODULE';
const altStartMarker = '    // =========================================================================\n    // --- 2. FEE COLLECTION & STUDENT FINANCIAL LEDGER MODULE';
const endMarker = '    // =========================================================================\r\n    // --- 3. SALARY MANAGEMENT MODULE';
const altEndMarker = '    // =========================================================================\n    // --- 3. SALARY MANAGEMENT MODULE';

let startIdx = content.indexOf(startMarker);
if (startIdx === -1) startIdx = content.indexOf(altStartMarker);

let endIdx = content.indexOf(endMarker);
if (endIdx === -1) endIdx = content.indexOf(altEndMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Markers not found! startIdx:', startIdx, 'endIdx:', endIdx);
    process.exit(1);
}

const cleanFeeModule = `    // =========================================================================
    // --- 2. FEE COLLECTION & ADMISSION ARREARS MODULE (فیس وصولی، داخلہ بقایا جات و کھاتہ) ---
    // =========================================================================
    feeModuleSection = 'banin';
    feeModuleSearch = '';
    currentFeeStudent = null;
    currentFeeHistory = [];

    // Auto-heal missing admission fee records for previously enrolled students
    async syncStudentAdmissionFeeRecord(student) {
        if (!student || !student.id) return [];
        let fees = await MadrassahDB.getStudentFees(student.id);
        const admissionFee = parseInt(student.admissionFee || 0);
        const monthlyFee = parseInt(student.monthlyFee || 0);
        const totalFee = (student.totalFee ? parseInt(student.totalFee) : (admissionFee + monthlyFee)) || parseInt(student.arrears || 0) || 0;
        const currentArrears = (student.arrears !== undefined && student.arrears !== null && !isNaN(student.arrears)) ? parseInt(student.arrears) : 0;

        let initialPaid = 0;
        if (student.paidNow !== undefined && student.paidNow !== null && student.paidNow !== '' && !isNaN(student.paidNow)) {
            initialPaid = parseInt(student.paidNow);
        } else if (totalFee > currentArrears) {
            initialPaid = totalFee - currentArrears;
        }

        const hasAdmFee = fees.some(f => f.feeType === 'داخلہ فیس' || f.isAdmissionPayment);

        if (initialPaid > 0 && !hasAdmFee) {
            const receiptNo = 'ADM-' + Math.floor(100000 + Math.random() * 900000);
            const admFeeRecord = {
                studentId: parseInt(student.id),
                studentName: student.name,
                fatherName: student.fatherName || '',
                className: student.className || student.class || '---',
                feeType: 'داخلہ فیس',
                amount: initialPaid,
                month: student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('ur-PK', { month: 'long' }) : new Date().toLocaleDateString('ur-PK', { month: 'long' }),
                timestamp: student.admissionDate ? new Date(student.admissionDate).getTime() : (Date.now() - 3600000),
                receiptNo: receiptNo,
                isAdmissionPayment: true
            };
            try {
                await MadrassahDB.saveFee(admFeeRecord);
                fees.push(admFeeRecord);

                const txs = await MadrassahDB.getAllTransactions();
                const hasTx = txs.some(t => t.name === student.name && t.category === 'داخلہ فیس');
                if (!hasTx) {
                    await MadrassahDB.saveTransaction({
                        type: 'Income',
                        category: 'داخلہ فیس',
                        amount: initialPaid,
                        name: student.name,
                        receiptNo: receiptNo,
                        date: admFeeRecord.timestamp,
                        description: \`داخلہ فیس وصولی (طالب علم: \${student.name}، رجسٹریشن: #\${student.id})\`
                    });
                }
            } catch (err) {
                console.warn('Sync admission fee warning:', err);
            }
        }
        return fees;
    }

    async renderFeeModule(container) {
        if (!container) container = document.getElementById('main-content');
        if (!container) return;

        if (!this.feeModuleSection) {
            this.feeModuleSection = this.currentSection || 'banin';
        }

        const currentSection = this.feeModuleSection;
        const isBanat = currentSection === 'banat';
        const students = (await MadrassahDB.getAllStudents(currentSection)) || [];

        // Auto-heal any students with missing fee records
        for (const s of students) {
            const tot = parseInt(s.totalFee || 0) || (parseInt(s.admissionFee || 0) + parseInt(s.monthlyFee || 0));
            const arr = parseInt(s.arrears || 0);
            if (tot > arr || parseInt(s.paidNow || 0) > 0) {
                await this.syncStudentAdmissionFeeRecord(s);
            }
        }

        // Determine default student to display (prefer student with arrears, e.g. Badruddin)
        let defaultStudentId = null;
        if (this.currentFeeStudent) {
            const exists = students.find(s => String(s.id) === String(this.currentFeeStudent.id));
            if (exists) defaultStudentId = exists.id;
        }
        if (!defaultStudentId && students.length > 0) {
            const withArrears = students.find(s => parseInt(s.arrears || 0) > 0);
            defaultStudentId = withArrears ? withArrears.id : students[0].id;
        }

        container.innerHTML = \`
            <!-- Simple Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; background:white; padding:1rem 1.4rem; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.03); flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="background:#ecfdf5; color:#059669; width:40px; height:40px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; font-size:1.2rem;">
                        <i class="fas fa-hand-holding-dollar"></i>
                    </span>
                    <div>
                        <h2 style="color:#0f172a; margin:0; font-size:1.45rem;">فیس وصولی، داخلہ بقایا جات و کھاتہ</h2>
                        <div style="color:#64748b; font-size:0.85rem;">داخلہ فیس، ماہانہ فیس اور داخلہ کے وقت کے بقایا جات کا سادہ و درست نظام</div>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="display:flex; align-items:center; gap:6px; background:#f8fafc; padding:4px 8px; border-radius:8px; border:1px solid #cbd5e1;">
                        <span style="font-size:0.85rem; color:#475569; font-weight:bold;">شعبہ:</span>
                        <select onchange="app.switchFeeSection(this.value)" style="border:none; background:transparent; font-weight:bold; font-size:0.9rem; color:#0f172a; cursor:pointer;">
                            <option value="banin" \${currentSection === 'banin' ? 'selected' : ''}>شعبہ بنین (طلباء)</option>
                            <option value="banat" \${currentSection === 'banat' ? 'selected' : ''}>شعبہ بنات (طالبات)</option>
                            <option value="all" \${currentSection === 'all' ? 'selected' : ''}>تمام طلباء (All)</option>
                        </select>
                    </div>

                    <button class="btn btn-primary" onclick="app.printBlankReceipt()" style="border-radius:8px; padding:7px 14px; font-size:0.9rem; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-receipt"></i> خالی رسید پرنٹ
                    </button>
                </div>
            </div>

            <!-- Clean 2-Column Grid -->
            <div style="display:grid; grid-template-columns:310px 1fr; gap:1.2rem; align-items:start;">
                <!-- Left: Simple Student List -->
                <div class="card" style="padding:1rem; background:white; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                    <div style="font-weight:bold; color:#1e293b; margin-bottom:8px; font-size:0.95rem; display:flex; justify-content:space-between;">
                        <span>طلباء کی فہرست</span>
                        <span style="color:#64748b; font-weight:normal; font-size:0.85rem;">کل: \${students.length}</span>
                    </div>

                    <div style="position:relative; margin-bottom:10px;">
                        <input type="text" id="fee_student_search" placeholder="طالب علم تلاش کریں..." value="\${this.feeModuleSearch || ''}" oninput="app.filterFeeStudents(this.value)" style="width:100%; padding:8px 30px 8px 10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.88rem; box-sizing:border-box;">
                        <i class="fas fa-search" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;"></i>
                    </div>

                    <div id="fee_student_list" style="max-height: 580px; overflow-y: auto; display:flex; flex-direction:column; gap:6px; padding-left:2px;">
                        \${this.generateFeeStudentListHtml(students, defaultStudentId)}
                    </div>
                </div>

                <!-- Right: Simple Main Panel -->
                <div id="fee_details_container">
                    <div style="text-align:center; padding:3rem; color:#94a3b8;">طالب علم منتخب کیا جا رہا ہے...</div>
                </div>
            </div>
        \`;

        if (defaultStudentId) {
            this.selectStudentForFee(defaultStudentId);
        }
    }

    switchFeeSection(section) {
        this.feeModuleSection = section;
        this.currentFeeStudent = null;
        this.renderFeeModule();
    }

    generateFeeStudentListHtml(students, activeId) {
        if (!students || students.length === 0) {
            return \`<div style="text-align:center; padding:2rem; color:#94a3b8; font-size:0.9rem;">کوئی طالب علم موجود نہیں۔</div>\`;
        }

        return students.map(s => {
            const arrears = parseInt(s.arrears || 0);
            const hasArrears = arrears > 0;
            const isSelected = activeId && String(activeId) === String(s.id);
            const code = s.uniqueCode || ('STU-' + (1000 + parseInt(s.id)));

            return \`
                <div class="fee-student-item" data-id="\${s.id}" data-name="\${(s.name || '').toLowerCase()}" data-father="\${(s.fatherName || '').toLowerCase()}" data-code="\${code.toLowerCase()} #\${s.id}" data-class="\${(s.className || s.class || '').toLowerCase()}" onclick="app.selectStudentForFee(\${s.id})" style="padding:8px 10px; border-radius:10px; border:1.5px solid \${isSelected ? '#059669' : '#e2e8f0'}; background:\${isSelected ? '#f0fdf4' : '#ffffff'}; cursor:pointer; transition:all 0.15s ease; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <div style="min-width:0;">
                        <div style="font-weight:bold; color:#0f172a; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            \${s.name}
                        </div>
                        <div style="font-size:0.78rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ولد: \${s.fatherName || '---'} | <span style="font-family:monospace; color:#0284c7;">#\${s.id}</span>
                        </div>
                    </div>

                    <div style="text-align:left; flex-shrink:0;">
                        \${hasArrears ? \`
                            <span style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; font-size:0.8rem; font-weight:bold; padding:2px 6px; border-radius:5px; font-family:monospace;">
                                بقایا: \${arrears.toLocaleString()}
                            </span>
                        \` : \`
                            <span style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; font-size:0.75rem; font-weight:bold; padding:2px 6px; border-radius:5px;">
                                بے باق ✓
                            </span>
                        \`}
                    </div>
                </div>
            \`;
        }).join('');
    }

    filterFeeStudents(query) {
        this.feeModuleSearch = query;
        const q = (query || '').trim().toLowerCase();
        const items = document.querySelectorAll('.fee-student-item');

        items.forEach(item => {
            const name = item.getAttribute('data-name') || '';
            const father = item.getAttribute('data-father') || '';
            const code = item.getAttribute('data-code') || '';
            const cls = item.getAttribute('data-class') || '';
            const match = !q || name.includes(q) || father.includes(q) || code.includes(q) || cls.includes(q);
            item.style.display = match ? 'flex' : 'none';
        });
    }

    async selectStudentForFee(id) {
        const student = await MadrassahDB.getStudentById(id);
        if (!student) {
            alert('طالب علم کا ریکارڈ نہیں ملا!');
            return;
        }

        const fees = await this.syncStudentAdmissionFeeRecord(student);
        this.currentFeeStudent = student;
        this.currentFeeHistory = fees;

        // Highlight active item in sidebar list
        document.querySelectorAll('.fee-student-item').forEach(item => {
            const isMatch = item.getAttribute('data-id') === String(id);
            item.style.borderColor = isMatch ? '#059669' : '#e2e8f0';
            item.style.background = isMatch ? '#f0fdf4' : '#ffffff';
        });

        const container = document.getElementById('fee_details_container');
        if (!container) return;

        // --- Core Fee Calculations ---
        const admissionFee = parseInt(student.admissionFee || 0);
        const monthlyFee = parseInt(student.monthlyFee || 0);
        const currentArrears = (student.arrears !== undefined && student.arrears !== null && !isNaN(student.arrears)) ? parseInt(student.arrears) : 0;

        // Total fee agreed upon admission
        let totalFee = student.totalFee ? parseInt(student.totalFee) : (admissionFee + monthlyFee);
        if (totalFee === 0 && currentArrears > 0) {
            totalFee = currentArrears;
        }

        // Amount paid at admission
        let paidAtAdmission = 0;
        if (student.paidNow !== undefined && student.paidNow !== null && student.paidNow !== '' && !isNaN(student.paidNow)) {
            paidAtAdmission = parseInt(student.paidNow);
        } else if (totalFee > currentArrears) {
            paidAtAdmission = totalFee - currentArrears;
        }

        // Exact Admission Arrears (داخلہ کے وقت کا بقایا)
        let admissionArrears = student.admissionArrears !== undefined ? parseInt(student.admissionArrears) : Math.max(0, totalFee - paidAtAdmission);
        if (admissionArrears === 0 && currentArrears > 0) {
            admissionArrears = currentArrears;
        }

        // Total Paid to date from all fee records
        const totalPaidToDate = fees.reduce((sum, f) => sum + (parseInt(f.amount) || 0), 0);

        // Current Month
        const currentMonthName = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'][new Date().getMonth()];
        const monthsUrdu = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];

        // Default fee type & amount to pay
        const defaultAmountToPay = currentArrears > 0 ? currentArrears : (monthlyFee > 0 ? monthlyFee : 1000);
        const defaultFeeType = admissionArrears > 0 ? 'داخلہ فیس کا بقایا' : (currentArrears > 0 ? 'سابقہ بقایا جات' : 'ماہانہ فیس');

        // Prepare Double-Entry Ledger Rows
        // Row 1: Initial Admission Entry (Clearly displaying Admission Arrears!)
        const ledgerRows = [];
        let runningBalance = admissionArrears;

        ledgerRows.push({
            date: student.admissionDate || 'بوقتِ داخلہ',
            description: \`داخلہ کے وقت کے کل واجبات (داخلہ فیس: Rs. \${admissionFee.toLocaleString()} + ماہانہ فیس: Rs. \${monthlyFee.toLocaleString()})\`,
            refNo: \`داخلہ فارم (#\${student.id})\`,
            totalDues: totalFee,
            received: paidAtAdmission,
            balance: admissionArrears,
            isAdmissionRow: true
        });

        // Filter out subsequent payments: if fee record has isAdmissionPayment or matches paidAtAdmission on admission date, it's represented in Row 1
        let isAdmPaymentAlreadyShown = paidAtAdmission > 0;
        const sortedFees = fees.slice().sort((a, b) => (a.timestamp || a.date || 0) - (b.timestamp || b.date || 0));

        sortedFees.forEach(f => {
            const amt = parseInt(f.amount || 0);
            if (isAdmPaymentAlreadyShown && (f.isAdmissionPayment || (f.feeType === 'داخلہ فیس' && amt === paidAtAdmission))) {
                // Already shown in Row 1 (admission row), attach receipt info to Row 1
                if (ledgerRows[0]) {
                    ledgerRows[0].receiptNo = f.receiptNo;
                    ledgerRows[0].feeRecord = f;
                }
                isAdmPaymentAlreadyShown = false;
                return;
            }

            // Subsequent payments subtract from admission arrears
            runningBalance = Math.max(0, runningBalance - amt);
            const d = new Date(f.timestamp || f.date || Date.now());
            const dStr = !isNaN(d.getTime()) ? \`\${d.getDate()}/\${d.getMonth()+1}/\${d.getFullYear()}\` : '---';

            ledgerRows.push({
                id: f.id,
                date: dStr,
                description: \`\${f.feeType || 'فیس وصولی'} \${f.month ? \`(برائے \${f.month})\` : ''}\`,
                refNo: f.receiptNo || ('REC-' + f.id),
                totalDues: 0,
                received: amt,
                balance: runningBalance,
                feeRecord: f
            });
        });

        container.innerHTML = \`
            <div style="display:flex; flex-direction:column; gap:1.2rem;">
                <!-- Student Header Card -->
                <div class="card" style="padding:1.1rem 1.4rem; background:white; border-radius:12px; border:1px solid #e2e8f0; border-right:5px solid var(--primary); box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <h2 style="margin:0; color:#0f172a; font-size:1.4rem;">\${student.name}</h2>
                                <span style="background:#eff6ff; color:#1d4ed8; padding:2px 8px; border-radius:14px; font-family:monospace; font-size:0.85rem; font-weight:bold; border:1px solid #bfdbfe;">
                                    #\${student.id} | \${student.uniqueCode || ('STU-' + (1000 + parseInt(student.id)))}
                                </span>
                            </div>
                            <div style="color:#64748b; font-size:0.9rem; margin-top:3px;">
                                ولد: <b>\${student.fatherName || '---'}</b> | شعبہ: <b>\${student.department || '---'}</b> | درجہ: <b>\${student.className || student.class || '---'}</b> | تاریخ داخلہ: <b>\${student.admissionDate || '---'}</b>
                            </div>
                        </div>

                        <div style="display:flex; gap:8px;">
                            <button type="button" class="btn" onclick="app.printStudentLedger(\${student.id})" style="background:#0284c7; color:white; border:none; border-radius:8px; padding:8px 14px; font-weight:bold; display:inline-flex; align-items:center; gap:6px; cursor:pointer; font-size:0.9rem;">
                                <i class="fas fa-print"></i> فیس کھاتہ پرنٹ کریں (A4)
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3 Clear Financial Status Cards (Highlighting Admission Arrears!) -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
                    <!-- Card 1: Total Dues at Admission -->
                    <div style="background:white; padding:1.1rem; border-radius:12px; border:1px solid #e2e8f0; border-top:4px solid #0284c7;">
                        <div style="font-size:0.85rem; color:#64748b; font-weight:bold;">داخلہ فیس و تعلیمی واجبات</div>
                        <div style="font-size:1.5rem; font-weight:bold; color:#0f172a; margin-top:4px; font-family:monospace;">
                            Rs. \${totalFee.toLocaleString()}
                        </div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:3px;">
                            داخلہ: Rs. \${admissionFee.toLocaleString()} | ماہانہ: Rs. \${monthlyFee.toLocaleString()}
                        </div>
                    </div>

                    <!-- Card 2: Admission Arrears (داخلہ کے وقت کا بقایا) -->
                    <div style="background:#fffbfa; padding:1.1rem; border-radius:12px; border:1.5px solid \${admissionArrears > 0 ? '#fca5a5' : '#86efac'}; border-top:4px solid \${admissionArrears > 0 ? '#dc2626' : '#16a34a'};">
                        <div style="font-size:0.85rem; color:\${admissionArrears > 0 ? '#991b1b' : '#166534'}; font-weight:bold;">
                            داخلہ کے وقت کا بقایا (Admission Arrears)
                        </div>
                        <div style="font-size:1.55rem; font-weight:bold; color:\${admissionArrears > 0 ? '#dc2626' : '#16a34a'}; margin-top:4px; font-family:monospace;">
                            Rs. \${admissionArrears.toLocaleString()}
                        </div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:3px;">
                            موقع پر وصول شدہ رقم: <b style="color:#059669;">Rs. \${paidAtAdmission.toLocaleString()}</b>
                        </div>
                    </div>

                    <!-- Card 3: Current Outstanding Arrears -->
                    <div style="background:\${currentArrears > 0 ? '#fef2f2' : '#f0fdf4'}; padding:1.1rem; border-radius:12px; border:1.5px solid \${currentArrears > 0 ? '#fca5a5' : '#86efac'}; border-top:4px solid \${currentArrears > 0 ? '#b91c1c' : '#15803d'};">
                        <div style="font-size:0.85rem; color:\${currentArrears > 0 ? '#991b1b' : '#166534'}; font-weight:bold;">
                            موجودہ واجب الادا بقایا جات (Total Arrears)
                        </div>
                        <div style="font-size:1.6rem; font-weight:bold; color:\${currentArrears > 0 ? '#b91c1c' : '#15803d'}; margin-top:4px; font-family:monospace;">
                            \${currentArrears > 0 ? \`Rs. \${currentArrears.toLocaleString()}\` : 'بے باق (Clear ✓)'}
                        </div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:3px;">
                            کل موصول شدہ رقم: <b style="color:#059669;">Rs. \${totalPaidToDate.toLocaleString()}</b>
                        </div>
                    </div>
                </div>

                <!-- Simple Fee Collection Form -->
                <div class="card" style="padding:1.2rem; background:#f8fafc; border-radius:12px; border:1px solid #cbd5e1;">
                    <div style="font-weight:bold; color:#0f172a; margin-bottom:10px; font-size:1rem; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-hand-holding-dollar" style="color:var(--primary);"></i> فیس وصولی فارم
                    </div>

                    <form onsubmit="app.handleFeeSubmit(event)">
                        <input type="hidden" name="studentId" value="\${student.id}">
                        <input type="hidden" name="studentName" value="\${student.name}">
                        <input type="hidden" name="className" value="\${student.className || student.class || '---'}">
                        <input type="hidden" id="student_current_arrears" value="\${currentArrears}">

                        <div style="display:grid; grid-template-columns: 1fr 1.2fr 1fr auto; gap:12px; align-items:end;">
                            <div>
                                <label style="font-weight:bold; font-size:0.85rem; color:#1e293b; display:block; margin-bottom:4px;">فیس کی مد / نوعیت</label>
                                <select name="feeType" id="fee_type_select" onchange="app.updateFeeCalculation()" style="width:100%; padding:8px 10px; border-radius:8px; border:1.5px solid #cbd5e1; font-weight:bold; font-size:0.9rem;" required>
                                    <option value="داخلہ فیس کا بقایا" \${defaultFeeType === 'داخلہ فیس کا بقایا' ? 'selected' : ''}>داخلہ فیس کا بقایا</option>
                                    <option value="ماہانہ فیس" \${defaultFeeType === 'ماہانہ فیس' ? 'selected' : ''}>ماہانہ فیس</option>
                                    <option value="سابقہ بقایا جات" \${defaultFeeType === 'سابقہ بقایا جات' ? 'selected' : ''}>سابقہ بقایا جات</option>
                                    <option value="کتب فیس">کتب فیس</option>
                                    <option value="دیگر">دیگر / متفرق</option>
                                </select>
                            </div>

                            <div>
                                <label style="font-weight:bold; font-size:0.85rem; color:#1e293b; display:block; margin-bottom:4px;">وصول کی جانے والی رقم (روپے)</label>
                                <input type="number" name="amount" id="fee_paid_amount" min="1" value="\${defaultAmountToPay}" placeholder="رقم درج کریں" oninput="app.updateArrearsPreview()" style="width:100%; padding:8px 10px; border-radius:8px; border:2px solid #059669; font-size:1.1rem; font-weight:bold; font-family:monospace; color:#0f172a;" required>
                            </div>

                            <div>
                                <label style="font-weight:bold; font-size:0.85rem; color:#1e293b; display:block; margin-bottom:4px;">برائے مہینہ</label>
                                <select name="month" id="fee_month_select" style="width:100%; padding:8px 10px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:0.9rem;">
                                    \${monthsUrdu.map(m => {
                                        const isMthPaid = fees.some(f => f.month === m && f.feeType === 'ماہانہ فیس');
                                        return \`<option value="\${m}" \${currentMonthName === m ? 'selected' : ''}>\${m} \${isMthPaid ? '(ادا شدہ ✓)' : ''}</option>\`;
                                    }).join('')}
                                </select>
                            </div>

                            <div>
                                <button type="submit" name="action" value="print" class="btn btn-primary" style="padding:9px 18px; border-radius:8px; font-weight:bold; display:inline-flex; align-items:center; gap:6px; font-size:0.95rem; white-space:nowrap;">
                                    <i class="fas fa-check"></i> وصول کریں اور باضابطہ رسید دیں
                                </button>
                            </div>
                        </div>

                        <div id="arrears_preview" style="margin-top:8px; font-size:0.88rem; color:#475569;">
                            موجودہ بقایا: <b>\${currentArrears.toLocaleString()} روپے</b> | وصولی کے بعد نیا بقایا: <b style="color:\${Math.max(0, currentArrears - defaultAmountToPay) > 0 ? '#dc2626' : '#16a34a'};">\${Math.max(0, currentArrears - defaultAmountToPay).toLocaleString()} روپے</b>
                        </div>
                    </form>
                </div>

                <!-- Clean Student Fee History Table -->
                <div class="card" style="padding:0; overflow:hidden; background:white; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                    <div style="padding:10px 16px; background:#f1f5f9; border-bottom:1px solid #cbd5e1; font-weight:bold; color:#1e293b; font-size:0.98rem; display:flex; justify-content:space-between; align-items:center;">
                        <span><i class="fas fa-history" style="color:var(--primary); margin-left:6px;"></i> فیس ریکارڈ و کھاتہ (Fee History)</span>
                        <span style="font-size:0.82rem; color:#64748b; font-weight:normal;">تمام ادائیگیاں مع رسید نمبر</span>
                    </div>

                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; text-align:right;">
                            <thead>
                                <tr style="background:#f8fafc; color:#475569; font-size:0.88rem; border-bottom:1px solid #cbd5e1;">
                                    <th style="padding:8px 12px; width:40px; text-align:center;">#</th>
                                    <th style="padding:8px 12px; width:110px;">تاریخ</th>
                                    <th style="padding:8px 12px;">تفصیل / مد</th>
                                    <th style="padding:8px 12px; width:120px;">رسید نمبر</th>
                                    <th style="padding:8px 12px; width:110px; text-align:center;">کل واجب فیس</th>
                                    <th style="padding:8px 12px; width:110px; text-align:center;">وصول شدہ رقم</th>
                                    <th style="padding:8px 12px; width:130px; text-align:center;">بقایا جات</th>
                                    <th style="padding:8px 12px; width:90px; text-align:center;">ایکشن</th>
                                </tr>
                            </thead>
                            <tbody>
                                \${ledgerRows.map((row, idx) => {
                                    const isAdm = row.isAdmissionRow;
                                    return \`
                                        <tr style="border-bottom:1px solid #f1f5f9; \${isAdm ? 'background:#fffdf5;' : ''}">
                                            <td style="padding:9px 12px; text-align:center;">\${idx + 1}</td>
                                            <td style="padding:9px 12px; font-family:monospace; color:#475569;">\${row.date}</td>
                                            <td style="padding:9px 12px; font-weight:\${isAdm ? 'bold' : 'normal'}; color:#1e293b;">
                                                \${row.description}
                                            </td>
                                            <td style="padding:9px 12px; font-family:monospace; color:#0284c7; font-weight:600;">
                                                \${row.refNo || '---'}
                                            </td>
                                            <td style="padding:9px 12px; text-align:center; font-weight:bold; font-family:monospace; color:#1e293b;">
                                                \${row.totalDues > 0 ? ('Rs. ' + row.totalDues.toLocaleString()) : '—'}
                                            </td>
                                            <td style="padding:9px 12px; text-align:center; font-weight:bold; font-family:monospace; color:#059669;">
                                                \${row.received > 0 ? ('Rs. ' + row.received.toLocaleString()) : '—'}
                                            </td>
                                            <td style="padding:9px 12px; text-align:center; font-weight:bold; font-family:monospace; color:\${row.balance > 0 ? '#dc2626' : '#16a34a'};">
                                                Rs. \${row.balance.toLocaleString()}
                                                \${isAdm && row.balance > 0 ? \`<div style="font-size:0.75rem; color:#dc2626;">(داخلہ کا بقایا)</div>\` : ''}
                                            </td>
                                            <td style="padding:9px 12px; text-align:center;">
                                                \${row.feeRecord ? \`
                                                    <div style="display:flex; gap:4px; justify-content:center;">
                                                        <button type="button" class="btn btn-sm" onclick="app.printFeeReceipt(\${JSON.stringify(row.feeRecord).replace(/"/g, '&quot;')})" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:5px; padding:3px 7px;" title="رسید پرنٹ">
                                                            <i class="fas fa-print"></i>
                                                        </button>
                                                        <button type="button" class="btn btn-sm" onclick="app.deleteFee(\${row.feeRecord.id})" style="background:#fef2f2; color:#dc2626; border:1px solid #fecaca; border-radius:5px; padding:3px 7px;" title="ڈیلیٹ">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                \` : \`
                                                    <span style="font-size:0.75rem; color:#94a3b8;">ابتدائی ریکارڈ</span>
                                                \`}
                                            </td>
                                        </tr>
                                    \`;
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background:#f8fafc; font-weight:bold; border-top:2px solid #cbd5e1;">
                                    <td colspan="4" style="padding:10px 12px; text-align:right; color:#1e293b;">خلاصہ واجبات و ادائیگیاں:</td>
                                    <td style="padding:10px 12px; text-align:center; font-family:monospace; color:#1e293b;">Rs. \${totalFee.toLocaleString()}</td>
                                    <td style="padding:10px 12px; text-align:center; font-family:monospace; color:#059669;">Rs. \${totalPaidToDate.toLocaleString()}</td>
                                    <td style="padding:10px 12px; text-align:center; font-family:monospace; font-size:1.15rem; color:\${currentArrears > 0 ? '#dc2626' : '#16a34a'};">
                                        Rs. \${currentArrears.toLocaleString()}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        \`;
    }

    updateFeeCalculation() {
        const student = this.currentFeeStudent;
        if (!student) return;

        const feeType = document.getElementById('fee_type_select')?.value || 'داخلہ فیس کا بقایا';
        const currentArrears = parseInt(student.arrears || 0);
        const monthlyFee = parseInt(student.monthlyFee || 0);
        const admissionFee = parseInt(student.admissionFee || 0);

        let suggestedAmount = 0;
        if (feeType === 'داخلہ فیس کا بقایا' || feeType === 'سابقہ بقایا جات') {
            suggestedAmount = currentArrears > 0 ? currentArrears : admissionFee;
        } else if (feeType === 'ماہانہ فیس') {
            suggestedAmount = monthlyFee > 0 ? monthlyFee : currentArrears;
        } else {
            suggestedAmount = currentArrears > 0 ? currentArrears : 1000;
        }

        const inputEl = document.getElementById('fee_paid_amount');
        if (inputEl) {
            inputEl.value = suggestedAmount > 0 ? suggestedAmount : '';
        }
        this.updateArrearsPreview();
    }

    updateArrearsPreview() {
        const student = this.currentFeeStudent;
        if (!student) return;

        const currentArrears = parseInt(student.arrears || 0);
        const paidInput = parseInt(document.getElementById('fee_paid_amount')?.value || 0);
        const newBalance = Math.max(0, currentArrears - paidInput);

        const textEl = document.getElementById('arrears_preview');
        if (textEl) {
            textEl.innerHTML = \`موجودہ بقایا: <b>\${currentArrears.toLocaleString()} روپے</b> | وصولی کے بعد نیا بقایا: <b style="color:\${newBalance > 0 ? '#dc2626' : '#16a34a'};">\${newBalance.toLocaleString()} روپے</b>\`;
        }
    }

    async handleFeeSubmit(event) {
        if (event && event.preventDefault) event.preventDefault();
        const action = event.submitter ? event.submitter.value : 'print';
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        data.studentId = parseInt(data.studentId);
        data.amount = parseInt(data.amount) || 0;
        data.timestamp = Date.now();
        data.receiptNo = 'RF-' + Math.floor(100000 + Math.random() * 900000);

        if (data.amount <= 0) {
            alert('برائے مہربانی درست وصولی رقم درج فرمائیں!');
            return;
        }

        const student = await MadrassahDB.getStudentById(data.studentId);
        if (!student) {
            alert('طالب علم کا ریکارڈ نہیں مل سکا!');
            return;
        }

        const currentArrears = parseInt(student.arrears || 0);
        const newArrears = Math.max(0, currentArrears - data.amount);

        // Update student arrears
        student.arrears = newArrears;
        await MadrassahDB.saveStudent(student);

        // Save fee record in fees object store
        await MadrassahDB.saveFee(data);

        // Save automated transaction in Bait-ul-Maal
        try {
            await MadrassahDB.saveTransaction({
                type: 'Income',
                category: data.feeType || 'ماہانہ فیس',
                amount: data.amount,
                name: student.name,
                receiptNo: data.receiptNo,
                date: Date.now(),
                description: \`\${data.feeType} \${data.month ? \`برائے \${data.month}\` : ''} (طالب علم: \${student.name}، رجسٹریشن: #\${student.id})۔ بقیہ بقایا: Rs. \${newArrears.toLocaleString()}\`
            });
        } catch (tErr) {
            console.warn('Transaction warning in fee submit:', tErr);
        }

        this.printFeeReceipt({
            receiptNo: data.receiptNo,
            studentName: student.name,
            fatherName: student.fatherName,
            className: student.className || student.class,
            amount: data.amount,
            feeType: data.feeType,
            month: data.month,
            timestamp: Date.now()
        });

        await this.selectStudentForFee(data.studentId);
        // Also refresh left list badge
        const listBadge = document.querySelector(\`.fee-student-item[data-id="\${data.studentId}"] span\`);
        if (listBadge) {
            if (newArrears > 0) {
                listBadge.className = '';
                listBadge.style.cssText = 'background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; font-size:0.8rem; font-weight:bold; padding:2px 6px; border-radius:5px; font-family:monospace;';
                listBadge.innerText = \`بقایا: \${newArrears.toLocaleString()}\`;
            } else {
                listBadge.className = '';
                listBadge.style.cssText = 'background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; font-size:0.75rem; font-weight:bold; padding:2px 6px; border-radius:5px;';
                listBadge.innerText = 'بے باق ✓';
            }
        }
    }

    async deleteFee(id) {
        if (!confirm('کیا آپ واقعی یہ فیس ریکارڈ حذف کرنا چاہتے ہیں؟ اس سے طالب علم کے بقایا جات میں یہ رقم دوبارہ شامل ہو جائے گی۔')) return;

        const fee = await MadrassahDB.getFeeById(id);
        if (!fee) {
            alert('فیس کا ریکارڈ نہیں ملا۔');
            return;
        }

        try {
            await MadrassahDB.deleteFee(id);

            const student = await MadrassahDB.getStudentById(fee.studentId);
            if (student) {
                const currentArrears = parseInt(student.arrears || 0);
                const paidAmount = parseInt(fee.amount || 0);
                student.arrears = currentArrears + paidAmount;
                await MadrassahDB.saveStudent(student);
            }

            if (fee.receiptNo) {
                try {
                    await MadrassahDB.deleteTransactionByReceipt(fee.receiptNo);
                } catch (tErr) {
                    console.warn('Delete transaction warning:', tErr);
                }
            }

            alert('فیس ریکارڈ حذف کر دیا گیا ہے اور بقایا جات بحال کر دیے گئے ہیں۔');
            await this.selectStudentForFee(fee.studentId);
        } catch (error) {
            console.error('Error deleting fee:', error);
            alert('فیس ڈیلیٹ کرنے میں غلطی ہوئی ہے۔');
        }
    }

    printBlankReceipt() {
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'رسید بک (Official Receipt)',
            receiptNo: '',
            isBlank: true,
            amount: '',
            amountInWords: '',
            payeeName: '',
            address: '',
            onAccountOf: '',
            dateStr: '',
            receivedBy: ''
        });
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
        } else {
            alert('براؤزر نے پاپ اپ بلاک کر دیا ہے۔ براؤزر سیٹنگ میں پاپ اپ کی اجازت دیں۔');
        }
    }

    printFeeReceipt(fee) {
        const date = new Date(fee.timestamp || fee.date || Date.now()).toLocaleDateString('ur-PK');
        const amountWords = this.numberToUrduWords(fee.amount);
        const payee = \`\${fee.studentName || '---'} \${fee.fatherName ? \`ولد \${fee.fatherName}\` : ''}\`;
        const purpose = \`\${fee.feeType || 'فیس'} \${fee.month ? \`(برائے \${fee.month})\` : ''} \${fee.className ? \`- درجہ \${fee.className}\` : ''}\`;

        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'فیس وصولی کی باضابطہ رسید (Fee Receipt)',
            receiptNo: fee.receiptNo || ('REC-' + Math.floor(100000 + Math.random() * 900000)),
            bookNo: '1',
            amount: fee.amount,
            amountInWords: amountWords,
            payeeName: payee,
            onAccountOf: purpose,
            dateStr: date
        });

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
        } else {
            alert('براؤزر نے پاپ اپ بلاک کر دیا ہے۔ براؤزر سیٹنگ میں پاپ اپ کی اجازت دیں۔');
        }
    }

    // Print Formal Student Ledger Statement (A4)
    async printStudentLedger(studentId) {
        const student = await MadrassahDB.getStudentById(studentId);
        if (!student) return;

        const fees = await MadrassahDB.getStudentFees(studentId);
        const admissionFee = parseInt(student.admissionFee || 0);
        const monthlyFee = parseInt(student.monthlyFee || 0);
        const totalAdmissionFee = (student.totalFee ? parseInt(student.totalFee) : (admissionFee + monthlyFee)) || parseInt(student.arrears || 0) || 0;
        const currentArrears = parseInt(student.arrears || 0);
        
        let paidAtAdmission = 0;
        if (student.paidNow !== undefined && student.paidNow !== null && student.paidNow !== '' && !isNaN(student.paidNow)) {
            paidAtAdmission = parseInt(student.paidNow);
        } else if (totalAdmissionFee > currentArrears) {
            paidAtAdmission = totalAdmissionFee - currentArrears;
        }

        let admissionArrears = student.admissionArrears !== undefined ? parseInt(student.admissionArrears) : Math.max(0, totalAdmissionFee - paidAtAdmission);
        if (admissionArrears === 0 && currentArrears > 0) admissionArrears = currentArrears;

        const totalPaid = fees.reduce((sum, f) => sum + (parseInt(f.amount) || 0), 0);
        const date = new Date().toLocaleDateString('ur-PK');
        const code = student.uniqueCode || ('STU-' + (1000 + parseInt(student.id)));

        // Ledger Rows
        const rows = [];
        let balance = admissionArrears;
        rows.push({
            date: student.admissionDate || 'بوقتِ داخلہ',
            desc: \`داخلہ و تعلیمی فیس چارج (داخلہ: Rs. \${admissionFee} + ماہانہ: Rs. \${monthlyFee})\`,
            ref: \`داخلہ فارم (#\${student.id})\`,
            debit: totalAdmissionFee,
            credit: paidAtAdmission,
            balance: admissionArrears,
            isAdm: true
        });

        let isAdmShown = paidAtAdmission > 0;
        const sorted = fees.slice().sort((a, b) => (a.timestamp || a.date || 0) - (b.timestamp || b.date || 0));
        sorted.forEach(f => {
            const amt = parseInt(f.amount || 0);
            if (isAdmShown && (f.isAdmissionPayment || (f.feeType === 'داخلہ فیس' && amt === paidAtAdmission))) {
                if (rows[0]) rows[0].ref = f.receiptNo || rows[0].ref;
                isAdmShown = false;
                return;
            }

            balance = Math.max(0, balance - amt);
            const d = new Date(f.timestamp || f.date || Date.now());
            const dStr = !isNaN(d.getTime()) ? \`\${d.getDate()}/\${d.getMonth()+1}/\${d.getFullYear()}\` : '---';
            rows.push({
                date: dStr,
                desc: \`\${f.feeType || 'فیس وصولی'} \${f.month ? \`(برائے \${f.month})\` : ''}\`,
                ref: f.receiptNo || ('REC-' + f.id),
                debit: 0,
                credit: amt,
                balance: balance
            });
        });

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('براؤزر نے پاپ اپ بلاک کر دیا ہے۔ براؤزر سیٹنگ میں پاپ اپ کی اجازت دیں۔');
            return;
        }

        printWindow.document.write(\`
            <!DOCTYPE html>
            <html lang="ur" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>فیس کھاتہ لیجر - \${student.name}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: 'Jameel Noori Nastaleeq', 'Noto Sans Urdu', Arial, sans-serif; direction: rtl; margin: 0; padding: 20px; color: #0f172a; background: white; }
                    .ledger-header { text-align: center; border-bottom: 2.5px solid #065f46; padding-bottom: 12px; margin-bottom: 15px; }
                    .ledger-header h1 { margin: 0; color: #065f46; font-size: 26px; }
                    .ledger-header h2 { margin: 4px 0; color: #475569; font-size: 16px; font-weight: normal; }
                    .student-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; margin-bottom: 15px; font-size: 13px; }
                    .student-card div span { color: #64748b; }
                    .student-card div b { color: #0f172a; }
                    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 15px; }
                    .sum-box { text-align: center; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; }
                    .sum-box .lbl { font-size: 12px; color: #64748b; }
                    .sum-box .val { font-size: 18px; font-weight: bold; font-family: monospace; margin-top: 2px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
                    th { background: #f1f5f9; color: #1e293b; text-align: center; }
                    .deb { color: #be123c; font-weight: bold; font-family: monospace; direction: ltr; text-align: center; }
                    .crd { color: #059669; font-weight: bold; font-family: monospace; direction: ltr; text-align: center; }
                    .bal { color: #0f172a; font-weight: bold; font-family: monospace; direction: ltr; text-align: center; }
                    .footer-signs { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 30px; }
                    .sig-line { border-top: 1px solid #334155; width: 150px; text-align: center; padding-top: 5px; font-size: 12px; color: #334155; }
                    @media print { .no-print { display: none; } body { padding: 0; } }
                </style>
                <script>
                function downloadDoc(filename) {
                    const clone = document.documentElement.cloneNode(true);
                    clone.querySelectorAll('.no-print').forEach(el => el.remove());
                    const htmlContent = '<!DOCTYPE html>\\n' + clone.outerHTML;
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = (filename || 'لیجر') + '.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                </script>
            </head>
            <body>
                <div class="ledger-header">
                    <h1>مدرسہ عبد الرحمن بن عوف غفوریہ (خانیوال)</h1>
                    <h2>طالب علم فیس کھاتہ و تفصیلی مالیاتی گوشوارہ (Student Fee Ledger)</h2>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">تاریخِ پرنٹ: \${date}</div>
                </div>

                <div class="student-card">
                    <div><span>نامِ طالب علم:</span> <b>\${student.name}</b></div>
                    <div><span>ولدیت:</span> <b>\${student.fatherName || '---'}</b></div>
                    <div><span>رجسٹریشن کوڈ:</span> <b style="font-family:monospace; color:#065f46;">\${code}</b></div>
                    <div><span>شعبہ:</span> <b>\${student.department || '---'}</b></div>
                    <div><span>درجہ / کلاس:</span> <b>\${student.className || student.class || '---'}</b></div>
                    <div><span>تاریخ داخلہ:</span> <b>\${student.admissionDate || '---'}</b></div>
                </div>

                <div class="summary-grid">
                    <div class="sum-box">
                        <div class="lbl">داخلہ فیس و واجبات</div>
                        <div class="val" style="color:#0f172a;">Rs. \${totalAdmissionFee.toLocaleString()}</div>
                    </div>
                    <div class="sum-box" style="border-color:\${admissionArrears > 0 ? '#fca5a5' : '#cbd5e1'}; background:\${admissionArrears > 0 ? '#fffbfa' : '#f8fafc'};">
                        <div class="lbl" style="color:\${admissionArrears > 0 ? '#b91c1c' : '#475569'};">داخلہ کے وقت کا بقایا</div>
                        <div class="val" style="color:\${admissionArrears > 0 ? '#dc2626' : '#16a34a'};">Rs. \${admissionArrears.toLocaleString()}</div>
                    </div>
                    <div class="sum-box" style="border-color:\${currentArrears > 0 ? '#fca5a5' : '#86efac'}; background:\${currentArrears > 0 ? '#fef2f2' : '#f0fdf4'};">
                        <div class="lbl" style="color:\${currentArrears > 0 ? '#991b1b' : '#166534'};">موجودہ واجب الادا بقایا جات</div>
                        <div class="val" style="color:\${currentArrears > 0 ? '#dc2626' : '#16a34a'};">Rs. \${currentArrears.toLocaleString()}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width:30px;">#</th>
                            <th style="width:85px;">تاریخ</th>
                            <th>تفصیل و نوعیت</th>
                            <th style="width:110px;">رسید / حوالہ</th>
                            <th style="width:90px;">کل واجب (Dues)</th>
                            <th style="width:90px;">وصول (Received)</th>
                            <th style="width:100px;">بقایا (Balance)</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${rows.map((r, i) => \`
                            <tr style="\${r.isAdm ? 'background:#fffdf5;' : ''}">
                                <td style="text-align:center;">\${i+1}</td>
                                <td style="text-align:center; font-family:monospace;">\${r.date}</td>
                                <td>\${r.desc}</td>
                                <td style="text-align:center; font-family:monospace;">\${r.ref}</td>
                                <td class="deb">\${r.debit > 0 ? ('Rs. ' + r.debit.toLocaleString()) : '—'}</td>
                                <td class="crd">\${r.credit > 0 ? ('Rs. ' + r.credit.toLocaleString()) : '—'}</td>
                                <td class="bal" style="color:\${r.balance > 0 ? '#dc2626' : '#16a34a'};">
                                    Rs. \${r.balance.toLocaleString()}
                                    \${r.isAdm && r.balance > 0 ? '<span style="font-size:10px; display:block; color:#dc2626;">(داخلہ کا بقایا)</span>' : ''}
                                </td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>

                <div class="footer-signs">
                    <div class="sig-line">دستخط کیشیئر / ناظم فیس</div>
                    <div class="sig-line">دستخط سرپرست / والد</div>
                    <div class="sig-line">دستخط و مہر مہتمم</div>
                </div>

                <div class="no-print" style="text-align:center; margin-top:30px; display:flex; justify-content:center; gap:12px;">
                    <button onclick="window.print()" style="padding:10px 35px; background:#065f46; color:white; border:none; border-radius:20px; font-weight:bold; font-size:14px; cursor:pointer;">
                        <i class="fas fa-print"></i> پرنٹ کریں (Print)
                    </button>
                    <button onclick="downloadDoc('لیجر_\${student.name ? student.name.replace(/['\\"\\\\s]+/g, '_') : 'Student'}')" style="padding:10px 30px; background:#0284c7; color:white; border:none; border-radius:20px; font-weight:bold; font-size:14px; cursor:pointer;">
                        <i class="fas fa-download"></i> ڈاؤن لوڈ کریں (HTML)
                    </button>
                </div>
            </body>
            </html>
        \`);
        printWindow.document.close();
    }
\n`;

const updatedContent = content.substring(0, startIdx) + cleanFeeModule + content.substring(endIdx);
fs.writeFileSync(appPath, updatedContent, 'utf8');
console.log('Successfully simplified and fixed Fee Module in app.js!');
