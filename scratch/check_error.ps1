$lines = [System.IO.File]::ReadAllLines('d:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js', [System.Text.Encoding]::UTF8)

Write-Host "Total lines: $($lines.Length)"
for ($i = 0; $i -lt [Math]::Min(15, $lines.Length); $i++) {
    $line = $lines[$i]
    $preview = if ($line.Length -gt 100) { $line.Substring(0, 100) + "..." } else { $line }
    Write-Host "$($i+1): $preview"
}
