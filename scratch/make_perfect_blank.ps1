Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_template.png')
$g = [System.Drawing.Graphics]::FromImage($src)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Inner circle center is (1103, 429)
# Inner circle radius is 108 (inside the gold concentric rings)
$centerX = 1103
$centerY = 429
$innerR = 107

# Create radial brush for inner circle
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse($centerX - $innerR, $centerY - $innerR, $innerR * 2, $innerR * 2)

$brush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
$brush.CenterPoint = New-Object System.Drawing.PointF($centerX, $centerY)
$brush.CenterColor = [System.Drawing.Color]::FromArgb(255, 252, 248, 238) # center light ivory
$brush.SurroundColors = @([System.Drawing.Color]::FromArgb(255, 238, 228, 206)) # rim warm gold-tint

$g.FillPath($brush, $path)

# Draw subtle inner groove ring
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 190, 155, 85), 1.5)
$g.DrawEllipse($pen, $centerX - 104, $centerY - 104, 208, 208)

# Now draw the beautiful "مبلغ:" at the top inside the circle
# Or we can let HTML draw both "مبلغ:" and the amount!

$src.Save('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_blank.png', [System.Drawing.Imaging.ImageFormat]::Png)

$pen.Dispose()
$brush.Dispose()
$path.Dispose()
$g.Dispose()
$src.Dispose()

Write-Host "receipt_blank.png created with pristine inner circle!"
