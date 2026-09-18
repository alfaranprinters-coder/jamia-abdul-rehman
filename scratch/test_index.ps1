$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///d:/Project/managment%20Softwares/madrsa%20abdul%20rehman%20bin%20auf/index.html'
$outFile = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\index_dom_out.txt'

$process = Start-Process -FilePath $edge -ArgumentList "--headless", "--no-sandbox", "--disable-gpu", "--dump-dom", "`"$url`"" -PassThru -NoNewWindow -RedirectStandardOutput $outFile
$process.WaitForExit(10000)

if (Test-Path $outFile) {
    $content = Get-Content $outFile -Raw
    Write-Host "Index DOM Output length: $($content.Length)"
    if ($content.Contains("dash-header-card")) {
        Write-Host ">>> SUCCESS: DASHBOARD HEADER CARD FOUND IN DOM! <<<"
    }
    if ($content.Contains("stats-grid")) {
        Write-Host ">>> SUCCESS: STATS GRID FOUND IN DOM! <<<"
    }
}
