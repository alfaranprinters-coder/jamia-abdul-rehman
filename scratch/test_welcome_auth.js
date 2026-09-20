const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const url = 'file:///d:/Project/managment%20Softwares/madrsa%20abdul%20rehman%20bin%20auf/index.html';
const outFile = path.resolve(__dirname, 'welcome_dom_out.txt');

try {
    if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
    console.log('Running headless Edge to dump DOM of index.html...');
    execSync(`"${edge}" --headless --disable-gpu --dump-dom "${url}" > "${outFile}"`, { timeout: 15000 });
} catch (e) {
    console.log('Edge finished or timed out. Checking output file...');
}

if (fs.existsSync(outFile)) {
    const content = fs.readFileSync(outFile, 'utf8');
    console.log('DOM Output length:', content.length);

    const checks = [
        'id="welcome-login-screen"',
        'madrsa-title.png',
        'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
        'شعبہ بنین و بنات',
        'حفظ و درس نظامی',
        'بیت المال و فیس نظام',
        'بیک اپ و ڈیٹا تحفظ',
        'id="login-password-input"',
        'id="btn-login-submit"',
        '123',
        'محمد ادریس شاہین',
        'novatix-logo.jpg',
        'app.logout()',
        'app.toggleLoginPassVisibility()'
    ];

    let passed = 0;
    for (const check of checks) {
        if (content.includes(check)) {
            console.log('PASS: Found', check);
            passed++;
        } else {
            console.error('FAIL: Missing', check);
        }
    }
    console.log(`\nRESULTS: ${passed}/${checks.length} checks passed.`);
} else {
    console.error('Output file not found.');
}
