Add-Type -AssemblyName System.Drawing
 = [System.Drawing.Bitmap]::FromFile((Join-Path (Get-Location) 'assets/receipt_blank.jpg'))
Write-Output ('Dimensions: ' + .Width + 'x' + .Height)
 = .GetPixel([int](.Width * 0.15), [int](.Height * 0.28))
Write-Output ('Pixel color at 15%, 28%: R=' + .R + ', G=' + .G + ', B=' + .B + ' Hex=#' + .R.ToString('X2') + .G.ToString('X2') + .B.ToString('X2'))
 = .GetPixel([int](.Width * 0.10), [int](.Height * 0.32))
Write-Output ('Pixel color at 10%, 32%: R=' + .R + ', G=' + .G + ', B=' + .B + ' Hex=#' + .R.ToString('X2') + .G.ToString('X2') + .B.ToString('X2'))
.Dispose()
