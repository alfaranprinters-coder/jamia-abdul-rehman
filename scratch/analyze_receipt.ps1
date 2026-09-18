Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\raess book.png')

# Find left boundary by scanning middle row (y = 384)
$y = 384
$left = 0
for ($x = 0; $x -lt 1376; $x++) {
    $p = $bmp.GetPixel($x, $y)
    # The receipt has high brightness / cream color (R > 230, G > 220, B > 200)
    if ($p.R -gt 220 -and $p.G -gt 215 -and $p.B -gt 195) {
        $left = $x
        break
    }
}

# Find right boundary
$right = 1375
for ($x = 1375; $x -ge 0; $x--) {
    $p = $bmp.GetPixel($x, $y)
    if ($p.R -gt 220 -and $p.G -gt 215 -and $p.B -gt 195) {
        $right = $x
        break
    }
}

# Find top boundary by scanning middle column (x = 688)
$x = 688
$top = 0
for ($y = 0; $y -lt 768; $y++) {
    $p = $bmp.GetPixel($x, $y)
    if ($p.R -gt 220 -and $p.G -gt 215 -and $p.B -gt 195) {
        $top = $y
        break
    }
}

# Find bottom boundary
$bottom = 767
for ($y = 767; $y -ge 0; $y--) {
    $p = $bmp.GetPixel($x, $y)
    if ($p.R -gt 220 -and $p.G -gt 215 -and $p.B -gt 195) {
        $bottom = $y
        break
    }
}

Write-Host "Detected Receipt Bounds: Left=$left, Top=$top, Right=$right, Bottom=$bottom"
Write-Host "Width=$($right - $left + 1), Height=$($bottom - $top + 1)"

$bmp.Dispose()
