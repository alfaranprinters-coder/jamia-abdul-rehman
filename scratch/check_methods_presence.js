const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');

const methodsToCheck = [
    'toggleHifzTestSection',
    'calculateHifzTestScore',
    'updateDivisions',
    'updateDistricts',
    'updateTehsils',
    'calculatePercentage',
    'calculateAdmissionTotalFee',
    'updateMadrsaClasses'
];

const results = {};
methodsToCheck.forEach(m => {
    const idx = appJs.indexOf(m);
    // Find all occurrences
    let count = 0;
    let pos = 0;
    while ((pos = appJs.indexOf(m, pos)) !== -1) {
        count++;
        pos += m.length;
    }
    results[m] = { firstIndex: idx, count: count };
});

fs.writeFileSync('scratch/methods_check_result.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Results written to scratch/methods_check_result.json');
