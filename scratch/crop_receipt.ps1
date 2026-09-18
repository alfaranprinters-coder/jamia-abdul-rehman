Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\raess book.png')

# Let's inspect coordinates near the border
# Let's check pixel colors along Left=68, Right=1329, Top=24, Bottom=740
$rect = New-Object System.Drawing.Rectangle(68, 24, 1262, 717)
$cropped = $src.Clone($rect, $src.PixelFormat)
$cropped.Save('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png', [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Cropped image saved successfully! Size: $($cropped.Width) x $($cropped.Height)"

$cropped.Dispose()
$src.Dispose()
