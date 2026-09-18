Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')
$w = $bmp.Width
$h = $bmp.Height

Write-Host "Template size: $w x $h"

# Scan vertical line at x = 350 to find the Y coordinates of the 4 dotted lines
# Dotted lines have darker dots alternating with cream
for ($y = 200; $y -lt 600; $y++) {
    $p = $bmp.GetPixel(350, $y)
    if ($p.R -lt 150 -and $p.G -lt 140 -and $p.B -lt 120) {
        Write-Host "Found line mark at y = $y (R=$($p.R), G=$($p.G), B=$($p.B))"
        $y += 10 # skip nearby pixels
    }
}

# Scan x = 900 for Hawala No line
for ($y = 200; $y -lt 280; $y++) {
    $p = $bmp.GetPixel(900, $y)
    if ($p.R -lt 150 -and $p.G -lt 140 -and $p.B -lt 120) {
        Write-Host "Hawala line mark at y = $y"
        $y += 10
    }
}

# Scan x = 150 for Date line
for ($y = 200; $y -lt 280; $y++) {
    $p = $bmp.GetPixel(150, $y)
    if ($p.R -lt 150 -and $p.G -lt 140 -and $p.B -lt 120) {
        Write-Host "Date line mark at y = $y"
        $y += 10
    }
}

# Scan x = 900 for bottom lines (Receiver & Signature)
for ($y = 550; $y -lt 700; $y++) {
    $p = $bmp.GetPixel(900, $y)
    if ($p.R -lt 150 -and $p.G -lt 140 -and $p.B -lt 120) {
        Write-Host "Bottom line mark at y = $y"
        $y += 10
    }
}

$bmp.Dispose()
