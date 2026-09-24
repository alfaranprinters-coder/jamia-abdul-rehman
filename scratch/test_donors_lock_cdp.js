const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const indexPath = path.resolve(__dirname, '../index.html');
const url = 'file:///' + indexPath.replace(/\\/g, '/');
const port = 9334;

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
    const tempDir = path.resolve(__dirname, 'temp_edge_donors_profile');
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

        // Check readiness & Software Login
        console.log('\n--- Step 1: Login to software ---');
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

        const isAuth = await client.evaluate(`window.app.isAuthenticated`);
        console.log('Software Authenticated:', isAuth);
        if (!isAuth) throw new Error('Failed to login to software');

        // Ensure finance is locked
        await client.evaluate(`
            window.app.isFinanceUnlocked = false;
            sessionStorage.removeItem('mms_finance_unlocked');
        `);

        // Step 2: Navigate to donors module while locked
        console.log('\n--- Step 2: Navigate to donors while locked ---');
        await client.evaluate(`window.app.navigate('donors')`);
        await sleep(600);

        const hasLockInput = await client.evaluate(`!!document.getElementById('finance-lock-pass-input')`);
        const lockBadgeText = await client.evaluate(`
            const badge = document.querySelector('#main-content div[style*="border-radius: 20px"]');
            badge ? badge.innerText : ''
        `);
        console.log('Donors Lock input present:', hasLockInput);
        console.log('Donors Lock badge text:', lockBadgeText);

        if (!hasLockInput || !lockBadgeText.includes('عطیات دہندگان')) {
            throw new Error('FAIL: Donors module did not show correct lock screen!');
        }

        // Step 3: Enter incorrect code '999' on donors lock screen
        console.log('\n--- Step 3: Enter incorrect passcode 999 ---');
        await client.evaluate(`
            document.getElementById('finance-lock-pass-input').value = '999';
            window.app.verifyFinancePasscode(null, 'donors');
        `);
        await sleep(300);

        const errorVisible = await client.evaluate(`
            document.getElementById('finance-lock-error-msg').style.display !== 'none'
        `);
        const stillLocked = await client.evaluate(`!window.app.isFinanceUnlocked`);
        console.log('Error message shown on incorrect passcode:', errorVisible);
        console.log('Finance remains locked:', stillLocked);

        if (!errorVisible || !stillLocked) {
            throw new Error('FAIL: Invalid passcode was accepted on Donors module!');
        }

        // Step 4: Unlock donors with correct default passcode 123
        console.log('\n--- Step 4: Unlock donors with correct passcode 123 ---');
        await client.evaluate(`
            document.getElementById('finance-lock-pass-input').value = '123';
            window.app.verifyFinancePasscode(null, 'donors');
        `);
        await sleep(1000);

        const isUnlocked = await client.evaluate(`window.app.isFinanceUnlocked`);
        const donorsHeaderFound = await client.evaluate(`
            const h2 = document.querySelector('#main-content h2');
            h2 ? h2.innerText.includes('عطیات دہندگان') : false
        `);
        const hasAddDonorBtn = await client.evaluate(`
            document.querySelector('#main-content button[onclick*="showDonorModal"]') !== null
        `);
        const hasReceiveDonationBtn = await client.evaluate(`
            document.querySelector('#main-content button[onclick*="showDonationModal"]') !== null
        `);
        const hasChangeCodeBtn = await client.evaluate(`
            document.querySelector('#main-content button[onclick*="showChangeFinancePasscodeModal"]') !== null
        `);
        const hasLockBtn = await client.evaluate(`
            document.querySelector('#main-content button[onclick*="lockFinanceSection"]') !== null
        `);

        console.log('Finance Unlocked:', isUnlocked);
        console.log('Donors Header Found:', donorsHeaderFound);
        console.log('Add Donor Button Present:', hasAddDonorBtn);
        console.log('Receive Donation Button Present:', hasReceiveDonationBtn);
        console.log('Change Passcode Button Present:', hasChangeCodeBtn);
        console.log('Lock Section Button Present:', hasLockBtn);

        if (!isUnlocked || !donorsHeaderFound || !hasAddDonorBtn || !hasReceiveDonationBtn || !hasChangeCodeBtn || !hasLockBtn) {
            throw new Error('FAIL: Donors module did not properly unlock and display full UI!');
        }

        // Step 5: Verify cross-navigation with Accounts & Salary while unlocked
        console.log('\n--- Step 5: Test cross-module seamless access ---');
        await client.evaluate(`window.app.navigate('accounts')`);
        await sleep(500);
        const accountsHeader = await client.evaluate(`
            document.querySelector('#main-content h2') ? document.querySelector('#main-content h2').innerText.includes('بیت المال') : false
        `);
        console.log('Accounts rendered seamlessly:', accountsHeader);
        if (!accountsHeader) throw new Error('FAIL: Accounts did not open directly while unlocked');

        await client.evaluate(`window.app.navigate('donors')`);
        await sleep(500);
        const donorsReopened = await client.evaluate(`
            document.querySelector('#main-content h2') ? document.querySelector('#main-content h2').innerText.includes('عطیات دہندگان') : false
        `);
        console.log('Donors returned seamlessly:', donorsReopened);
        if (!donorsReopened) throw new Error('FAIL: Donors did not reopen directly');

        // Step 6: Test locking from Donors module
        console.log('\n--- Step 6: Test lock button in Donors module ---');
        await client.evaluate(`window.app.lockFinanceSection()`);
        await sleep(600);

        const relockedInput = await client.evaluate(`!!document.getElementById('finance-lock-pass-input')`);
        const relockedBadge = await client.evaluate(`(() => {
            const badge = document.querySelector('#main-content div[style*="border-radius: 20px"]');
            return badge ? badge.innerText : '';
        })()`);
        console.log('Lock screen visible after re-locking:', relockedInput);
        console.log('Relocked badge text:', relockedBadge);

        if (!relockedInput || !relockedBadge.includes('عطیات دہندگان')) {
            throw new Error('FAIL: Re-locking did not show donors lock screen!');
        }

        // Step 7: Test direct call to DonorsModule.render(container) when locked
        console.log('\n--- Step 7: Test direct DonorsModule.render() guard when locked ---');
        await client.evaluate(`
            window.DonorsModule.render(document.getElementById('main-content'));
        `);
        await sleep(500);

        const guardedLockInput = await client.evaluate(`!!document.getElementById('finance-lock-pass-input')`);
        console.log('Direct DonorsModule.render() protected by lock:', guardedLockInput);
        if (!guardedLockInput) throw new Error('FAIL: Direct DonorsModule.render call bypassed lock!');

        // Step 8: Final unlock check
        console.log('\n--- Step 8: Final unlock back to Donors ---');
        await client.evaluate(`
            document.getElementById('finance-lock-pass-input').value = '123';
            window.app.verifyFinancePasscode(null, 'donors');
        `);
        await sleep(800);

        const finalCheck = await client.evaluate(`
            document.querySelector('#main-content h2') ? document.querySelector('#main-content h2').innerText.includes('عطیات دہندگان') : false
        `);
        console.log('Final unlock to Donors confirmed:', finalCheck);
        if (!finalCheck) throw new Error('FAIL: Final unlock failed');

        console.log('\n>>> ALL DONORS LOCK VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');

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
