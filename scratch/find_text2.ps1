Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')

$minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0

for ($y = 400; $y -lt 500; $y++) {
    for ($x = 960; $x -lt 1230; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 110 -and $p.G -lt 90 -and $p.B -lt 60) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Refined 10,000 bounds: X=$minX to $maxX, Y=$minY to $maxY"
$bmp.Dispose()
