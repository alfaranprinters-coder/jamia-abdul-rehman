const fs = require('fs');

console.log('--- Testing Bait-ul-Maal Redesign Integration ---');

const appJs = fs.readFileSync('app.js', 'utf8');

let pass = true;
function check(title, condition) {
    if (condition) {
        console.log('✔ PASS:', title);
    } else {
        console.error('✖ FAIL:', title);
        pass = false;
    }
}

check('showTransactionModal is defined', appJs.includes('showTransactionModal(type, existingData = null)'));
check('showTransactionForm alias is defined', appJs.includes('showTransactionForm(type, existingData = null)'));
check('renderAccountsModule is defined', appJs.includes('async renderAccountsModule(container)'));
check('updateAccountsFilter is defined', appJs.includes('updateAccountsFilter(field, value)'));
check('clearAccountsFilters is defined', appJs.includes('clearAccountsFilters()'));
check('showAccountsInstantReceiptModal is defined', appJs.includes('showAccountsInstantReceiptModal(id, data)'));
check('shareAccountsReceiptWhatsApp is defined', appJs.includes('shareAccountsReceiptWhatsApp(id)'));
check('printAccountsLedger is defined', appJs.includes('printAccountsLedger()'));

// Check for live Urdu words conversion in modal
check('Live Urdu words converter element exists in modal', appJs.includes('modal_amount_words'));
check('Quick category chips exist in modal', appJs.includes('فوری کیٹیگری / مد منتخب فرمائیں'));
check('Backdrop blur styling in modal', appJs.includes('backdrop-filter:blur(6px)'));

// Check for KPI cards in accounts module
check('Income KPI card exists', appJs.includes('کل آمدن و عطیات'));
check('Expense KPI card exists', appJs.includes('کل اخراجات و ادائیگیاں'));
check('Net Cash Balance KPI card exists', appJs.includes('خالص بیلنس (کیش ان ہینڈ)'));
check('Total Transactions KPI card exists', appJs.includes('مجموعی لین دین'));

// Check for filters bar
check('Search input exists', appJs.includes('acc_search_input'));
check('Type filter exists', appJs.includes('acc_type_filter'));
check('Category filter exists', appJs.includes('acc_cat_filter'));
check('Period filter exists', appJs.includes('acc_period_filter'));

// Check for table columns and justified layout
check('Receipt / Voucher column exists', appJs.includes('رسید / واؤچر'));
check('Type & Category badge column exists', appJs.includes('نوعیت و مد'));
check('Payee / Recipient column exists', appJs.includes('معاون / وصول کنندہ'));
check('Payment method column exists', appJs.includes('طریقہ'));
check('Amount column exists with monospace font', appJs.includes('font-family:monospace; font-weight:bold; font-size:1.15rem'));
check('Table footer summary with grand totals exists', appJs.includes('مجموعی میزان (Grand Total)'));

if (pass) {
    console.log('\n🎉 ALL 24 BAIT-UL-MAAL REDESIGN VERIFICATION CHECKS PASSED!');
} else {
    process.exit(1);
}
