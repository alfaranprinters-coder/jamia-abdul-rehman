const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const rootDir = path.resolve('.');
const server = http.createServer((req, res) => {
    let filePath = path.join(rootDir, decodeURIComponent(req.url.split('?')[0]));
    if (filePath.endsWith(path.sep) || req.url === '/') {
        filePath = path.join(rootDir, 'index.html');
    }
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.on('error', () => { res.writeHead(404); res.end(); });
        stream.pipe(res);
    });
});

async function runTests() {
    const port = 9090;
    await new Promise(resolve => server.listen(port, resolve));
    console.log(`Local test server running on http://localhost:${port}`);

    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const remotePort = 9225;
    const userDataDir = path.join(rootDir, 'scratch', 'chrome_profile_full');

    // Remove old test profile if exists
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

    const chrome = spawn(chromePath, [
        `--remote-debugging-port=${remotePort}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        `http://localhost:${port}/index.html`
    ]);

    await new Promise(r => setTimeout(r, 2000));

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
        server.close();
        process.exit(1);
    }

    console.log('Connected to Chrome DevTools Protocol at:', wsUrl);
    const ws = new WebSocket(wsUrl);

    let messageId = 1;
    const pendingCallbacks = new Map();
    const consoleLogs = [];
    const jsErrors = [];

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
            const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
            consoleLogs.push(`[CONSOLE ${msg.params.type.toUpperCase()}] ${text}`);
            if (msg.params.type === 'error') {
                jsErrors.push(text);
            }
        }
        if (msg.method === 'Runtime.exceptionThrown') {
            const exc = msg.params.exceptionDetails;
            const errStr = `${exc.text} ${exc.exception ? (exc.exception.description || exc.exception.value) : ''}`;
            consoleLogs.push(`[EXCEPTION] ${errStr}`);
            jsErrors.push(errStr);
        }
        if (msg.id && pendingCallbacks.has(msg.id)) {
            pendingCallbacks.get(msg.id)(msg.result, msg.error);
            pendingCallbacks.delete(msg.id);
        }
    };

    function sendCmd(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = messageId++;
            pendingCallbacks.set(id, (res, err) => {
                if (err) reject(err);
                else resolve(res);
            });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await new Promise(resolve => ws.onopen = resolve);
    await sendCmd('Runtime.enable');
    await sendCmd('Page.enable');

    console.log('Waiting 3000ms for app initialization...');
    await new Promise(r => setTimeout(r, 3000));

    async function evaluate(expr) {
        const res = await sendCmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (res.exceptionDetails) {
            throw new Error(res.exceptionDetails.text + ': ' + (res.exceptionDetails.exception?.description || ''));
        }
        return res.result ? res.result.value : undefined;
    }

    // TEST 1: App Instance Verification
    console.log('\n========================================');
    console.log('TEST 1: Application Instance & Startup Lifecycle');
    console.log('========================================');
    const appState = await evaluate(`({
        hasApp: !!window.app,
        constructorName: window.app ? window.app.constructor.name : null,
        currentView: window.app ? window.app.currentView : null,
        currentSection: window.app ? window.app.currentSection : null,
        isAuthenticated: window.app ? window.app.isAuthenticated : null,
        hasMadrassahDB: typeof MadrassahDB !== 'undefined',
        dbReady: typeof MadrassahDB !== 'undefined' && !!MadrassahDB.db,
        welcomeScreenDisplay: document.getElementById('welcome-login-screen')?.style.display,
        appScreenDisplay: document.getElementById('app')?.style.display
    })`);
    console.log('Startup State:', JSON.stringify(appState, null, 2));

    // TEST 2: Authentication (Login with password '123')
    console.log('\n========================================');
    console.log('TEST 2: Authentication / Login Flow');
    console.log('========================================');
    await evaluate(`
        (function() {
            const passInput = document.getElementById('login-password-input');
            if (passInput) passInput.value = '123';
            if (window.app && typeof window.app.handleLogin === 'function') {
                window.app.handleLogin();
            }
        })()
    `);
    await new Promise(r => setTimeout(r, 1200));

    const loginCheck = await evaluate(`({
        isAuthenticated: window.app.isAuthenticated,
        appDisplay: document.getElementById('app').style.display,
        welcomeDisplay: document.getElementById('welcome-login-screen').style.display,
        currentView: window.app.currentView
    })`);
    console.log('State After Login with "123":', JSON.stringify(loginCheck, null, 2));

    // TEST 3: Test Every Sidebar Menu Item
    console.log('\n========================================');
    console.log('TEST 3: Testing Every Single Menu Item (1-by-1)');
    console.log('========================================');
    const viewsToTest = [
        { id: 'dashboard', label: 'ڈیش بورڈ' },
        { id: 'admission', label: 'نیا داخلہ' },
        { id: 'students', label: 'طلباء کی فہرست' },
        { id: 'graduates', label: 'فارغ التحصیل طلباء' },
        { id: 'staff_list', label: 'عملہ کی فہرست' },
        { id: 'salary_management', label: 'تنخواہوں کا نظام' },
        { id: 'syllabus', label: 'نصابِ تعلیم' },
        { id: 'timetable', label: 'جدول الاوقات' },
        { id: 'attendance', label: 'حاضری ریکارڈ' },
        { id: 'hifz', label: 'حفظ القرآن' },
        { id: 'fees', label: 'فیس وصولی' },
        { id: 'accounts', label: 'بیت المال' },
        { id: 'donors', label: 'مستقل ڈونرز' },
        { id: 'exams', label: 'امتحانات' },
        { id: 'reports', label: 'رپورٹس' },
        { id: 'settings', label: 'ترتیبات' },
        { id: 'staff_form', label: 'نیا عملہ اندراج' }
    ];

    let allViewsPassed = true;
    for (const v of viewsToTest) {
        const preErrorsCount = jsErrors.length;
        await evaluate(`window.app.navigate('${v.id}')`);
        await new Promise(r => setTimeout(r, 800));

        const viewCheck = await evaluate(`({
            currentView: window.app.currentView,
            titleText: document.getElementById('mms-view-title')?.innerText,
            activeLinkView: document.querySelector('.nav-link.active')?.getAttribute('data-view'),
            mainContentLength: (document.getElementById('main-content')?.innerHTML || '').length,
            hasSpinner: !!document.querySelector('#main-content .mms-spinner'),
            hasErrorCard: !!document.querySelector('#main-content h4')?.innerText?.includes('دشواری')
        })`);

        const hasNewErrors = jsErrors.length > preErrorsCount;
        const passed = (viewCheck.currentView === v.id) &&
                       viewCheck.mainContentLength > 100 &&
                       !viewCheck.hasSpinner &&
                       !viewCheck.hasErrorCard &&
                       !hasNewErrors;

        if (!passed) allViewsPassed = false;

        console.log(`[MENU TEST] '${v.id}' (${v.label}): ${passed ? 'PASSED ✓' : 'FAILED ✗'} | Topbar Title: "${viewCheck.titleText}" | Content Length: ${viewCheck.mainContentLength} bytes`);
    }

    // TEST 4: Dashboard Quick Links
    console.log('\n========================================');
    console.log('TEST 4: Dashboard Quick Links');
    console.log('========================================');
    await evaluate(`window.app.navigate('dashboard')`);
    await new Promise(r => setTimeout(r, 600));

    const quickLinks = ['admission', 'staff_form', 'timetable', 'syllabus'];
    let allQuickPassed = true;
    for (const q of quickLinks) {
        await evaluate(`window.app.navigate('${q}')`);
        await new Promise(r => setTimeout(r, 600));
        const qCheck = await evaluate(`window.app.currentView`);
        const passed = (qCheck === q);
        if (!passed) allQuickPassed = false;
        console.log(`[QUICK LINK] '${q}': ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    }

    // TEST 5: Section Switching (Banin / Banat)
    console.log('\n========================================');
    console.log('TEST 5: Section Switching (بنین ⮂ بنات)');
    console.log('========================================');
    await evaluate(`window.app.switchSection('banat')`);
    await new Promise(r => setTimeout(r, 600));
    const banatCheck = await evaluate(`({
        section: window.app.currentSection,
        badgeText: document.getElementById('mms-section-badge')?.innerText,
        studentsLabel: document.getElementById('nav-students-label')?.innerText,
        activeTab: document.querySelector('.section-tabs .tab.active')?.getAttribute('data-section')
    })`);
    console.log('Banat Switch Results:', JSON.stringify(banatCheck, null, 2));

    await evaluate(`window.app.switchSection('banin')`);
    await new Promise(r => setTimeout(r, 600));
    const baninCheck = await evaluate(`({
        section: window.app.currentSection,
        badgeText: document.getElementById('mms-section-badge')?.innerText,
        studentsLabel: document.getElementById('nav-students-label')?.innerText,
        activeTab: document.querySelector('.section-tabs .tab.active')?.getAttribute('data-section')
    })`);
    console.log('Banin Switch Results:', JSON.stringify(baninCheck, null, 2));

    // TEST 6: Mobile Sidebar Toggle
    console.log('\n========================================');
    console.log('TEST 6: Mobile Sidebar Open / Close');
    console.log('========================================');
    await evaluate(`window.app.toggleSidebar(true)`);
    const sbOpen = await evaluate(`({
        sidebarOpen: document.getElementById('mms-sidebar').classList.contains('open'),
        overlayActive: document.getElementById('mms-sidebar-overlay').classList.contains('active')
    })`);
    console.log('Sidebar Open state:', JSON.stringify(sbOpen));

    await evaluate(`window.app.toggleSidebar(false)`);
    const sbClosed = await evaluate(`({
        sidebarOpen: document.getElementById('mms-sidebar').classList.contains('open'),
        overlayActive: document.getElementById('mms-sidebar-overlay').classList.contains('active')
    })`);
    console.log('Sidebar Closed state:', JSON.stringify(sbClosed));

    // TEST 7: Console Errors Audit
    console.log('\n========================================');
    console.log('TEST 7: Browser Console & Exceptions Audit');
    console.log('========================================');
    console.log(`Total JS Errors: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
        console.log('Error list:', jsErrors);
    } else {
        console.log('ZERO JavaScript Errors / Exceptions detected during all tests! ✓');
    }

    console.log('\n========================================');
    console.log('OVERALL TEST SUITE SUMMARY:');
    console.log(`All Views Passed: ${allViewsPassed ? 'YES ✓' : 'NO ✗'}`);
    console.log(`All Quick Links Passed: ${allQuickPassed ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Section Switch Passed: ${(banatCheck.section === 'banat' && baninCheck.section === 'banin') ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Zero Console Errors: ${jsErrors.length === 0 ? 'YES ✓' : 'NO ✗'}`);
    console.log('========================================\n');

    chrome.kill();
    server.close();
    process.exit(0);
}

runTests().catch(err => {
    console.error('Test Runner Error:', err);
    process.exit(1);
});
