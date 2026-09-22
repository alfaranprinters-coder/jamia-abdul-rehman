const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
    let filePath = path.join(path.resolve('.'), decodeURIComponent(req.url.split('?')[0]));
    if (filePath.endsWith(path.sep) || req.url === '/') filePath = path.join(path.resolve('.'), 'index.html');
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        const stream = fs.createReadStream(filePath);
        stream.on('error', () => { res.writeHead(404); res.end(); });
        stream.pipe(res);
    });
});

server.listen(9002, async () => {
    const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--remote-debugging-port=9224', '--headless=new', '--disable-gpu', '--no-first-run',
        '--user-data-dir=' + path.join(path.resolve('.'), 'scratch', 'chrome_prof_hifz2'),
        'http://localhost:9002/index.html'
    ]);
    await new Promise(r => setTimeout(r, 2000));
    const resp = await fetch('http://127.0.0.1:9224/json');
    const targets = await resp.json();
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    
    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.method === 'Runtime.consoleAPICalled') {
            console.log('[BROWSER CONSOLE]', m.params.type, m.params.args.map(a => a.value || a.description).join(' '));
        }
        if (m.method === 'Runtime.exceptionThrown') {
            console.log('[BROWSER EXCEPTION]', m.params.exceptionDetails);
        }
        if (m.id && callbacks.has(m.id)) {
            callbacks.get(m.id)(m.result);
            callbacks.delete(m.id);
        }
    };

    function evalJs(expr) {
        return new Promise(res => {
            const currentId = id++;
            callbacks.set(currentId, (result) => res(result ? result.result.value : undefined));
            ws.send(JSON.stringify({ id: currentId, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }));
        });
    }

    await evalJs('Runtime.enable');
    await new Promise(r => setTimeout(r, 2000));
    await evalJs('window.enterSoftwareDirectly()');
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('Navigating to hifz...');
    await evalJs("window.app.navigate('hifz')");
    await new Promise(r => setTimeout(r, 2000));

    const check = await evalJs(`({
        currentView: window.app.currentView,
        mainHtmlLength: document.getElementById('main-content').innerHTML.length,
        hasSpinner: !!document.querySelector('#main-content .mms-spinner'),
        hasErrorCard: !!document.querySelector('#main-content .fa-circle-exclamation, #main-content .fa-triangle-exclamation'),
        errorCardHtml: document.querySelector('#main-content .fa-circle-exclamation, #main-content .fa-triangle-exclamation')?.closest('div')?.outerHTML,
        innerHtmlPreview: document.getElementById('main-content').innerHTML.substring(0, 500)
    })`);
    console.log('Hifz check result:', JSON.stringify(check, null, 2));

    chrome.kill();
    server.close();
    process.exit(0);
});
