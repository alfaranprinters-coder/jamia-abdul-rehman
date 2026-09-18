$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///d:/Project/managment%20Softwares/madrsa%20abdul%20rehman%20bin%20auf/scratch/syntax_test.html'
$outFile = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\dom_out.txt'

$process = Start-Process -FilePath $edge -ArgumentList "--headless", "--disable-gpu", "--dump-dom", "`"$url`"" -PassThru -NoNewWindow -RedirectStandardOutput $outFile
$process.WaitForExit(10000)

if (Test-Path $outFile) {
    $content = Get-Content $outFile -Raw
    Write-Host "DOM Output length: $($content.Length)"
    if ($content.Contains("APP_INIT_SUCCESS")) {
        Write-Host ">>> TEST PASSED: APP_INIT_SUCCESS! <<<"
    } elseif ($content.Contains("APP_INIT_ERROR")) {
        Write-Host ">>> TEST FAILED WITH ERROR: "
        $match = [regex]::Match($content, '<title>(.*?)</title>')
        Write-Host $match.Value
    } else {
        Write-Host "Title tag: "
        $match = [regex]::Match($content, '<title>(.*?)</title>')
        Write-Host $match.Value
    }
} else {
    Write-Host "Output file not found."
}
