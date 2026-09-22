const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://localhost:8765');
    if (parsedUrl.pathname === '/log') {
        const body = parsedUrl.searchParams.get('msg');
        console.log('[BROWSER LOG]:', body);
        res.writeHead(200);
        res.end('ok');
        return;
    }
    if (parsedUrl.pathname === '/done') {
        const result = parsedUrl.searchParams.get('result');
        console.log('[TEST FINISHED]:', result);
        res.writeHead(200);
        res.end('ok');
        setTimeout(() => process.exit(0), 500);
        return;
    }

    let filePath = path.join(__dirname, '..', parsedUrl.pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(__dirname, 'test_client.html');
    }

    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200);
        res.end(content);
    } catch(e) {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(8765, () => {
    console.log('Server listening on http://localhost:8765');
    const edge = '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"';
    const tempDir = path.join(process.env.TEMP, 'edge_user_data_' + Date.now());
    const cmd = `${edge} --headless --disable-gpu --user-data-dir="${tempDir}" "http://localhost:8765/test_client.html"`;
    exec(cmd, (err) => {
        if (err) console.error('Edge exec err:', err);
    });
});
