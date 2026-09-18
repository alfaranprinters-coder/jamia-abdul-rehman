Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')

# Medallion region: x from 980 to 1220, y from 300 to 580
# Find dark pixels of "10,000" (which are below 'مبلغ' y > 390 and y < 510)
$minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0

for ($y = 390; $y -lt 510; $y++) {
    for ($x = 990; $x -lt 1210; $x++) {
        $p = $bmp.GetPixel($x, $y)
        # Text is dark brown / dark gold (R < 120, G < 100, B < 70)
        if ($p.R -lt 130 -and $p.G -lt 110 -and $p.B -lt 80) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "10,000 bounds: X=$minX to $maxX, Y=$minY to $maxY"
Write-Host "Width = $($maxX - $minX + 1), Height = $($maxY - $minY + 1)"

$bmp.Dispose()
