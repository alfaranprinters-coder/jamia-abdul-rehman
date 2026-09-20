// Test script for TimetableModule integration and 3 Shifts rendering
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Setup mock DOM & Browser globals
const storage = {};
const mockLocalStorage = {
    getItem: (k) => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const mainContent = {
    id: 'main-content',
    innerHTML: '',
    children: [],
    appendChild: function(c) { this.children.push(c); }
};

const mockDocument = {
    getElementById: (id) => (id === 'main-content' ? mainContent : null),
    createElement: (tag) => ({ tag, innerHTML: '', style: {} }),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {}
};

const sandbox = {
    window: {},
    document: mockDocument,
    localStorage: mockLocalStorage,
    console: console,
    alert: (msg) => console.log('ALERT:', msg),
    confirm: () => true,
    prompt: () => '40',
    setTimeout: (fn) => fn(),
    setInterval: () => 1,
    clearInterval: () => {},
    addEventListener: () => {},
    Date: Date,
    Map: Map,
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat,
    String: String,
    Array: Array,
    Object: Object
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};

// Read files
const dir = 'd:/Project/managment Softwares/madrsa abdul rehman bin auf';
const dbCode = fs.readFileSync(path.join(dir, 'db.js'), 'utf8');
const ttCode = fs.readFileSync(path.join(dir, 'timetable.js'), 'utf8');
const appCode = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

vm.createContext(sandbox);

// 1. Run db.js
vm.runInContext(dbCode, sandbox);
console.log('1. db.js loaded. window.MadrassahDB exists:', typeof sandbox.window.MadrassahDB !== 'undefined');

// 2. Run timetable.js
vm.runInContext(ttCode, sandbox);
console.log('2. timetable.js loaded. window.TimetableModule exists:', typeof sandbox.window.TimetableModule !== 'undefined');

if (!sandbox.window.TimetableModule) {
    throw new Error('FAILED: window.TimetableModule is not defined!');
}

// 3. Test TimetableModule.render
(async () => {
    try {
        const container = { innerHTML: '' };
        await sandbox.window.TimetableModule.render(container);
        console.log('3. TimetableModule.render completed. Output HTML length:', container.innerHTML.length);

        // Check for 3 shifts in HTML
        const hasAwwal = container.innerHTML.includes('وقتِ اول');
        const hasSani = container.innerHTML.includes('وقتِ ثانی');
        const hasAakhir = container.innerHTML.includes('وقتِ آخر');
        console.log('   - Has وقتِ اول:', hasAwwal);
        console.log('   - Has وقتِ ثانی:', hasSani);
        console.log('   - Has وقتِ آخر:', hasAakhir);

        if (!hasAwwal || !hasSani || !hasAakhir) {
            throw new Error('FAILED: 3 Shifts are missing from rendered HTML!');
        }

        // Test presets
        console.log('4. Testing Presets:');
        sandbox.window.TimetableModule.applyPreset('winter');
        const winterSched = await sandbox.window.TimetableModule.getSchedule();
        console.log('   - Winter Awwal start:', winterSched.awwal.startTime, 'end:', winterSched.awwal.endTime);

        sandbox.window.TimetableModule.applyPreset('summer');
        const summerSched = await sandbox.window.TimetableModule.getSchedule();
        console.log('   - Summer Awwal start:', summerSched.awwal.startTime, 'end:', summerSched.awwal.endTime);

        // Test Auto-generation
        console.log('5. Testing Auto Generation:');
        await sandbox.window.TimetableModule.autoGeneratePeriodsPrompt('awwal');
        const autoSched = await sandbox.window.TimetableModule.getSchedule();
        console.log('   - Auto-generated periods count for awwal:', autoSched.awwal.periods.length);

        // 6. Test App navigation to timetable
        console.log('6. Testing App routing to timetable...');
        vm.runInContext(appCode, sandbox);
        console.log('   - app.js loaded. window.app exists:', typeof sandbox.window.app !== 'undefined');
        
        const appContainer = { innerHTML: '' };
        await sandbox.window.app.renderTimetableModule(appContainer);
        console.log('   - app.renderTimetableModule output length:', appContainer.innerHTML.length);
        const appHasAwwal = appContainer.innerHTML.includes('وقتِ اول');
        console.log('   - app rendered Has وقتِ اول:', appHasAwwal);

        if (!appHasAwwal) {
            throw new Error('FAILED: app.renderTimetableModule did not render timetable!');
        }

        console.log('\n>>> ALL TIMETABLE INTEGRATION TESTS PASSED SUCCESSFULLY! <<<');
    } catch (err) {
        console.error('Test Execution Error:', err);
        process.exit(1);
    }
})();
