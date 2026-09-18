Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')
$g = [System.Drawing.Graphics]::FromImage($src)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Medallion center is at (1100, 450)
# Let's draw an ellipse filling the area of "10,000" between y=415 and y=500
# Center of the patch is at (1100, 458), width ~220, height ~95
$rect = New-Object System.Drawing.Rectangle(985, 412, 228, 96)

# Create a PathGradientBrush or Radial gradient matching the medallion background
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(970, 340, 260, 220)
$brush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
$brush.CenterPoint = New-Object System.Drawing.PointF(1100, 445)
$brush.CenterColor = [System.Drawing.Color]::FromArgb(255, 248, 243, 228) # #f8f3e4
$brush.SurroundColors = @([System.Drawing.Color]::FromArgb(255, 236, 226, 202)) # #ece2ca

# Fill the ellipse over 10,000
$patchEllipse = New-Object System.Drawing.Drawing2D.GraphicsPath
$patchEllipse.AddEllipse($rect)
$g.FillPath($brush, $patchEllipse)

$src.Save('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_blank.png', [System.Drawing.Imaging.ImageFormat]::Png)

$brush.Dispose()
$path.Dispose()
$patchEllipse.Dispose()
$g.Dispose()
$src.Dispose()

Write-Host "receipt_blank.png generated successfully!"
