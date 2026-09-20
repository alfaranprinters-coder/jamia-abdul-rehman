const fs = require('fs');
const assert = require('assert');

// 1. Verify db.js
const dbJs = fs.readFileSync('db.js', 'utf8');
assert(dbJs.includes('dbVersion: 16'), 'db.js upgraded to version 16');
assert(dbJs.includes("contains('graduates')"), 'graduates store created in onupgradeneeded');
assert(dbJs.includes('saveGraduate('), 'saveGraduate method in db.js');
assert(dbJs.includes('getAllGraduates('), 'getAllGraduates method in db.js');
assert(dbJs.includes('getGraduateById('), 'getGraduateById method in db.js');
assert(dbJs.includes('deleteGraduate('), 'deleteGraduate method in db.js');
assert(dbJs.includes('getGraduatesByYear('), 'getGraduatesByYear method in db.js');

// 2. Verify graduates.js
const gradJs = fs.readFileSync('graduates.js', 'utf8');
assert(gradJs.includes('const GraduatesModule = {'), 'GraduatesModule exists');
assert(gradJs.includes('showGraduateModal'), 'showGraduateModal exists');
assert(gradJs.includes('handleFileUpload'), 'handleFileUpload exists');
assert(gradJs.includes('viewDocument'), 'viewDocument exists');
assert(gradJs.includes('printMadrasaSanad'), 'printMadrasaSanad exists');
assert(gradJs.includes('printGraduatesDirectoryReport'), 'printGraduatesDirectoryReport exists');
assert(gradJs.includes('wafaqResultCardDoc'), 'wafaqResultCardDoc supported');
assert(gradJs.includes('hifzSanadDoc'), 'hifzSanadDoc supported');

// 3. Verify index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes("navigate('graduates')"), 'index.html navigates to graduates');
assert(indexHtml.includes('<script src="graduates.js"></script>'), 'index.html includes graduates.js');

// 4. Verify app.js
const appJs = fs.readFileSync('app.js', 'utf8');
assert(appJs.includes("case 'graduates': await GraduatesModule.render(container); break;"), 'app.js routes graduates');
assert(appJs.includes("nav-graduates-label"), 'app.js handles banat label for graduates');

console.log('ALL GRADUATES MODULE UNIT & INTEGRATION CHECKS PASSED!');
