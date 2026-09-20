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

// Variation 1: Signature only in bottom center
let tpl1 = tpl.replace(
  /\.val-signature\s*\{[\s\S]*?pointer-events:\s*none;\s*\}/,
  `.val-signature {
            position: absolute;
            bottom: 2.0%;
            left: 49.0%;
            transform: translateX(-50%);
            width: 15.0%;
            height: auto;
            max-height: 18.0%;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 20;
            pointer-events: none;
        }`
);

// Variation 2: Signature with "دستخط وصول کنندہ" label underneath
let tpl2 = tpl.replace(
  /\.val-signature\s*\{[\s\S]*?pointer-events:\s*none;\s*\}/,
  `.val-signature {
            position: absolute;
            bottom: 1.5%;
            left: 49.0%;
            transform: translateX(-50%);
            width: 16.0%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            z-index: 20;
            pointer-events: none;
        }
        .signature-label {
            font-family: 'Jameel Noori Nastaleeq', 'Amiri', serif;
            font-size: 1.15rem;
            color: #1e293b;
            font-weight: bold;
            line-height: 1;
            margin-top: 1px;
            white-space: nowrap;
        }`
).replace(
  `<div class="val-signature">
                <img src="\${RECEIPT_SIGNATURE_URI}" alt="دستخط">
            </div>`,
  `<div class="val-signature">
                <img src="\${RECEIPT_SIGNATURE_URI}" alt="دستخط">
                <div class="signature-label">دستخط وصول کنندہ</div>
            </div>`
);

let fn1 = new Function('options', 'isBlank', 'numAmount', 'dateVal', 'RECEIPT_BLANK_URI', 'RECEIPT_SIGNATURE_URI', 'window', 'return `' + tpl1 + '`;');
fs.writeFileSync('scratch/var1.html', fn1(options, isBlank, numAmount, dateVal, RECEIPT_BLANK_URI, RECEIPT_SIGNATURE_URI, window), 'utf8');

let fn2 = new Function('options', 'isBlank', 'numAmount', 'dateVal', 'RECEIPT_BLANK_URI', 'RECEIPT_SIGNATURE_URI', 'window', 'return `' + tpl2 + '`;');
fs.writeFileSync('scratch/var2.html', fn2(options, isBlank, numAmount, dateVal, RECEIPT_BLANK_URI, RECEIPT_SIGNATURE_URI, window), 'utf8');

console.log('Saved var1.html and var2.html');
