const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const indexPath = path.resolve(__dirname, '../index.html');
const url = 'file:///' + indexPath.replace(/\\/g, '/');
const port = 9225;

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
        '--user-data-dir=' + path.resolve(__dirname, 'temp_edge_interactions'),
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

        console.log('--- Testing Action 1: Graduates showGraduateModal ---');
        await client.evaluate(`window.app.navigate('graduates');`);
        await sleep(600);
        let gradModalRes = await client.evaluate(`
            (() => {
                try {
                    GraduatesModule.showGraduateModal();
                    const m = document.getElementById('graduate-modal');
                    return { success: !!m, display: m ? m.style.display : 'none' };
                } catch(e) {
                    return { success: false, error: e.message, stack: e.stack };
                }
            })()
        `);
        console.log('Graduates showGraduateModal result:', gradModalRes);

        console.log('--- Testing Action 2: Hifz sub-views ---');
        await client.evaluate(`window.app.navigate('hifz');`);
        await sleep(600);
        const hifzViews = ['daily', 'bulk', 'progress', 'revision', 'exams', 'award_list', 'reports', 'halaqas', 'completions'];
        for (const hv of hifzViews) {
            client.logs = [];
            const hRes = await client.evaluate(`
                (async () => {
                    try {
                        await HifzModule.switchSubView('${hv}');
                        await new Promise(r => setTimeout(r, 400));
                        const content = document.getElementById('hifz-subview-container');
                        return {
                            success: true,
                            len: content ? content.innerHTML.length : 0,
                            hasSpinner: content ? content.innerHTML.includes('mms-spinner') : false
                        };
                    } catch(e) {
                        return { success: false, error: e.message, stack: e.stack };
                    }
                })()
            `);
            const hasErr = !hRes.success || hRes.hasSpinner || client.logs.some(l => l.includes('EXCEPTION'));
            console.log(`Hifz sub-view [${hv}]: ${hasErr ? 'FAIL' : 'PASS'}`, hRes);
            if (client.logs.length > 0) client.logs.forEach(l => console.log('  ', l));
        }

        console.log('--- Testing Action 3: Exams tabs ---');
        await client.evaluate(`window.app.navigate('exams');`);
        await sleep(600);
        const examTabs = ['list', 'datesheet', 'grading', 'marks'];
        for (const et of examTabs) {
            client.logs = [];
            const eRes = await client.evaluate(`
                (async () => {
                    try {
                        if (typeof window.app.switchExamTab === 'function') {
                            await window.app.switchExamTab('${et}');
                        }
                        await new Promise(r => setTimeout(r, 400));
                        return { success: true };
                    } catch(e) {
                        return { success: false, error: e.message };
                    }
                })()
            `);
            console.log(`Exam tab [${et}]:`, eRes);
            if (client.logs.length > 0) client.logs.forEach(l => console.log('  ', l));
        }

        console.log('--- Testing Action 4: Reports tabs ---');
        await client.evaluate(`window.app.navigate('reports');`);
        await sleep(600);
        const repRes = await client.evaluate(`
            (async () => {
                try {
                    const content = document.getElementById('main-content');
                    return {
                        success: true,
                        len: content ? content.innerHTML.length : 0,
                        snippet: content ? content.innerText.replace(/\\s+/g, ' ').substring(0, 100) : ''
                    };
                } catch(e) {
                    return { success: false, error: e.message };
                }
            })()
        `);
        console.log('Reports result:', repRes);

        console.log('--- Testing Action 5: Syllabus tabs / classes ---');
        await client.evaluate(`window.app.navigate('syllabus');`);
        await sleep(600);
        const sylRes = await client.evaluate(`
            (async () => {
                try {
                    const tabs = Array.from(document.querySelectorAll('.syllabus-class-tab, .syllabus-tab, [onclick*="switchSyllabus"]'));
                    return {
                        numTabs: tabs.length,
                        firstTabs: tabs.slice(0, 5).map(t => t.innerText.trim())
                    };
                } catch(e) {
                    return { error: e.message };
                }
            })()
        `);
        console.log('Syllabus tabs:', sylRes);

        console.log('--- Testing Action 6: Timetable interactions ---');
        await client.evaluate(`window.app.navigate('timetable');`);
        await sleep(600);
        const ttRes = await client.evaluate(`
            (async () => {
                try {
                    if (typeof TimetableModule !== 'undefined') {
                        return {
                            hasModule: true,
                            methods: Object.keys(TimetableModule)
                        };
                    }
                    return { hasModule: false };
                } catch(e) {
                    return { error: e.message };
                }
            })()
        `);
        console.log('TimetableModule:', ttRes);

        console.log('--- Testing Action 7: Receipt Upload in Settings ---');
        await client.evaluate(`window.app.navigate('settings');`);
        await sleep(600);
        const rcptUploadRes = await client.evaluate(`
            (async () => {
                try {
                    // Simulate uploading a 1x1 base64 png as a fake file
                    const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
                    const res = await fetch(base64Data);
                    const blob = await res.blob();
                    const file = new File([blob], 'test_receipt.png', { type: 'image/png' });
                    
                    // Create fake change event
                    const event = {
                        target: {
                            files: [file]
                        }
                    };
                    
                    // Call handleReceiptUpload
                    if (typeof window.app.handleReceiptUpload === 'function') {
                        // let's run it
                        window.app.handleReceiptUpload(event);
                        await new Promise(r => setTimeout(r, 1000));
                        return {
                            success: true,
                            hasCustomReceipt: window.app.hasReceiptTemplate(),
                            uriLen: window.app.getReceiptTemplateUri().length
                        };
                    }
                    return { success: false, reason: 'handleReceiptUpload function not found' };
                } catch(e) {
                    return { success: false, error: e.message, stack: e.stack };
                }
            })()
        `);
        console.log('Receipt upload simulation:', rcptUploadRes);

    } finally {
        if (client) client.close();
        if (edge && !edge.killed) edge.kill();
    }
}

run().catch(err => {
    console.error('Interactions test failed:', err);
    process.exit(1);
});
