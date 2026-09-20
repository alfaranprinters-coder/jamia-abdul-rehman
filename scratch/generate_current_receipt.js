const fs = require('fs');
const appJs = fs.readFileSync('app.js', 'utf8');

const bUri = appJs.match(/const RECEIPT_BLANK_URI = '([^']+)';/)[1];
const sUri = appJs.match(/const RECEIPT_SIGNATURE_URI = '([^']+)';/)[1];

const startMarker = 'generateOfficialReceiptHtml(options) {';
const startIdx = appJs.indexOf(startMarker);
const returnMarker = 'return `<!DOCTYPE html>';
const retIdx = appJs.indexOf(returnMarker, startIdx);
const endMarker = '</html>`;';
const endIdx = appJs.indexOf(endMarker, retIdx);

let tpl = appJs.substring(retIdx + 'return `'.length, endIdx + '</html>'.length);

const options = {
  receiptTitle: 'رسید بک (Official Receipt)',
  receiptNo: 'REC-2026-0042',
  amount: '10000',
  amountInWords: 'دس ہزار روپے صرف',
  payeeName: 'محمد احمد ولد عبد الغفور',
  address: 'بوسال کالونی، ضلع خانیوال',
  onAccountOf: 'ماہانہ فیس بابت ماہ ستمبر 2026ء',
  dateStr: '19 / 09 / 2026',
  receivedBy: 'ناظم مالیات / سیکرٹری',
  isBlank: false
};
const isBlank = false;
const numAmount = '10,000';
const dateVal = '19 / 09 / 2026';
const RECEIPT_BLANK_URI = bUri;
const RECEIPT_SIGNATURE_URI = sUri;
const window = { location: { href: 'http://localhost/' } };

let fn = new Function('options', 'isBlank', 'numAmount', 'dateVal', 'RECEIPT_BLANK_URI', 'RECEIPT_SIGNATURE_URI', 'window', 'return `' + tpl + '`;');
let rendered = fn(options, isBlank, numAmount, dateVal, RECEIPT_BLANK_URI, RECEIPT_SIGNATURE_URI, window);

fs.writeFileSync('scratch/current_receipt.html', rendered, 'utf8');
console.log('Saved scratch/current_receipt.html, length:', rendered.length);
