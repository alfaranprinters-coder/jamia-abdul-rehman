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
        this.logs = [];
    }

    async connect() {
        this.ws = new WebSocket(this.wsUrl);
        await new Promise((resolve, reject) => {
            this.ws.onopen = resolve;
            this.ws.onerror = reject;
        });
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.method === 'Runtime.consoleAPICalled') {
                const args = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
                this.logs.push(`[CONSOLE ${data.params.type}] ${args}`);
            } else if (data.method === 'Runtime.exceptionThrown') {
                this.logs.push(`[EXCEPTION] ${data.params.exceptionDetails.text} ${JSON.stringify(data.params.exceptionDetails.exception)}`);
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

    close() {
        if (this.ws) this.ws.close();
    }
}

async function debugViews() {
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
        let targets = null;
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            try {
                targets = await getJson(`http://localhost:${port}/json`);
                if (targets && targets.length > 0) break;
            } catch (e) {}
        }

        const pageTarget = targets.find(t => t.type === 'page');
        client = new CdpClient(pageTarget.webSocketDebuggerUrl);
        await client.connect();
        await client.send('Runtime.enable');

        // Wait for app initialization
        let appReady = false;
        for (let i = 0; i < 20; i++) {
            await sleep(500);
            const ready = await client.evaluate('typeof window.app !== "undefined" && typeof window.app.handleLogin === "function"');
            if (ready) {
                appReady = true;
                break;
            }
        }
        if (!appReady) throw new Error('window.app not ready');
        console.log('App ready! Logging in with 123...');
        await client.evaluate(`
            document.getElementById('login-password-input').value = '123';
            window.app.handleLogin();
        `);
        await sleep(1000);

        const viewsToTest = [
            'staff_list', 
            'salary_management', 
            'fees',
            'dashboard',
            'students',
            'accounts',
            'attendance',
            'settings'
        ];

        for (const view of viewsToTest) {
            console.log(`\n=================== TESTING VIEW: ${view} ===================`);
            client.logs = [];

            // Directly call render or navigate
            const evalResult = await client.evaluate(`
                (async () => {
                    try {
                        window.app.navigate('${view}');
                        await new Promise(r => setTimeout(r, 600));
                        const content = document.getElementById('main-content');
                        return {
                            success: true,
                            htmlLength: content ? content.innerHTML.length : 0,
                            hasSpinner: content ? content.innerHTML.includes('mms-spinner') : false,
                            snippet: content ? content.innerText.substring(0, 300) : ''
                        };
                    } catch (e) {
                        return {
                            success: false,
                            error: e.message,
                            stack: e.stack
                        };
                    }
                })()
            `);

            console.log('Result:', JSON.stringify(evalResult, null, 2));
            if (client.logs.length > 0) {
                console.log('Captured Console/Exception Logs:');
                client.logs.forEach(l => console.log('  ', l));
            }
        }

    } finally {
        if (client) client.close();
        if (edge && !edge.killed) edge.kill();
    }
}

debugViews().catch(err => {
    console.error('Debug script failed:', err);
    process.exit(1);
});
