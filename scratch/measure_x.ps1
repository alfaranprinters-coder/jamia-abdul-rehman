Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')

function Get-LineRangeX($y, $startX, $endX) {
    $min = 9999; $max = 0
    for ($x = $startX; $x -le $endX; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 120 -and $p.G -lt 110 -and $p.B -lt 90) {
            if ($x -lt $min) { $min = $x }
            if ($x -gt $max) { $max = $x }
        }
    }
    return [PSCustomObject]@{ Y=$y; MinX=$min; MaxX=$max; MinXPct=[Math]::Round($min/1262*100, 1); MaxXPct=[Math]::Round($max/1262*100, 1) }
}

Write-Host "Hawala Line (Y=245):"
Get-LineRangeX 245 900 1150 | Format-Table

Write-Host "Date Line (Y=245):"
Get-LineRangeX 245 60 250 | Format-Table

Write-Host "Line 1 Name (Y=326):"
Get-LineRangeX 326 50 850 | Format-Table

Write-Host "Line 2 Address (Y=389):"
Get-LineRangeX 389 50 900 | Format-Table

Write-Host "Line 3 Purpose (Y=450):"
Get-LineRangeX 450 50 900 | Format-Table

Write-Host "Line 4 Words (Y=514):"
Get-LineRangeX 514 280 800 | Format-Table

Write-Host "Receiver Name Line (Y=626):"
Get-LineRangeX 626 750 1100 | Format-Table

Write-Host "Signature Line (Y=684):"
Get-LineRangeX 684 750 1200 | Format-Table

$bmp.Dispose()
