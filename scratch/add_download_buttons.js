const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
const hifzPath = path.join(__dirname, '..', 'hifz.js');

let appContent = fs.readFileSync(appPath, 'utf8');
let hifzContent = fs.readFileSync(hifzPath, 'utf8');

const downloadScriptTag = `<script>
function downloadDoc(filename) {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    const htmlContent = '<!DOCTYPE html>\\n' + clone.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || 'دستاویز') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">`;

console.log("App JS loaded, size:", appContent.length);
console.log("Hifz JS loaded, size:", hifzContent.length);
