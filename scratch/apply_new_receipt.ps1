Add-Type -AssemblyName System.Drawing

$newUploadedPath = 'C:\Users\Lenovo\.gemini\antigravity\brain\e073dab4-dee5-453e-b5e5-e49d8eca38a7\.user_uploaded\media_1789932054337.jpg'
$workspaceDir = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf'
$assetsDir = Join-Path $workspaceDir 'assets'
$appJsPath = Join-Path $workspaceDir 'app.js'
$indexHtmlPath = Join-Path $workspaceDir 'index.html'

Write-Host "=== Starting New Receipt Image Processing ==="

# 1. Backup uploaded image to assets/reciept.jpg
Copy-Item -Path $newUploadedPath -Destination (Join-Path $assetsDir 'reciept.jpg') -Force
Write-Host "1. Copied new image to assets/reciept.jpg"

# 2. Load the image and detect crop boundaries
$rawBmp = New-Object System.Drawing.Bitmap($newUploadedPath)
$w = $rawBmp.Width
$h = $rawBmp.Height
Write-Host "Image dimensions: $w x $h"

# Scan middle row for left/right
$midY = [int]($h / 2)
$left = 0
for ($x = 0; $x -lt $w; $x++) {
    $p = $rawBmp.GetPixel($x, $midY)
    if ($p.R -gt 220 -and $p.G -gt 215 -and $p.B -gt 195) {
        $left = $x
        break
    }
}

$right = $w - 1
for ($x = $w - 1; $x -ge 0; $x--) {
    $p = $rawBmp.GetPixel($x, $midY)
    if ($p.R -gt 220 -and $p.G -gt 215 -and $p.B -gt 195) {
        $right = $x
        break
    }
}

# Scan middle column for top/bottom
$midX = [int]($w / 2)
$top = 0
for ($y = 0; $y -lt $h; $y++) {
    $p = $rawBmp.GetPixel($midX, $y)
    if ($p.R -gt 220 -and $p.G -gt 215 -and $p.B -gt 195) {
        $top = $y
        break
    }
}

$bottom = $h - 1
for ($y = $h - 1; $y -ge 0; $y--) {
    $p = $rawBmp.GetPixel($midX, $y)
    if ($p.R -gt 220 -and $p.G -gt 215 -and $p.B -gt 195) {
        $bottom = $y
        break
    }
}

# Ensure sane bounds
if ($left -ge $right -or $top -ge $bottom -or ($right - $left) -lt 500) {
    # Fallback to standard proportions
    $left = [int]($w * 0.0494)
    $top = [int]($h * 0.03125)
    $cropW = [int]($w * 0.917)
    $cropH = [int]($h * 0.9336)
} else {
    $cropW = $right - $left + 1
    $cropH = $bottom - $top + 1
}

Write-Host "Detected Receipt Bounds: Left=$left, Top=$top, Width=$cropW, Height=$cropH"

$cropRect = New-Object System.Drawing.Rectangle($left, $top, $cropW, $cropH)
$cropped = $rawBmp.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$rawBmp.Dispose()

# 3. Clean the 10,000 amount circle (Medallion)
$g = [System.Drawing.Graphics]::FromImage($cropped)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Medallion center relative to cropped receipt
$centerX = [int]($cropW * 0.874)
$centerY = [int]($cropH * 0.598)
$innerR = [int]($cropH * 0.149) # ~107px on 717h

Write-Host "Cleaning Medallion at Center=($centerX, $centerY), Radius=$innerR"

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse($centerX - $innerR, $centerY - $innerR, $innerR * 2, $innerR * 2)

$brush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
$brush.CenterPoint = New-Object System.Drawing.PointF($centerX, $centerY)
$brush.CenterColor = [System.Drawing.Color]::FromArgb(255, 252, 248, 238) # ivory cream center
$brush.SurroundColors = @([System.Drawing.Color]::FromArgb(255, 238, 228, 206)) # warm gold edge

$g.FillPath($brush, $path)

# Draw delicate inner gold groove ring
$grooveR = $innerR - 3
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 190, 155, 85), 1.5)
$g.DrawEllipse($pen, $centerX - $grooveR, $centerY - $grooveR, $grooveR * 2, $grooveR * 2)

$pen.Dispose()
$brush.Dispose()
$path.Dispose()
$g.Dispose()

# 4. Save blank receipt template as JPEG (92% quality)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L)

$blankJpgPath = Join-Path $assetsDir 'receipt_blank.jpg'
$cropped.Save($blankJpgPath, $codec, $encoderParams)
$encoderParams.Dispose()
$cropped.Dispose()
Write-Host "4. Saved blank template to $blankJpgPath"

# 5. Convert to Base64 Data URI
$bytes = [System.IO.File]::ReadAllBytes($blankJpgPath)
$b64 = [System.Convert]::ToBase64String($bytes)
$dataUri = "data:image/jpeg;base64," + $b64
Write-Host "5. Generated Base64 Data URI (length: $($dataUri.Length) chars)"

# 6. Update RECEIPT_BLANK_URI in app.js
$appJs = [System.IO.File]::ReadAllText($appJsPath, [System.Text.Encoding]::UTF8)
$startMarker = "const RECEIPT_BLANK_URI = '"
$startIdx = $appJs.IndexOf($startMarker)
if ($startIdx -ge 0) {
    $valStart = $startIdx + $startMarker.Length
    $endIdx = $appJs.IndexOf("';", $valStart)
    if ($endIdx -ge 0) {
        $appJs = $appJs.Substring(0, $valStart) + $dataUri + $appJs.Substring($endIdx)
        [System.IO.File]::WriteAllText($appJsPath, $appJs, [System.Text.Encoding]::UTF8)
        Write-Host "6. Updated RECEIPT_BLANK_URI in app.js successfully!"
    } else {
        Write-Error "Could not find end of RECEIPT_BLANK_URI in app.js"
    }
} else {
    Write-Error "Could not find const RECEIPT_BLANK_URI in app.js"
}

# 7. Update index.html cache-buster
$indexHtml = [System.IO.File]::ReadAllText($indexHtmlPath, [System.Text.Encoding]::UTF8)
$indexHtml = $indexHtml -replace 'app\.js\?v=[\d\.]+', 'app.js?v=2.6'
[System.IO.File]::WriteAllText($indexHtmlPath, $indexHtml, [System.Text.Encoding]::UTF8)
Write-Host "7. Updated index.html cache-buster to v=2.6"

Write-Host "=== All Done! New Receipt is Active in Software ==="
