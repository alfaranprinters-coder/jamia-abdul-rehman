const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// Replace `,` after method bodies with empty/no comma in the added methods
const methods = [
    '    async renderAccountsModule(container) {',
    '    updateAccountsFilter(field, value) {',
    '    clearAccountsFilters() {',
    '    showTransactionModal(type, existingData = null) {',
    '    showTransactionForm(type, existingData = null) {',
    '    async editTransaction(id) {',
    '    async handleTransactionSubmit(e) {',
    '    showAccountsInstantReceiptModal(id, data) {',
    '    async shareAccountsReceiptWhatsApp(id) {',
    '    async printAccountsLedger() {',
    '    async printDonationReceipt(id) {'
];

// Let's replace closing braces of these methods
appJs = appJs.replace(/\n    \},\n\n    updateAccountsFilter/g, '\n    }\n\n    updateAccountsFilter');
appJs = appJs.replace(/\n    \},\n\n    clearAccountsFilters/g, '\n    }\n\n    clearAccountsFilters');
appJs = appJs.replace(/\n    \},\n\n    \/\/ --- Modern Professional/g, '\n    }\n\n    // --- Modern Professional');
appJs = appJs.replace(/\n    \},\n\n    \/\/ Backward compatibility/g, '\n    }\n\n    // Backward compatibility');
appJs = appJs.replace(/\n    \},\n\n    async editTransaction/g, '\n    }\n\n    async editTransaction');
appJs = appJs.replace(/\n    \},\n\n    async handleTransactionSubmit/g, '\n    }\n\n    async handleTransactionSubmit');
appJs = appJs.replace(/\n    \},\n\n    \/\/ Instant Receipt Modal/g, '\n    }\n\n    // Instant Receipt Modal');
appJs = appJs.replace(/\n    \},\n\n    async shareAccountsReceiptWhatsApp/g, '\n    }\n\n    async shareAccountsReceiptWhatsApp');
appJs = appJs.replace(/\n    \},\n\n    \/\/ Print Formal Financial Ledger/g, '\n    }\n\n    // Print Formal Financial Ledger');
appJs = appJs.replace(/\n    \},\n\n    async printDonationReceipt/g, '\n    }\n\n    async printDonationReceipt');
appJs = appJs.replace(/\n    \},\n\n    printAdmissionReceipt/g, '\n    }\n\n    printAdmissionReceipt');

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Fixed method trailing commas in app.js.');
