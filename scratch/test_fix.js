const fs = require('fs');

const lines = fs.readFileSync('app.js', 'utf8').split('\n');

// Replace lines 12394 to 12433 (1-indexed: 12394 is index 12393, 12433 is index 12432)
const before = lines.slice(0, 12393); // up to line 12393 (ends with container.innerHTML = `...`;)
const replacement = [
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
const after = lines.slice(12433); // line 12434 onwards (empty line, then updateFeeCalculationMath)

const newLines = before.concat(replacement, after);
fs.writeFileSync('scratch/test_app.js', newLines.join('\n'));
console.log('Wrote scratch/test_app.js. Now running syntax check...');
