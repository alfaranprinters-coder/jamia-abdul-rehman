Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')

# Find dotted lines between y = 280 and 550 across x = 200 to 700
# Count number of dark pixels on each horizontal row y
$darkCounts = @{}
for ($y = 200; $y -lt 700; $y++) {
    $count = 0
    for ($x = 100; $x -lt 800; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 100 -and $p.G -lt 90 -and $p.B -lt 70) {
            $count++
        }
    }
    if ($count -gt 15) {
        $darkCounts[$y] = $count
    }
}

# Group consecutive rows to find line centers
$lines = @()
$currentGroup = @()
foreach ($y in ($darkCounts.Keys | Sort-Object)) {
    if ($currentGroup.Count -eq 0 -or $y -eq ($currentGroup[-1] + 1)) {
        $currentGroup += $y
    } else {
        $center = [Math]::Round(($currentGroup | Measure-Object -Average).Average)
        $lines += $center
        $currentGroup = @($y)
    }
}
if ($currentGroup.Count -gt 0) {
    $center = [Math]::Round(($currentGroup | Measure-Object -Average).Average)
    $lines += $center
}

Write-Host "Detected line centers (Y):"
foreach ($l in $lines) {
    $percent = [Math]::Round(($l / 717.0) * 100, 2)
    Write-Host "Y = $l ( $percent % )"
}

$bmp.Dispose()
