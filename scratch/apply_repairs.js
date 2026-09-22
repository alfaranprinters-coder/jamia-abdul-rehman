const fs = require('fs');

const raw = fs.readFileSync('app.js', 'utf8');
const isCRLF = raw.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);

console.log('Total lines:', lines.length);

// 1. Check updateNavActiveState at line 452 (index 451)
console.log('Line 452:', lines[451]);
console.log('Line 480:', lines[479]);

// 2. Check fee section around line 12394 (index 12393)
console.log('Line 12393:', lines[12392]);
console.log('Line 12433:', lines[12432]);
console.log('Line 12435:', lines[12434]);

if (lines[451].includes('updateNavActiveState()') && lines[12392].trim() === '`;') {
    // Replace lines 452-480 (index 451 to 480 exclusive)
    const newNavLines = [
        "    updateNavActiveState() {",
        "        document.querySelectorAll('.nav-link').forEach(link => {",
        "            const dataView = link.getAttribute('data-view');",
        "            const onclick = link.getAttribute('onclick') || '';",
        "            const match = onclick.match(/(?:navigate|_nav)\\(['\"]([^'\"]+)['\"]\\)/);",
        "            const view = dataView || (match ? match[1] : null);",
        "            ",
        "            const isActive = view === this.currentView;",
        "            link.classList.toggle('active', isActive);",
        "            ",
        "            if (isActive) {",
        "                const title = document.getElementById('mms-view-title');",
        "                const span = link.querySelector('span');",
        "                if (title && span) title.innerText = span.innerText;",
        "            }",
        "        });",
        "    }",
        "",
        "    async render() {",
        "        const container = document.getElementById('main-content');",
        "        if (!container) return;",
        "        container.innerHTML = '<div style=\"text-align:center; padding: 5rem;\"><div class=\"mms-spinner\"></div></div>';",
        "        try {",
        "            switch (this.currentView) {",
        "                case 'dashboard': await this.renderDashboard(container); break;",
        "                case 'admission': this.renderAdmissionForm(container); break;",
        "                case 'students': await this.renderStudentList(container); break;",
        "                case 'graduates': await GraduatesModule.render(container); break;",
        "                case 'staff_list': await this.renderStaffList(container); break;",
        "                case 'staff_form':",
        "                case 'teacherForm': await this.renderStaffForm(container); break;"
    ];

    // Replace lines 12394 to 12433 (index 12393 to 12433 exclusive)
    const newFeeLines = [
        "        this.updateFeeCalculationMath(false);",
        "",
        "        if (focusForm) {",
        "            setTimeout(() => {",
        "                const formEl = document.querySelector('#fee_details_container form');",
        "                if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });",
        "            }, 250);",
        "        } else {",
        "            window.scrollTo({ top: 0, behavior: 'smooth' });",
        "        }",
        "    }",
        "",
        "    updateFeeCalculation() {",
        "        const student = this.currentFeeStudent;",
        "        if (!student) return;",
        "",
        "        const feeType = document.getElementById('fee_type_select')?.value || 'ماہانہ فیس';",
        "        const monthlyFee = parseInt(student.monthlyFee || 0);",
        "        const admissionArrears = parseInt(student.admissionArrears !== undefined ? student.admissionArrears : (student.arrears || 0));",
        "        const monthSelect = document.getElementById('fee_month_select');",
        "        const monthContainer = document.getElementById('fee_month_container');",
        "        const currentFeeInput = document.getElementById('fee_current_amount');",
        "        const prevArrearsInput = document.getElementById('fee_previous_arrears');",
        "",
        "        if (feeType === 'ماہانہ فیس') {",
        "            if (monthSelect) monthSelect.disabled = false;",
        "            if (monthContainer) monthContainer.style.opacity = '1';",
        "            if (currentFeeInput) currentFeeInput.value = monthlyFee > 0 ? monthlyFee : 1000;",
        "            if (prevArrearsInput) prevArrearsInput.value = admissionArrears;",
        "        } else if (feeType === 'داخلہ فیس کا بقایا') {",
        "            if (monthSelect) monthSelect.disabled = true;",
        "            if (monthContainer) monthContainer.style.opacity = '0.4';",
        "            if (currentFeeInput) currentFeeInput.value = 0;",
        "            if (prevArrearsInput) prevArrearsInput.value = admissionArrears > 0 ? admissionArrears : 0;",
        "        } else {",
        "            if (monthSelect) monthSelect.disabled = true;",
        "            if (monthContainer) monthContainer.style.opacity = '0.4';",
        "            if (currentFeeInput) currentFeeInput.value = 500;",
        "            if (prevArrearsInput) prevArrearsInput.value = admissionArrears;",
        "        }",
        "        this.updateFeeCalculationMath(false);",
        "    }"
    ];

    // Perform fee replacement first (at higher line number so indices below don't shift)
    lines.splice(12393, 12433 - 12393, ...newFeeLines);

    // Perform nav replacement next
    lines.splice(451, 480 - 451, ...newNavLines);

    fs.writeFileSync('app.js', lines.join(eol), 'utf8');
    console.log('Successfully patched app.js!');
} else {
    console.error('Validation checks failed!');
    process.exit(1);
}
