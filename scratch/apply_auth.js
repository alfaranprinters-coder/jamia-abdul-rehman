const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appPath = path.resolve(__dirname, '../app.js');
// Start from the clean assembled app.js (from repair_app.js)
let code = fs.readFileSync(appPath, 'utf8');

// If app.js was corrupted by fuzzy replace, restore part1 from backup_final_clean or repair_app
const backupPath = appPath + '.backup_final_clean';
if (fs.existsSync(backupPath) && code.includes('مشقِ حدر و روانی\',\n    }')) {
    console.log('Restoring from clean backup...');
    // Re-run the clean assembly from repair_app.js logic
    const backupCode = fs.readFileSync(backupPath, 'utf8');
    const numUrduMarker = "return parts.join(' ').trim() + ' روپے صرف';";
    const numUrduIdx = backupCode.indexOf(numUrduMarker);
    const closeBraceIdx = backupCode.indexOf('}', numUrduIdx);
    const part1 = backupCode.substring(0, closeBraceIdx + 1);

    const directImgMarker = "downloadReceiptImageDirect(options) {";
    let directImgIdx = backupCode.indexOf(directImgMarker);
    while (directImgIdx > 0 && backupCode[directImgIdx - 1] !== '\n') directImgIdx--;

    const attModMarker = "renderAttendanceModule(container) {";
    let attModIdx = backupCode.indexOf(attModMarker);
    while (attModIdx > 0 && backupCode[attModIdx - 1] !== '\n') attModIdx--;
    const receiptHelpersPart = backupCode.substring(directImgIdx, attModIdx).trim();

    const admMarker = "printAdmissionReceipt(student, paidAmount, receiptNo, remaining) {";
    let admIdx = backupCode.indexOf(admMarker);
    while (admIdx > 0 && backupCode[admIdx - 1] !== '\n') admIdx--;
    const afterAccountsPart = backupCode.substring(admIdx);

    const cleanReceipt = fs.readFileSync(path.resolve(__dirname, 'clean_receipt.txt'), 'utf8');
    const cleanAttendance = fs.readFileSync(path.resolve(__dirname, 'clean_attendance.txt'), 'utf8');
    const cleanBaitUlMaal = fs.readFileSync(path.resolve(__dirname, 'clean_baitulmaal.txt'), 'utf8');

    code = [
        part1,
        cleanReceipt,
        receiptHelpersPart,
        cleanAttendance,
        cleanBaitUlMaal,
        afterAccountsPart
    ].join('\n\n');
    console.log('Clean baseline reassembled, length:', code.length);
}

// 1. Add authentication state to constructor
const ctorMarker = "        this.init();\n    }";
const ctorReplace = `        const savedAuth = typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('mms_authenticated') === 'true' || localStorage.getItem('mms_authenticated') === 'true');
        this.isAuthenticated = !!savedAuth;
        this.init();
    }`;

if (!code.includes("this.isAuthenticated = !!savedAuth;")) {
    const idx = code.indexOf(ctorMarker);
    if (idx === -1) {
        console.error('Could not find ctorMarker');
        process.exit(1);
    }
    code = code.substring(0, idx) + ctorReplace + code.substring(idx + ctorMarker.length);
    console.log('Constructor updated with authentication check');
}

// 2. Update init() to check authentication and add auth methods
const initRenderMarker = `            this.applySectionTheme(this.currentSection || 'banin');
            await this.render();`;

const initRenderReplace = `            if (!this.isAuthenticated) {
                this.showWelcomeLoginScreen();
            } else {
                this.showAppScreen();
                this.applySectionTheme(this.currentSection || 'banin');
                await this.render();
            }`;

if (code.includes(initRenderMarker)) {
    code = code.replace(initRenderMarker, initRenderReplace);
    console.log('init() updated to route to welcome screen if unauthenticated');
}

// 3. Add auth methods right after init()
const afterInitMarker = `                        <button class="btn btn-primary" onclick="location.reload()" style="background:#e11d48; border:none; padding:10px 24px;">
                            <i class="fas fa-rotate-right"></i> صفحہ دوبارہ لوڈ کریں (Refresh)
                        </button>
                    </div>
                \`;
            }
        }
    }`;

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
        const storedPassword = (await MadrassahDB.getSetting('app_password')) || '123';

        if (enteredPassword === storedPassword) {
            if (errAlert) errAlert.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> لاگ ان ہو رہا ہے...';
            }

            this.isAuthenticated = true;
            sessionStorage.setItem('mms_authenticated', 'true');
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('mms_authenticated', 'true');
            } else {
                localStorage.removeItem('mms_authenticated');
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
        sessionStorage.removeItem('mms_authenticated');
        localStorage.removeItem('mms_authenticated');
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

        const storedPass = (await MadrassahDB.getSetting('app_password')) || '123';

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

        await MadrassahDB.saveSetting('app_password', newVal);
        showMsg('پاسورڈ کامیابی سے تبدیل کر دیا گیا ہے!', false);
        this.showToast('سیکیورٹی پاسورڈ کامیابی سے تبدیل کر دیا گیا ہے!', 'success');

        currentInput.value = '';
        newInput.value = '';
        confirmInput.value = '';
    }`;

if (!code.includes("showWelcomeLoginScreen()")) {
    const afterInitIdx = code.indexOf(afterInitMarker);
    if (afterInitIdx === -1) {
        console.error('Could not find afterInitMarker');
        process.exit(1);
    }
    code = code.substring(0, afterInitIdx + afterInitMarker.length) + authMethodsCode + code.substring(afterInitIdx + afterInitMarker.length);
    console.log('Authentication methods added to MadrassahApp');
}

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
if (!code.includes("CARD 0: Security Password Change Card")) {
    const sIdx = code.indexOf(settingsNoticeMarker);
    if (sIdx !== -1) {
        code = code.substring(0, sIdx) + changePasswordCard + '\n\n                ' + code.substring(sIdx);
        console.log('Password change card added to Settings module');
    } else {
        console.warn('Could not find settingsNoticeMarker');
    }
}

// 5. Update bottom event listeners
code = code.replace(
    /window\.app\.render\(\);/g,
    'if (window.app.isAuthenticated) window.app.render();'
);

// 6. Validate with vm.Script
try {
    new vm.Script(code, { filename: 'app.js' });
    console.log('VALIDATION PASSED! app.js with Welcome/Login & Password management is 100% valid!');
    fs.writeFileSync(appPath, code, 'utf8');
    console.log('app.js successfully updated!');
} catch (e) {
    console.error('SYNTAX VALIDATION FAILED:', e.stack);
    process.exit(1);
}
