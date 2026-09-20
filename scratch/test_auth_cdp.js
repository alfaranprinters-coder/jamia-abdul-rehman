const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const indexPath = path.resolve(__dirname, '../index.html');
const url = 'file:///' + indexPath.replace(/\\/g, '/');
const port = 9222;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
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

    async evaluate(expression, awaitPromise = true) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            awaitPromise,
            returnByValue: true
        });
        if (res.exceptionDetails) {
            throw new Error(JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function runTest() {
    console.log('Starting headless Edge...');
    const edge = spawn(edgePath, [
        '--headless',
        `--remote-debugging-port=${port}`,
        '--allow-file-access-from-files',
        '--disable-gpu',
        url
    ], { stdio: 'ignore' });

    let client = null;
    try {
        console.log('Waiting for Edge CDP endpoint...');
        let targets = null;
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            try {
                targets = await getJson(`http://localhost:${port}/json`);
                if (targets && targets.length > 0) break;
            } catch (e) {}
        }

        if (!targets) {
            throw new Error('Failed to connect to CDP endpoint on localhost:9222');
        }

        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('No page target found');

        console.log('Connecting WebSocket to:', pageTarget.webSocketDebuggerUrl);
        client = new CdpClient(pageTarget.webSocketDebuggerUrl);
        await client.connect();

        // Wait for app initialization
        console.log('Waiting for app initialization...');
        let appReady = false;
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            const ready = await client.evaluate('typeof window.app !== "undefined" && typeof window.MadrassahDB !== "undefined"');
            if (ready) {
                appReady = true;
                break;
            }
        }
        if (!appReady) throw new Error('window.app or window.MadrassahDB not ready');
        console.log('App loaded and DB initialized!');

        // 1. Initial State: Unauthenticated
        console.log('\n--- Test 1: Initial State ---');
        const isAuth = await client.evaluate('window.app.isAuthenticated');
        const welcomeDisplay = await client.evaluate('document.getElementById("welcome-login-screen").style.display');
        const appDisplay = await client.evaluate('document.getElementById("app").style.display');
        console.log('app.isAuthenticated:', isAuth);
        console.log('welcome screen display:', welcomeDisplay);
        console.log('app screen display:', appDisplay);

        if (isAuth === false && welcomeDisplay === 'flex' && appDisplay === 'none') {
            console.log('PASS: Initial landing is Welcome & Login screen');
        } else {
            throw new Error('FAIL: Initial landing state incorrect');
        }

        // 2. Test Wrong Password
        console.log('\n--- Test 2: Invalid Password ---');
        await client.evaluate(`
            document.getElementById('login-password-input').value = 'wrongpass';
            window.app.handleLogin();
        `);
        await sleep(300);
        const errDisplay = await client.evaluate('document.getElementById("login-error-alert").style.display');
        const isAuthAfterWrong = await client.evaluate('window.app.isAuthenticated');
        console.log('login error alert display:', errDisplay);
        console.log('isAuth after wrong password:', isAuthAfterWrong);

        if (errDisplay !== 'none' && isAuthAfterWrong === false) {
            console.log('PASS: Wrong password rejected and error alert shown');
        } else {
            throw new Error('FAIL: Wrong password was not rejected properly');
        }

        // 3. Test Correct Default Password ('123')
        console.log('\n--- Test 3: Correct Default Password (123) ---');
        await client.evaluate(`
            document.getElementById('login-password-input').value = '123';
            window.app.handleLogin();
        `);
        await sleep(800);
        const isAuthAfterCorrect = await client.evaluate('window.app.isAuthenticated');
        const welcomeAfterLogin = await client.evaluate('document.getElementById("welcome-login-screen").style.display');
        const appAfterLogin = await client.evaluate('document.getElementById("app").style.display');
        const viewTitle = await client.evaluate('document.getElementById("mms-view-title").innerText');
        console.log('app.isAuthenticated:', isAuthAfterCorrect);
        console.log('welcome screen display:', welcomeAfterLogin);
        console.log('app screen display:', appAfterLogin);
        console.log('current view title:', viewTitle);

        if (isAuthAfterCorrect === true && welcomeAfterLogin === 'none' && appAfterLogin === 'flex') {
            console.log('PASS: Login with default password 123 succeeded! Dashboard visible.');
        } else {
            throw new Error('FAIL: Login with 123 did not show dashboard');
        }

        // 4. Test Settings Password Change Card
        console.log('\n--- Test 4: Settings Navigation & Password Change Card ---');
        await client.evaluate('window.app.navigate("settings");');
        await sleep(600);

        const hasCard = await client.evaluate('!!document.getElementById("current-pass-input")');
        console.log('Password Change card in Settings exists:', hasCard);
        if (!hasCard) throw new Error('FAIL: Password change card not found in Settings');

        // Test changing password:
        // A. Wrong current password
        console.log('Testing password change with wrong current password...');
        await client.evaluate(`
            document.getElementById('current-pass-input').value = 'wrong999';
            document.getElementById('new-pass-input').value = 'newpass888';
            document.getElementById('confirm-pass-input').value = 'newpass888';
            window.app.handlePasswordChange();
        `);
        await sleep(200);
        const msgWrongCurrent = await client.evaluate('document.getElementById("pass-change-msg").innerText');
        console.log('Message for wrong current:', msgWrongCurrent);
        if (!msgWrongCurrent.includes('موجودہ پاسورڈ غلط')) {
            throw new Error('FAIL: Did not validate current password');
        }
        console.log('PASS: Validates current password');

        // B. Mismatched confirm password
        console.log('Testing password change with mismatched confirmation...');
        await client.evaluate(`
            document.getElementById('current-pass-input').value = '123';
            document.getElementById('new-pass-input').value = 'mypassword';
            document.getElementById('confirm-pass-input').value = 'different';
            window.app.handlePasswordChange();
        `);
        await sleep(200);
        const msgMismatch = await client.evaluate('document.getElementById("pass-change-msg").innerText');
        console.log('Message for mismatch:', msgMismatch);
        if (!msgMismatch.includes('مطابقت نہیں')) {
            throw new Error('FAIL: Did not validate confirmation match');
        }
        console.log('PASS: Validates confirmation match');

        // C. Successful password change
        console.log('Testing successful password change to "madrasa786"...');
        await client.evaluate(`
            document.getElementById('current-pass-input').value = '123';
            document.getElementById('new-pass-input').value = 'madrasa786';
            document.getElementById('confirm-pass-input').value = 'madrasa786';
            window.app.handlePasswordChange();
        `);
        await sleep(500);
        const msgSuccess = await client.evaluate('document.getElementById("pass-change-msg").innerText');
        const dbSetting = await client.evaluate('window.MadrassahDB.getSetting("app_password")');
        console.log('Success message:', msgSuccess);
        console.log('DB stored password:', dbSetting);

        if (dbSetting !== 'madrasa786') {
            throw new Error('FAIL: Setting app_password not updated in IndexedDB');
        }
        console.log('PASS: Password changed to "madrasa786" and saved in IndexedDB');

        // 5. Test Logout and Login with new password
        console.log('\n--- Test 5: Logout & Re-login with new password ---');
        await client.evaluate(`
            window.confirm = () => true;
            window.app.logout();
        `);
        await sleep(500);

        const isAuthAfterLogout = await client.evaluate('window.app.isAuthenticated');
        const welcomeAfterLogout = await client.evaluate('document.getElementById("welcome-login-screen").style.display');
        console.log('app.isAuthenticated after logout:', isAuthAfterLogout);
        console.log('welcome screen after logout:', welcomeAfterLogout);

        if (isAuthAfterLogout !== false || welcomeAfterLogout !== 'flex') {
            throw new Error('FAIL: Logout did not return to Welcome screen');
        }
        console.log('PASS: Logout successfully returned to Welcome screen');

        // Try login with old '123'
        console.log('Testing login with old 123 (should fail)...');
        await client.evaluate(`
            document.getElementById('login-password-input').value = '123';
            window.app.handleLogin();
        `);
        await sleep(300);
        const authOld = await client.evaluate('window.app.isAuthenticated');
        if (authOld !== false) throw new Error('FAIL: Old password should not work');
        console.log('PASS: Old password 123 rejected');

        // Login with new 'madrasa786'
        console.log('Testing login with new password "madrasa786"...');
        await client.evaluate(`
            document.getElementById('login-password-input').value = 'madrasa786';
            window.app.handleLogin();
        `);
        await sleep(800);
        const authNew = await client.evaluate('window.app.isAuthenticated');
        if (authNew !== true) throw new Error('FAIL: New password did not work');
        console.log('PASS: Login with new custom password succeeded!');

        // 6. Reset password back to default 123 for user's convenience
        console.log('\n--- Resetting password back to default "123" for user ---');
        await client.evaluate('window.MadrassahDB.saveSetting("app_password", "123")');
        const restoredPass = await client.evaluate('window.MadrassahDB.getSetting("app_password")');
        console.log('Restored default password in DB:', restoredPass);

        console.log('\n=============================================================');
        console.log('ALL TESTS PASSED! Welcome/Login and Password Management works 100%!');
        console.log('=============================================================');

    } finally {
        if (client) client.close();
        if (edge && !edge.killed) {
            edge.kill();
        }
    }
}

runTest().catch(err => {
    console.error('TEST SUITE FAILED:', err);
    process.exit(1);
});
