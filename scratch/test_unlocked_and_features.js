const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const indexPath = path.resolve(__dirname, '../index.html');
const url = 'file:///' + indexPath.replace(/\\/g, '/');
const port = 9224;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

class CdpClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.msgId = 1;
        this.pending = new Map();
        this.logs = [];
    }

    async connect() {
        this.ws = new WebSocket(this.wsUrl);
        await new Promise((res, rej) => {
            this.ws.onopen = res;
            this.ws.onerror = rej;
        });
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.method === 'Runtime.consoleAPICalled') {
                const args = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
                this.logs.push(`[CONSOLE ${data.params.type}] ${args}`);
            } else if (data.method === 'Runtime.exceptionThrown') {
                const details = data.params.exceptionDetails;
                const desc = details.exception ? (details.exception.description || details.exception.value) : details.text;
                this.logs.push(`[EXCEPTION] ${details.text} - ${desc}`);
            }
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

    close() { if (this.ws) this.ws.close(); }
}

async function run() {
    const edge = spawn(edgePath, [
        '--headless',
        `--remote-debugging-port=${port}`,
        '--allow-file-access-from-files',
        '--disable-gpu',
        '--user-data-dir=' + path.resolve(__dirname, 'temp_edge_unlocked'),
        url
    ], { stdio: 'ignore' });

    let client = null;
    try {
        let targets = null;
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            try {
                targets = await getJson(`http://localhost:${port}/json`);
                if (targets && targets.length > 0) break;
            } catch(e) {}
        }

        const pageTarget = targets.find(t => t.type === 'page');
        client = new CdpClient(pageTarget.webSocketDebuggerUrl);
        await client.connect();
        await client.send('Runtime.enable');

        await sleep(1000);
        console.log('Logging into app...');
        await client.evaluate(`
            const input = document.getElementById('login-password-input');
            if (input) {
                input.value = '123';
                window.app.handleLogin();
            } else {
                window.enterSoftwareDirectly('123');
            }
        `);
        await sleep(1000);

        console.log('Unlocking finance...');
        await client.evaluate(`
            window.app.isFinanceUnlocked = true;
            sessionStorage.setItem('mms_finance_unlocked', 'true');
        `);

        const lockedViews = ['salary_management', 'accounts', 'donors'];
        for (const v of lockedViews) {
            client.logs = [];
            const res = await client.evaluate(`
                (async () => {
                    try {
                        window.app.navigate('${v}');
                        await new Promise(r => setTimeout(r, 600));
                        const content = document.getElementById('main-content');
                        return {
                            success: true,
                            len: content ? content.innerHTML.length : 0,
                            hasSpinner: content ? content.innerHTML.includes('mms-spinner') : false,
                            isStillLocked: content ? content.innerText.includes('برائے مہربانی پاسورڈ درج کیجیے') : false,
                            snippet: content ? content.innerText.replace(/\\s+/g, ' ').substring(0, 100) : ''
                        };
                    } catch(e) {
                        return { success: false, error: e.message, stack: e.stack };
                    }
                })()
            `);
            console.log(`View ${v}:`, res);
            if (client.logs.length > 0) client.logs.forEach(l => console.log('  ', l));
        }

        console.log('\n--- Testing other views and sub-actions ---');
        // Let's test exams tabs
        console.log('Testing exams module tabs...');
        await client.evaluate(`window.app.navigate('exams');`);
        await sleep(600);
        const examSubTest = await client.evaluate(`
            (async () => {
                const results = [];
                // Check if any tab buttons exist in exams
                const buttons = Array.from(document.querySelectorAll('#main-content button, #main-content .tab, #main-content [onclick]'));
                return {
                    numButtons: buttons.length,
                    buttonTexts: buttons.slice(0, 10).map(b => b.innerText.trim()).filter(Boolean)
                };
            })()
        `);
        console.log('Exams buttons:', examSubTest);

        // Let's test timetable tabs
        console.log('Testing timetable module tabs...');
        await client.evaluate(`window.app.navigate('timetable');`);
        await sleep(600);
        const ttSubTest = await client.evaluate(`
            (async () => {
                const buttons = Array.from(document.querySelectorAll('#main-content button, #main-content .tab, #main-content [onclick]'));
                return {
                    numButtons: buttons.length,
                    buttonTexts: buttons.slice(0, 10).map(b => b.innerText.trim()).filter(Boolean)
                };
            })()
        `);
        console.log('Timetable buttons:', ttSubTest);

        // Let's test graduates tabs/actions
        console.log('Testing graduates module...');
        await client.evaluate(`window.app.navigate('graduates');`);
        await sleep(600);
        const gradSubTest = await client.evaluate(`
            (async () => {
                // Try open modal or form
                if (typeof GraduatesModule !== 'undefined') {
                    return {
                        hasModule: true,
                        methods: Object.keys(GraduatesModule)
                    };
                }
                return { hasModule: false };
            })()
        `);
        console.log('Graduates module:', gradSubTest);

        // Let's test hifz tabs/actions
        console.log('Testing hifz module...');
        await client.evaluate(`window.app.navigate('hifz');`);
        await sleep(600);
        const hifzSubTest = await client.evaluate(`
            (async () => {
                if (typeof HifzModule !== 'undefined') {
                    return {
                        hasModule: true,
                        methods: Object.keys(HifzModule)
                    };
                }
                return { hasModule: false };
            })()
        `);
        console.log('Hifz module:', hifzSubTest);

    } finally {
        if (client) client.close();
        if (edge && !edge.killed) edge.kill();
    }
}

run().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
