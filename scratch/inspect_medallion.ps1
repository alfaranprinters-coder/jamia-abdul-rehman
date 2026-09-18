Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')

# Medallion is on the right side.
# Let's sample colors inside the medallion around x = 1000 to 1200, y = 350 to 500
# Let's find the background color inside the medallion (between 'مبلغ' and '10,000' and below '10,000')
$c1 = $bmp.GetPixel(1080, 480) # near 10,000
$c2 = $bmp.GetPixel(1100, 380) # near mublagh
$c3 = $bmp.GetPixel(1100, 520) # below 10,000

Write-Host "Color 1: $c1"
Write-Host "Color 2: $c2"
Write-Host "Color 3: $c3"

$bmp.Dispose()
