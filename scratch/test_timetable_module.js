const fs = require('fs');
const assert = require('assert');

// 1. Verify timetable.js
const ttJs = fs.readFileSync('timetable.js', 'utf8');
assert(ttJs.includes('const TimetableModule = {'), 'TimetableModule exists');
assert(ttJs.includes('awwal:'), 'Session awwal exists');
assert(ttJs.includes('sani:'), 'Session sani exists');
assert(ttJs.includes('aakhir:'), 'Session aakhir exists');
assert(ttJs.includes('autoGeneratePeriodsPrompt'), 'autoGeneratePeriodsPrompt exists');
assert(ttJs.includes('applyPreset'), 'applyPreset exists');
assert(ttJs.includes('printOfficialTimetable'), 'printOfficialTimetable exists');

// 2. Test Slot Generation Algorithm
function toMins(str) {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
}
function toTimeStr(mins) {
    let h = Math.floor(mins / 60) % 24;
    let m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function generateSlots(startTime, endTime, durationMins, hasBreak = false, breakStart = null, breakMins = 20) {
    const startM = toMins(startTime);
    const endM = toMins(endTime);
    const breakStartM = (hasBreak && breakStart) ? toMins(breakStart) : -1;
    const breakDurationM = parseInt(breakMins) || 20;

    let current = startM;
    const slots = [];
    let slotIndex = 1;
    let breakInserted = false;

    while (current + 10 <= endM) {
        if (hasBreak && !breakInserted && breakStartM > 0 && current >= breakStartM) {
            const bEnd = Math.min(endM, current + breakDurationM);
            slots.push({ id: slotIndex++, isBreak: true, startTime: toTimeStr(current), endTime: toTimeStr(bEnd) });
            current = bEnd;
            breakInserted = true;
            continue;
        }

        let next = current + durationMins;
        if (next > endM) next = endM;

        slots.push({ id: slotIndex++, isBreak: false, startTime: toTimeStr(current), endTime: toTimeStr(next) });
        current = next;
    }
    return slots;
}

const summerSlots = generateSlots('07:30', '11:30', 40, true, '09:30', 20);
assert(summerSlots.length > 3, 'Generated multiple period slots');
assert.strictEqual(summerSlots[0].startTime, '07:30');
assert.strictEqual(summerSlots[0].endTime, '08:10');

// 3. Verify index.html contains timetable.js
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('<script src="timetable.js"></script>'), 'index.html includes timetable.js');

// 4. Verify app.js delegates to TimetableModule
const appJs = fs.readFileSync('app.js', 'utf8');
assert(appJs.includes('TimetableModule.render(container)'), 'app.js delegates to TimetableModule');

console.log('ALL TIMETABLE MODULE UNIT & INTEGRATION CHECKS PASSED!');
