$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$port = 9222

$testHtml = @'
<!DOCTYPE html>
<html>
<head>
    <script src="../db.js"></script>
    <script src="../assets/js/address-data.js"></script>
    <script src="../assets/js/quran-data.js"></script>
    <script src="../hifz.js"></script>
    <script src="../app.js"></script>
</head>
<body>
    <div id="debug-out">PENDING</div>
    <script>
    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await MadrassahDB.initDB();
            const receiptHtml = app.generateOfficialReceiptHtml({
                receiptTitle: 'فیس وصولی کی رسید (Fee Receipt)',
                receiptNo: 'REC-123456',
                bookNo: '1',
                amount: 5000,
                amountInWords: 'پانچ ہزار روپے صرف',
                payeeName: 'محمد علی ولد احمد',
                onAccountOf: 'فیس (برائے ستمبر) - درجہ اول',
                dateStr: '2026-09-17'
            });
            
            document.body.innerHTML = receiptHtml;
        } catch (err) {
            document.getElementById('debug-out').textContent = err.toString();
        }
    });
    </script>
</body>
</html>
'@

$path = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\test_receipt_render.html'
[System.IO.File]::WriteAllText($path, $testHtml, [System.Text.Encoding]::UTF8)

# Now launch Edge and render PNG screenshot
$url = 'file:///' + $path.Replace('\', '/')
$proc = Start-Process -FilePath $edge -ArgumentList "--headless", "--window-size=1200,800", "--screenshot=d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\receipt_shot.png", "--allow-file-access-from-files", ('"' + $url + '"') -PassThru -NoNewWindow
$proc.WaitForExit(8000)
if (!$proc.HasExited) { $proc.Kill() }

Write-Output "Screenshot saved to d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\receipt_shot.png"
