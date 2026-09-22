const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

const target = `    updateNavActiveState() {
        document.querySelectorAll('.nav-link').forEach(link => {
            const dataView = link.getAttribute('data-view');
            const onclick = link.getAttribute('onclick') || '';
            const match = onclick.match(/(?:navigate|_nav)\\(['"]([^'"]+)['"]\\)/);
            const view = dataView || (match ? match[1] : null);
            
            const isActive = view === this.currentView;
            link.classList.toggle('active', isActive);
            
            if (isActive) {
                const title = document.getElementById('mms-view-title');
                const span = link.querySelector('span');
                if (title && span) title.innerText = span.innerText;
            }
        });
    }`;

const replacement = `    updateNavActiveState() {
        let matchedAny = false;
        document.querySelectorAll('.nav-link').forEach(link => {
            const dataView = link.getAttribute('data-view');
            const onclick = link.getAttribute('onclick') || '';
            const match = onclick.match(/(?:navigate|_nav)\\(['"]([^'"]+)['"]\\)/);
            const view = dataView || (match ? match[1] : null);
            
            const isActive = (view === this.currentView) || (view === 'staff_list' && (this.currentView === 'staff_form' || this.currentView === 'teacherForm'));
            link.classList.toggle('active', isActive);
            
            if (isActive && !matchedAny) {
                const title = document.getElementById('mms-view-title');
                if (title) {
                    if (this.currentView === 'staff_form' || this.currentView === 'teacherForm') {
                        title.innerText = 'نیا اندراجِ عملہ و ملازمین';
                    } else {
                        const span = link.querySelector('span');
                        if (span) title.innerText = span.innerText;
                    }
                }
                matchedAny = true;
            }
        });
    }`;

const isCRLF = content.includes('\r\n');
const normContent = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');
const normReplacement = replacement.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
    let result = normContent.replace(normTarget, normReplacement);
    if (isCRLF) result = result.replace(/\n/g, '\r\n');
    fs.writeFileSync('app.js', result, 'utf8');
    console.log('Successfully updated updateNavActiveState in app.js!');
} else {
    console.error('Target not found in app.js!');
    process.exit(1);
}
