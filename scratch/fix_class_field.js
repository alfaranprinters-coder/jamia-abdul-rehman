const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

appJs = appJs.replace(
`    accountsFilter = {
        search: '',
        type: 'all',
        category: 'all',
        period: 'all'
    },`,
`    accountsFilter = {
        search: '',
        type: 'all',
        category: 'all',
        period: 'all'
    };`
);

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Fixed class field semicolon syntax.');
