const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appPath = path.resolve(__dirname, '../app.js');
const backupPath = path.resolve(__dirname, '../app.js.backup_final_clean');

console.log('Loading clean backup:', backupPath);
const backupCode = fs.readFileSync(backupPath, 'utf8');

// 1. numUrduMarker
const numUrduMarker = "return parts.join(' ').trim() + ' روپے صرف';";
const numUrduIdx = backupCode.indexOf(numUrduMarker);
console.log('numUrduIdx:', numUrduIdx);
if (numUrduIdx === -1) {
    console.error('numUrduMarker not found!');
    process.exit(1);
}
const closeBraceIdx = backupCode.indexOf('}', numUrduIdx);
const part1 = backupCode.substring(0, closeBraceIdx + 1);

// 2. downloadReceiptImageDirect
const directImgMarker = "downloadReceiptImageDirect(options) {";
let directImgIdx = backupCode.indexOf(directImgMarker);
console.log('directImgIdx:', directImgIdx);
while (directImgIdx > 0 && backupCode[directImgIdx - 1] !== '\n') directImgIdx--;

// 3. renderAttendanceModule
const attModMarker = "renderAttendanceModule(container) {";
let attModIdx = backupCode.indexOf(attModMarker);
console.log('attModIdx:', attModIdx);
while (attModIdx > 0 && backupCode[attModIdx - 1] !== '\n') attModIdx--;
const receiptHelpersPart = backupCode.substring(directImgIdx, attModIdx).trim();

// 4. printAdmissionReceipt
const admMarker = "printAdmissionReceipt(student, paidAmount, receiptNo, remaining) {";
let admIdx = backupCode.indexOf(admMarker);
console.log('admIdx:', admIdx);
while (admIdx > 0 && backupCode[admIdx - 1] !== '\n') admIdx--;
const afterAccountsPart = backupCode.substring(admIdx);

const cleanReceipt = fs.readFileSync(path.resolve(__dirname, 'clean_receipt.txt'), 'utf8');
const cleanAttendance = fs.readFileSync(path.resolve(__dirname, 'clean_attendance.txt'), 'utf8');
const cleanBaitUlMaal = fs.readFileSync(path.resolve(__dirname, 'clean_baitulmaal.txt'), 'utf8');

let code = [
    part1,
    cleanReceipt,
    receiptHelpersPart,
    cleanAttendance,
    cleanBaitUlMaal,
    afterAccountsPart
].join('\n\n');

console.log('Base code assembled, length:', code.length);

// 1. In constructor, add authentication state
const ctorInitMarker = "this.init();\n    }";
const ctorInitIdx = code.indexOf(ctorInitMarker);
console.log('ctorInitIdx (LF):', ctorInitIdx);
let ctorMarkerToUse = ctorInitMarker;
if (ctorInitIdx === -1) {
    const ctorInitMarkerCRLF = "this.init();\r\n    }";
    const ctorInitIdxCRLF = code.indexOf(ctorInitMarkerCRLF);
    console.log('ctorInitIdx (CRLF):', ctorInitIdxCRLF);
    if (ctorInitIdxCRLF === -1) {
        console.error('Could not find ctor init marker!');
        process.exit(1);
    }
    ctorMarkerToUse = ctorInitMarkerCRLF;
}

const ctorReplace = `const savedAuth = typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('mms_authenticated') === 'true' || localStorage.getItem('mms_authenticated') === 'true');
        this.isAuthenticated = !!savedAuth;
        this.init();
    }`;

code = code.replace(ctorMarkerToUse, ctorReplace);
console.log('Constructor updated with authentication check');

// 2. In init(), route to welcome login screen if not authenticated
const initRenderMarker = `this.applySectionTheme(this.currentSection || 'banin');
            await this.render();`;
const initRenderMarkerCRLF = `this.applySectionTheme(this.currentSection || 'banin');\r\n            await this.render();`;

const initRenderReplace = `if (!this.isAuthenticated) {
                this.showWelcomeLoginScreen();
            } else {
                this.showAppScreen();
                this.applySectionTheme(this.currentSection || 'banin');
                await this.render();
            }`;

if (code.includes(initRenderMarker)) {
    code = code.replace(initRenderMarker, initRenderReplace);
    console.log('init() updated (LF)');
} else if (code.includes(initRenderMarkerCRLF)) {
    code = code.replace(initRenderMarkerCRLF, initRenderReplace);
    console.log('init() updated (CRLF)');
} else {
    console.error('Could not find initRenderMarker!');
    process.exit(1);
}

// 3. Add auth methods right after init()
const afterInitMarker = `صفحہ دوبارہ لوڈ کریں (Refresh)`;
const afterInitIdx = code.indexOf(afterInitMarker);
console.log('afterInitIdx:', afterInitIdx);
if (afterInitIdx === -1) {
    console.error('Could not find afterInitMarker');
    process.exit(1);
}
// Find the end of init() which is after the catch block:
// \`; \n } \n } \n }
let endOfInitIdx = code.indexOf('}', afterInitIdx);
endOfInitIdx = code.indexOf('}', endOfInitIdx + 1);
endOfInitIdx = code.indexOf('}', endOfInitIdx + 1);
console.log('Snippet at end of init():', JSON.stringify(code.substring(endOfInitIdx - 20, endOfInitIdx + 20)));

const authMethodsCode = `

    showWelcomeLoginScreen() {
        const welcome = document.getElementById('welcome-login-screen');
        const appEl = document.getElementById('app');
        if (welcome) welcome.style.display = 'flex';
        if (appEl) appEl.style.display = 'none';
        const passInput = document.getElementById('login-password-input');
        if (passInput) {
            passInput.value = '';
            setTimeout(() => passInput.focus(), 250);
        }
        const errAlert = document.getElementById('login-error-alert');
        if (errAlert) errAlert.style.display = 'none';
    }

    showAppScreen() {
        const welcome = document.getElementById('welcome-login-screen');
        const appEl = document.getElementById('app');
        if (welcome) welcome.style.display = 'none';
        if (appEl) appEl.style.display = 'flex';
    }

    toggleLoginPassVisibility() {
        const input = document.getElementById('login-password-input');
        const btn = document.getElementById('login-pass-toggle-btn');
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            if (btn) btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            if (btn) btn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }

    async handleLogin(event) {
        if (event) event.preventDefault();
        const input = document.getElementById('login-password-input');
        const rememberCheckbox = document.getElementById('login-remember-checkbox');
        const errAlert = document.getElementById('login-error-alert');
        const errText = document.getElementById('login-error-text');
        const submitBtn = document.getElementById('btn-login-submit');

        if (!input) return;
        const enteredPassword = input.value.trim();

        // Default password is '123' if not yet customized in Settings
        let storedPassword = '123';
        try {
            const val = await MadrassahDB.getSetting('app_password');
            if (val) storedPassword = val;
        } catch (e) {
            console.error('Error reading app_password setting:', e);
        }

        if (enteredPassword === storedPassword) {
            if (errAlert) errAlert.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> لاگ ان ہو رہا ہے...';
            }

            this.isAuthenticated = true;
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('mms_authenticated', 'true');
            }
            if (rememberCheckbox && rememberCheckbox.checked) {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('mms_authenticated', 'true');
                }
            } else {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem('mms_authenticated');
                }
            }

            setTimeout(async () => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-right-to-bracket"></i> داخل ہوں (Sign In)';
                }
                this.showAppScreen();
                this.applySectionTheme(this.currentSection || 'banin');
                this.navigate('dashboard');
                this.showToast('خوش آمدید! آپ کامیابی سے لاگ ان ہو چکے ہیں۔', 'success');
            }, 300);
        } else {
            if (errAlert) {
                errAlert.style.display = 'flex';
                if (errText) errText.innerText = 'درج کردہ پاسورڈ درست نہیں ہے! دوبارہ کوشش فرمائیں۔ (ڈیفالٹ: 123)';
            }
            input.style.borderColor = '#ef4444';
            input.select();
            input.focus();
            setTimeout(() => {
                if (input) input.style.borderColor = '#cbd5e1';
            }, 2000);
        }
    }

    logout() {
        if (!confirm('کیا آپ واقعی سافٹ ویئر سے لاگ آؤٹ ہونا چاہتے ہیں؟')) return;
        this.isAuthenticated = false;
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('mms_authenticated');
        if (typeof localStorage !== 'undefined') localStorage.removeItem('mms_authenticated');
        this.showWelcomeLoginScreen();
        this.showToast('آپ کامیابی سے لاگ آؤٹ ہو چکے ہیں۔', 'info');
    }

    async handlePasswordChange(event) {
        if (event) event.preventDefault();
        const currentInput = document.getElementById('current-pass-input');
        const newInput = document.getElementById('new-pass-input');
        const confirmInput = document.getElementById('confirm-pass-input');
        const msgSpan = document.getElementById('pass-change-msg');

        if (!currentInput || !newInput || !confirmInput) return;

        const currentVal = currentInput.value.trim();
        const newVal = newInput.value.trim();
        const confirmVal = confirmInput.value.trim();

        let storedPass = '123';
        try {
            const val = await MadrassahDB.getSetting('app_password');
            if (val) storedPass = val;
        } catch (e) {
            console.error('Error reading app_password:', e);
        }

        const showMsg = (text, isError = true) => {
            if (msgSpan) {
                msgSpan.style.display = 'inline-block';
                msgSpan.style.color = isError ? '#dc2626' : '#059669';
                msgSpan.innerHTML = (isError ? '<i class="fas fa-circle-exclamation"></i> ' : '<i class="fas fa-circle-check"></i> ') + text;
            }
        };

        if (currentVal !== storedPass) {
            showMsg('موجودہ پاسورڈ غلط ہے!', true);
            currentInput.focus();
            return;
        }

        if (!newVal) {
            showMsg('نیا پاسورڈ خالی نہیں ہو سکتا!', true);
            newInput.focus();
            return;
        }

        if (newVal !== confirmVal) {
            showMsg('نئے پاسورڈ اور تصدیق میں مطابقت نہیں ہے!', true);
            confirmInput.focus();
            return;
        }

        try {
            await MadrassahDB.saveSetting('app_password', newVal);
            showMsg('پاسورڈ کامیابی سے تبدیل کر دیا گیا ہے!', false);
            this.showToast('سیکیورٹی پاسورڈ کامیابی سے تبدیل کر دیا گیا ہے!', 'success');

            currentInput.value = '';
            newInput.value = '';
            confirmInput.value = '';
        } catch (err) {
            showMsg('پاسورڈ محفوظ کرتے وقت خرابی پیش آگئی: ' + err.message, true);
        }
    }
`;

code = code.substring(0, endOfInitIdx + 1) + authMethodsCode + code.substring(endOfInitIdx + 1);
console.log('Authentication methods inserted');

// 4. In renderSettingsModule, add Password Change Card
const changePasswordCard = `
                <!-- CARD 0: Security Password Change Card -->
                <div class="card" style="border-radius:18px; margin-bottom:1.5rem; border-top:5px solid #065f46; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:1.2rem; border-bottom:1px solid #f1f5f9; padding-bottom:1rem;">
                        <div style="display:flex; align-items:center; gap:14px;">
                            <div style="width:52px; height:52px; border-radius:14px; background:#ecfdf5; color:#065f46; display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
                                <i class="fas fa-shield-halved"></i>
                            </div>
                            <div>
                                <h3 style="margin:0; color:#065f46; font-size:1.35rem;">سیکیورٹی پاسورڈ تبدیل کریں (Change Password)</h3>
                                <p style="margin:2px 0 0 0; color:#64748b; font-size:0.95rem;">سافٹ ویئر لاگ ان کے لیے اپنی مرضی کا نیا پاسورڈ مقرر فرمائیں (موجودہ ڈیفالٹ: 123)</p>
                            </div>
                        </div>
                        <span style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; padding:4px 14px; border-radius:20px; font-size:0.85rem; font-weight:bold;">
                            <i class="fas fa-lock"></i> پاسورڈ پروٹیکٹڈ
                        </span>
                    </div>

                    <form onsubmit="app.handlePasswordChange(event)" style="max-width:650px;">
                        <div style="display:grid; grid-template-columns:1fr; gap:1.2rem; margin-bottom:1.2rem;">
                            <div>
                                <label style="display:block; font-weight:bold; color:#1e293b; margin-bottom:6px; font-size:0.95rem;">
                                    موجودہ پاسورڈ (Current Password):
                                </label>
                                <div style="position:relative;">
                                    <input type="password" id="current-pass-input" placeholder="موجودہ پاسورڈ لکھیں (ڈیفالٹ: 123)" required style="width:100%; padding:10px 40px 10px 12px; font-size:1rem; border:1.5px solid #cbd5e1; border-radius:10px; background:#fff;">
                                    <i class="fas fa-key" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1rem;">
                                <div>
                                    <label style="display:block; font-weight:bold; color:#1e293b; margin-bottom:6px; font-size:0.95rem;">
                                        نیا پاسورڈ (New Password):
                                    </label>
                                    <div style="position:relative;">
                                        <input type="password" id="new-pass-input" placeholder="نیا پاسورڈ درج کریں..." required style="width:100%; padding:10px 40px 10px 12px; font-size:1rem; border:1.5px solid #cbd5e1; border-radius:10px; background:#fff;">
                                        <i class="fas fa-lock" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                                    </div>
                                </div>
                                <div>
                                    <label style="display:block; font-weight:bold; color:#1e293b; margin-bottom:6px; font-size:0.95rem;">
                                        نئے پاسورڈ کی تصدیق (Confirm):
                                    </label>
                                    <div style="position:relative;">
                                        <input type="password" id="confirm-pass-input" placeholder="نیا پاسورڈ دوبارہ درج کریں..." required style="width:100%; padding:10px 40px 10px 12px; font-size:1rem; border:1.5px solid #cbd5e1; border-radius:10px; background:#fff;">
                                        <i class="fas fa-check-double" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
                            <button type="submit" class="btn btn-primary" style="background:#065f46; padding:10px 24px; font-size:1rem; font-weight:bold; display:flex; align-items:center; gap:8px; border-radius:10px;">
                                <i class="fas fa-floppy-disk"></i> نیا پاسورڈ محفوظ کریں
                            </button>
                            <span id="pass-change-msg" style="font-weight:bold; font-size:0.95rem; display:none;"></span>
                        </div>
                    </form>
                </div>
`;

const settingsNoticeMarker = '<!-- UNIFIED DATA GUARANTEE NOTICE';
const sIdx = code.indexOf(settingsNoticeMarker);
if (sIdx !== -1) {
    code = code.substring(0, sIdx) + changePasswordCard + '\n\n                ' + code.substring(sIdx);
    console.log('Password change card added to Settings module');
} else {
    console.warn('Could not find settingsNoticeMarker');
}

// 5. Update bottom listeners
code = code.replace(
    /window\.app\.render\(\);/g,
    'if (window.app && window.app.isAuthenticated) window.app.render();'
);

// 6. Validate with vm.Script
try {
    new vm.Script(code, { filename: 'app.js' });
    console.log('===========================================================');
    console.log('VALIDATION PASSED! Final app.js is 100% syntactically valid!');
    console.log('===========================================================');
    fs.writeFileSync(appPath, code, 'utf8');
    console.log('app.js successfully updated on disk!');
} catch (e) {
    console.error('SYNTAX VALIDATION FAILED:', e.stack);
    process.exit(1);
}
