$appJsPath = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js'
$appJs = [System.IO.File]::ReadAllText($appJsPath, [System.Text.Encoding]::UTF8)

# 1. Update numAmount handling in generateOfficialReceiptHtml
$oldLine = 'const numAmount = Number(options.amount || 0).toLocaleString(''en-US'');'
$newLine = 'const numAmount = options.amount ? Number(options.amount).toLocaleString(''en-US'') : '''';'

if ($appJs.Contains($oldLine)) {
    $appJs = $appJs.Replace($oldLine, $newLine)
    Write-Host "numAmount handling updated."
}

# 2. Add printBlankReceipt method right before printFeeReceipt if not present
if (-not $appJs.Contains("printBlankReceipt()")) {
    $target = "    printFeeReceipt(fee) {"
    $blankMethod = @'
    printBlankReceipt() {
        const html = this.generateOfficialReceiptHtml({
            receiptTitle: 'رسید بک (Official Receipt)',
            receiptNo: 'REC-' + Math.floor(100000 + Math.random() * 900000),
            amount: '',
            amountInWords: '',
            payeeName: '',
            address: '',
            onAccountOf: '',
            dateStr: '',
            receivedBy: ''
        });
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
    }

    printFeeReceipt(fee) {
'@
    $appJs = $appJs.Replace($target, $blankMethod)
    Write-Host "printBlankReceipt added."
}

# 3. Add 'خالی رسید بک پرنٹ کریں' button in renderFeeModule
$oldFeeHeader = '<div style="display: grid; grid-template-columns: 400px 1fr; gap: 2rem;">'
$newFeeHeader = @'
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="color:var(--primary); margin:0;"><i class="fas fa-money-bill-wave"></i> فیس وصولی و رسید بک</h2>
                <button class="btn btn-primary" onclick="app.printBlankReceipt()"><i class="fas fa-receipt"></i> خالی رسید پرنٹ کریں</button>
            </div>
            <div style="display: grid; grid-template-columns: 400px 1fr; gap: 2rem;">
'@

if ($appJs.Contains($oldFeeHeader)) {
    $appJs = $appJs.Replace($oldFeeHeader, $newFeeHeader)
    Write-Host "Fee module header updated with blank receipt button."
}

[System.IO.File]::WriteAllText($appJsPath, $appJs, [System.Text.Encoding]::UTF8)
Write-Host "app.js updated successfully with blank receipt support!"
