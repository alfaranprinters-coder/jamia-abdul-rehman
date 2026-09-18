Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')

# The gold circle has a distinct dark gold border.
# Let's find top, bottom, left, right edges of the inner circle
# Circle is around x = 970 to 1230, y = 300 to 570
# Find gold border pixels (R around 150-180, G around 120-150, B around 60-90)
$goldPoints = @()
for ($y = 300; $y -lt 580; $y++) {
    for ($x = 970; $x -lt 1240; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -ge 120 -and $p.R -le 190 -and $p.G -ge 100 -and $p.G -le 160 -and $p.B -ge 40 -and $p.B -le 90) {
            $goldPoints += New-Object System.Drawing.Point($x, $y)
        }
    }
}

$minX = ($goldPoints | Measure-Object -Property X -Minimum).Minimum
$maxX = ($goldPoints | Measure-Object -Property X -Maximum).Maximum
$minY = ($goldPoints | Measure-Object -Property Y -Minimum).Minimum
$maxY = ($goldPoints | Measure-Object -Property Y -Maximum).Maximum

Write-Host "Circle bounds: X=$minX to $maxX, Y=$minY to $maxY"
$centerX = ($minX + $maxX) / 2.0
$centerY = ($minY + $maxY) / 2.0
$radius = ($maxX - $minX) / 2.0
Write-Host "Center: ($centerX, $centerY), Radius: $radius"

$bmp.Dispose()
