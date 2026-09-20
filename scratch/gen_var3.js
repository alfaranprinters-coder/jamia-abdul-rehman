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

// Variation 3: Signature with neat label "دستخط وصول کنندہ"
let tpl3 = tpl.replace(
  /\.val-signature\s*\{[\s\S]*?pointer-events:\s*none;\s*\}/,
  `.val-signature {
            position: absolute;
            bottom: 2.5%;
            left: 48.0%;
            transform: translateX(-50%);
            width: 14.0%;
            height: 19.0%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            z-index: 20;
            pointer-events: none;
        }
        .signature-caption {
            font-family: 'Jameel Noori Nastaleeq', 'Amiri', serif;
            font-size: 1.15rem;
            color: #334155;
            font-weight: bold;
            line-height: 1;
            margin-top: 2px;
            white-space: nowrap;
            border-top: 1px dashed #94a3b8;
            padding-top: 2px;
            width: 100%;
            text-align: center;
        }`
).replace(
  `<div class="val-signature">
                <img src="\${RECEIPT_SIGNATURE_URI}" alt="دستخط">
            </div>`,
  `<div class="val-signature">
                <img src="\${RECEIPT_SIGNATURE_URI}" alt="دستخط" style="max-height: 72%;">
                <div class="signature-caption">دستخط وصول کنندہ</div>
            </div>`
);

let fn3 = new Function('options', 'isBlank', 'numAmount', 'dateVal', 'RECEIPT_BLANK_URI', 'RECEIPT_SIGNATURE_URI', 'window', 'return `' + tpl3 + '`;');
fs.writeFileSync('scratch/var3.html', fn3(options, isBlank, numAmount, dateVal, RECEIPT_BLANK_URI, RECEIPT_SIGNATURE_URI, window), 'utf8');

console.log('Saved var3.html');
