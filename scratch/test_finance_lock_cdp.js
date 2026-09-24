const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const indexPath = path.resolve(__dirname, '../index.html');
const url = 'file:///' + indexPath.replace(/\\/g, '/');
const port = 9333;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(u) {
    return new Promise((resolve, reject) => {
        http.get(u, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

class CdpClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.msgId = 1;
        this.pending = new Map();
    }

    async connect() {
        this.ws = new WebSocket(this.wsUrl);
        await new Promise((resolve, reject) => {
            this.ws.onopen = resolve;
            this.ws.onerror = reject;
        });
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.id && this.pending.has(data.id)) {
                const { resolve, reject } = this.pending.get(data.id);
                this.pending.delete(data.id);
                if (data.error) reject(data.error);
                else resolve(data.result);
            }
        };
    }

    send(method, params = {}) {
        const id = this.msgId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
    }
}

async function run() {
    console.log('Starting Edge process with remote debugging on port ' + port);
    const tempDir = path.resolve(__dirname, 'temp_edge_finance_profile');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const proc = spawn(edgePath, [
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${tempDir}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        url
    ]);

    proc.stderr.on('data', d => {});
    proc.stdout.on('data', d => {});

    try {
        let targets = null;
        for (let i = 0; i < 30; i++) {
            await sleep(500);
            try {
                targets = await getJson(`http://127.0.0.1:${port}/json`);
                if (targets && targets.length > 0) break;
            } catch (e) {}
        }

        if (!targets || targets.length === 0) {
            throw new Error('Could not connect to Edge remote debugging.');
        }

        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('No page target found');

        const client = new CdpClient(pageTarget.webSocketDebuggerUrl);
        await client.connect();
        console.log('Connected to CDP!');

        await sleep(2500);

        // Check readiness
        const readyState = await client.evaluate(`document.readyState`);
        const hasApp = await client.evaluate(`typeof window.app !== 'undefined'`);
        const isAlreadyAuth = await client.evaluate(`window.app && window.app.isAuthenticated`);
        console.log('ReadyState:', readyState, 'App initialized:', hasApp, 'Already auth:', isAlreadyAuth);

        // Step 1: Login to main software if not already logged in
        console.log('\n--- Step 1: Login to software ---');
        if (!isAlreadyAuth) {
            await client.evaluate(`
                const inp = document.getElementById('login-password-input');
                if (inp) {
                    inp.value = '123';
                    window.app.handleLogin();
                } else if (typeof window.enterSoftwareDirectly === 'function') {
                    window.enterSoftwareDirectly('123');
                }
            `);
            await sleep(1000);
        }

        const isAuth = await client.evaluate(`window.app.isAuthenticated`);
        console.log('Software Authenticated:', isAuth);
        if (!isAuth) throw new Error('Failed to login to software');

        // Step 2: Navigate to accounts (Bait-ul-Maal)
        console.log('\n--- Step 2: Navigate to accounts (Bait-ul-Maal) ---');
        await client.evaluate(`window.app.navigate('accounts')`);
        await sleep(500);

        const hasLockScreen = await client.evaluate(`
            !!document.getElementById('finance-lock-pass-input')
        `);
        const lockTitle = await client.evaluate(`
            document.querySelector('#main-content h3') ? document.querySelector('#main-content h3').innerText : ''
        `);
        console.log('Lock screen input present:', hasLockScreen);
        console.log('Lock screen title:', lockTitle);
        if (!hasLockScreen || !lockTitle.includes('سیکیورٹی تصدیق')) {
            throw new Error('FAIL: Lock screen did not render for accounts module');
        }

        // Step 3: Enter incorrect code '999'
        console.log('\n--- Step 3: Test invalid code ---');
        await client.evaluate(`
            document.getElementById('finance-lock-pass-input').value = '999';
            window.app.verifyFinancePasscode(null, 'accounts');
        `);
        await sleep(300);

        const errorVisible = await client.evaluate(`
            document.getElementById('finance-lock-error-msg').style.display !== 'none'
        `);
        const isStillLocked = await client.evaluate(`!window.app.isFinanceUnlocked`);
        console.log('Error message visible on invalid code:', errorVisible);
        console.log('Finance still locked:', isStillLocked);
        if (!errorVisible || !isStillLocked) throw new Error('FAIL: Invalid passcode was accepted!');

        // Step 4: Enter correct code '123'
        console.log('\n--- Step 4: Enter default passcode 123 ---');
        await client.evaluate(`
            document.getElementById('finance-lock-pass-input').value = '123';
            window.app.verifyFinancePasscode(null, 'accounts');
        `);
        await sleep(800);

        const isUnlocked = await client.evaluate(`window.app.isFinanceUnlocked`);
        const hasAccountsHeader = await client.evaluate(`
            document.querySelector('#main-content h2') ? document.querySelector('#main-content h2').innerText.includes('بیت المال') : false
        `);
        const hasChangeCodeBtn = await client.evaluate(`
            document.querySelector('#main-content button[onclick*="showChangeFinancePasscodeModal"]') !== null
        `);
        const hasLockBtn = await client.evaluate(`
            document.querySelector('#main-content button[onclick*="lockFinanceSection"]') !== null
        `);
        console.log('Finance Unlocked:', isUnlocked);
        console.log('Accounts Header Present:', hasAccountsHeader);
        console.log('Change Passcode Button Present:', hasChangeCodeBtn);
        console.log('Lock Button Present:', hasLockBtn);

        if (!isUnlocked || !hasAccountsHeader || !hasChangeCodeBtn || !hasLockBtn) {
            throw new Error('FAIL: Accounts module did not unlock properly');
        }

        // Step 5: Test salary module navigation while unlocked
        console.log('\n--- Step 5: Navigate to salary_management while unlocked ---');
        await client.evaluate(`window.app.navigate('salary_management')`);
        await sleep(500);

        const hasSalaryHeader = await client.evaluate(`
            document.querySelector('#main-content h2') ? document.querySelector('#main-content h2').innerText.includes('تنخواہوں') : false
        `);
        console.log('Salary Module rendered directly:', hasSalaryHeader);
        if (!hasSalaryHeader) throw new Error('FAIL: Salary module did not render directly when unlocked');

        // Step 6: Test lockFinanceSection()
        console.log('\n--- Step 6: Test lock button ---');
        await client.evaluate(`window.app.lockFinanceSection()`);
        await sleep(500);

        const relockedInput = await client.evaluate(`
            !!document.getElementById('finance-lock-pass-input')
        `);
        console.log('Relocked lock screen shown:', relockedInput);
        if (!relockedInput) throw new Error('FAIL: Relocking did not show lock screen');

        // Step 7: Unlock again and test change passcode
        console.log('\n--- Step 7: Test changing passcode to 786 ---');
        await client.evaluate(`
            document.getElementById('finance-lock-pass-input').value = '123';
            window.app.verifyFinancePasscode(null, 'accounts');
        `);
        await sleep(600);

        await client.evaluate(`window.app.showChangeFinancePasscodeModal()`);
        await sleep(300);

        const modalOpen = await client.evaluate(`!!document.getElementById('finance-passcode-modal')`);
        console.log('Change passcode modal opened:', modalOpen);
        if (!modalOpen) throw new Error('FAIL: Modal did not open');

        await client.evaluate(`
            document.getElementById('current-finance-pass-input').value = '123';
            document.getElementById('new-finance-pass-input').value = '786';
            document.getElementById('confirm-finance-pass-input').value = '786';
            window.app.handleChangeFinancePasscodeSubmit(null);
        `);
        await sleep(1000);

        const newDbCode = await client.evaluate(`window.MadrassahDB.getSetting('baitulmaal_password')`);
        console.log('New passcode saved in IndexedDB:', newDbCode);
        if (newDbCode !== '786') throw new Error('FAIL: New passcode 786 was not saved in IndexedDB');

        // Step 8: Verify old code 123 now fails and 786 works
        console.log('\n--- Step 8: Relock and verify 786 required ---');
        await client.evaluate(`window.app.lockFinanceSection()`);
        await sleep(500);

        await client.evaluate(`
            document.getElementById('finance-lock-pass-input').value = '123';
            window.app.verifyFinancePasscode(null, 'accounts');
        `);
        await sleep(300);
        const failOld = await client.evaluate(`!window.app.isFinanceUnlocked`);
        console.log('Old code 123 fails after change:', failOld);
        if (!failOld) throw new Error('FAIL: Old code 123 was still accepted');

        await client.evaluate(`
            document.getElementById('finance-lock-pass-input').value = '786';
            window.app.verifyFinancePasscode(null, 'accounts');
        `);
        await sleep(600);
        const passNew = await client.evaluate(`window.app.isFinanceUnlocked`);
        console.log('New code 786 succeeds:', passNew);
        if (!passNew) throw new Error('FAIL: New code 786 failed to unlock');

        // Step 9: Reset back to 123 for default state
        console.log('\n--- Step 9: Reset back to default 123 ---');
        await client.evaluate(`window.MadrassahDB.saveSetting('baitulmaal_password', '123')`);
        const finalCode = await client.evaluate(`window.MadrassahDB.getSetting('baitulmaal_password')`);
        console.log('Reset code to default:', finalCode);

        // Step 10: Check Settings screen displays active code card
        console.log('\n--- Step 10: Check Settings screen card ---');
        await client.evaluate(`window.app.navigate('settings')`);
        await sleep(500);
        const settingsCard = await client.evaluate(`
            !!document.getElementById('settings-active-finance-pass-text')
        `);
        console.log('Settings active finance code card present:', settingsCard);
        if (!settingsCard) throw new Error('FAIL: Settings card for finance passcode missing');

        console.log('\n>>> ALL 10 TESTS PASSED SUCCESSFULLY! <<<');

    } finally {
        proc.kill();
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}
    }
}

run().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
