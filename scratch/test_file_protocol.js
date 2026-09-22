const path = require('path');
const { spawn } = require('child_process');

async function testFileProtocol() {
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const remotePort = 9226;
    const userDataDir = path.join(path.resolve('.'), 'scratch', 'chrome_prof_file');

    const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    console.log('Testing file URL:', fileUrl);

    const chrome = spawn(chromePath, [
        `--remote-debugging-port=${remotePort}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        fileUrl
    ]);

    await new Promise(r => setTimeout(r, 2500));

    let wsUrl = '';
    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            const resp = await fetch(`http://127.0.0.1:${remotePort}/json`);
            const targets = await resp.json();
            const pageTarget = targets.find(t => t.type === 'page');
            if (pageTarget && pageTarget.webSocketDebuggerUrl) {
                wsUrl = pageTarget.webSocketDebuggerUrl;
                break;
            }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 500));
    }

    if (!wsUrl) {
        console.error('Could not connect to Chrome debugging endpoint!');
        chrome.kill();
        process.exit(1);
    }

    const ws = new WebSocket(wsUrl);
    let messageId = 1;
    const callbacks = new Map();
    const jsErrors = [];

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            jsErrors.push(msg.params.args.map(a => a.value || a.description || '').join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
            jsErrors.push(msg.params.exceptionDetails.text);
        }
        if (msg.id && callbacks.has(msg.id)) {
            callbacks.get(msg.id)(msg.result);
            callbacks.delete(msg.id);
        }
    };

    function sendCmd(method, params = {}) {
        return new Promise((resolve) => {
            const id = messageId++;
            callbacks.set(id, (res) => resolve(res));
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await new Promise(r => ws.onopen = r);
    await sendCmd('Runtime.enable');
    await sendCmd('Page.enable');
    await new Promise(r => setTimeout(r, 2000));

    async function evaluate(expr) {
        const res = await sendCmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        return res ? res.result?.value : undefined;
    }

    const state = await evaluate(`({
        hasApp: !!window.app,
        constructorName: window.app ? window.app.constructor.name : null,
        currentView: window.app ? window.app.currentView : null,
        dbReady: typeof MadrassahDB !== 'undefined' && !!MadrassahDB.db
    })`);
    console.log('file:// State:', JSON.stringify(state, null, 2));

    await evaluate(`window.enterSoftwareDirectly()`);
    await new Promise(r => setTimeout(r, 1000));

    await evaluate(`window.app.navigate('students')`);
    await new Promise(r => setTimeout(r, 1000));
    const studentsCheck = await evaluate(`({
        currentView: window.app.currentView,
        title: document.getElementById('mms-view-title')?.innerText
    })`);
    console.log('file:// Students View check:', JSON.stringify(studentsCheck));

    await evaluate(`window.app.navigate('fees')`);
    await new Promise(r => setTimeout(r, 1000));
    const feesCheck = await evaluate(`({
        currentView: window.app.currentView,
        title: document.getElementById('mms-view-title')?.innerText
    })`);
    console.log('file:// Fees View check:', JSON.stringify(feesCheck));

    console.log(`file:// JS Errors: ${jsErrors.length}`);
    if (jsErrors.length > 0) console.log('file:// Errors:', jsErrors);
    console.log('file:// Protocol Test Passed: ' + (jsErrors.length === 0 && feesCheck.currentView === 'fees' ? 'YES ✓' : 'NO ✗'));

    chrome.kill();
    process.exit(0);
}

testFileProtocol().catch(e => {
    console.error('File protocol test error:', e);
    process.exit(1);
});
