$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///d:/Project/managment%20Softwares/madrsa%20abdul%20rehman%20bin%20auf/index.html'
$outFile = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\welcome_dom_out.txt'

$process = Start-Process -FilePath $edge -ArgumentList "--headless", "--disable-gpu", "--dump-dom", "`"$url`"" -PassThru -NoNewWindow -RedirectStandardOutput $outFile
$process.WaitForExit(10000)

if (Test-Path $outFile) {
    $content = Get-Content $outFile -Raw
    Write-Host "DOM Output length: $($content.Length)"
    
    $checks = @(
        "welcome-login-screen",
        "madrsa-title.png",
        "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
        "شعبہ بنین و بنات",
        "حفظ و درس نظامی",
        "بیت المال و فیس نظام",
        "بیک اپ و ڈیٹا تحفظ",
        "login-password-input",
        "btn-login-submit",
        "123",
        "محمد ادریس شاہین",
        "novatix-logo.jpg"
    )

    foreach ($check in $checks) {
        if ($content.Contains($check)) {
            Write-Host "[PASS] Found: $check" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] Missing: $check" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Output file not found."
}
