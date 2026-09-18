$appJsPath = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js'
$appJs = [System.IO.File]::ReadAllText($appJsPath, [System.Text.Encoding]::UTF8)

# 1. In printFeeReceipt
$oldFeeCall = @'
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'فیس وصولی کی رسید (Fee Receipt)',
            receiptNo: fee.receiptNo || 'REC-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: fee.amount,
            amountInWords: amountWords,
            payeeName: payee,
            onAccountOf: purpose,
            dateStr: date
        });
'@

$newFeeCall = @'
        const address = fee.address || (fee.className ? `درجہ: ${fee.className}` : 'بوسال کالونی، ضلع خانیوال');
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'فیس وصولی کی رسید (Fee Receipt)',
            receiptNo: fee.receiptNo || 'REC-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: fee.amount,
            amountInWords: amountWords,
            payeeName: payee,
            address: address,
            onAccountOf: purpose,
            dateStr: date
        });
'@

# 2. In printMonthlyReceipt
$oldMonthlyCall = @'
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'فیس وصولی رسید (Payment Receipt)',
            receiptNo: feeData.receiptNo || 'FEE-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: feeData.amount,
            amountInWords: amountWords,
            payeeName: payee,
            onAccountOf: purpose,
            dateStr: date
        });
'@

$newMonthlyCall = @'
        const address = student.address || student.currentAddress || (student.className || student.class ? `درجہ: ${student.className || student.class}` : 'بوسال کالونی، ضلع خانیوال');
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'فیس وصولی رسید (Payment Receipt)',
            receiptNo: feeData.receiptNo || 'FEE-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: feeData.amount,
            amountInWords: amountWords,
            payeeName: payee,
            address: address,
            onAccountOf: purpose,
            dateStr: date
        });
'@

# 3. In printDonationReceipt
$oldDonationCall = @'
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'ڈونیشن / تعاون کی رسید (Donation Receipt)',
            receiptNo: t.receiptNo || 'DON-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: t.amount,
            amountInWords: amountWords,
            payeeName: payee,
            onAccountOf: purpose,
            dateStr: date
        });
'@

$newDonationCall = @'
        const address = t.address || t.city || 'ضلع خانیوال';
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'ڈونیشن / تعاون کی رسید (Donation Receipt)',
            receiptNo: t.receiptNo || 'DON-' + Math.floor(100000 + Math.random() * 900000),
            bookNo: '1',
            amount: t.amount,
            amountInWords: amountWords,
            payeeName: payee,
            address: address,
            onAccountOf: purpose,
            dateStr: date
        });
'@

if ($appJs.Contains($oldFeeCall)) {
    $appJs = $appJs.Replace($oldFeeCall, $newFeeCall)
    Write-Host "printFeeReceipt call updated."
}

if ($appJs.Contains($oldMonthlyCall)) {
    $appJs = $appJs.Replace($oldMonthlyCall, $newMonthlyCall)
    Write-Host "printMonthlyReceipt call updated."
}

if ($appJs.Contains($oldDonationCall)) {
    $appJs = $appJs.Replace($oldDonationCall, $newDonationCall)
    Write-Host "printDonationReceipt call updated."
}

[System.IO.File]::WriteAllText($appJsPath, $appJs, [System.Text.Encoding]::UTF8)
Write-Host "app.js updated successfully!"
