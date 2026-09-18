Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_blank.jpg')
$g = [System.Drawing.Graphics]::FromImage($src)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$fontFamily = "Arial"
$installed = (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }
if ($installed -contains "Amiri") { $fontFamily = "Amiri" }
elseif ($installed -contains "Noto Nastaliq Urdu") { $fontFamily = "Noto Nastaliq Urdu" }
elseif ($installed -contains "Arabic Typesetting") { $fontFamily = "Arabic Typesetting" }

Write-Host "Using font: $fontFamily"

$fontText = New-Object System.Drawing.Font($fontFamily, 16, [System.Drawing.FontStyle]::Bold)
$fontLarge = New-Object System.Drawing.Font($fontFamily, 18, [System.Drawing.FontStyle]::Bold)
$fontAmount = New-Object System.Drawing.Font("Arial", 32, [System.Drawing.FontStyle]::Bold)
$fontMublagh = New-Object System.Drawing.Font($fontFamily, 16, [System.Drawing.FontStyle]::Bold)
$fontLatin = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)

$brushText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$brushGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 6, 95, 70))
$brushBlue = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 58, 138))
$brushGold = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 74, 59, 30))

$formatRight = New-Object System.Drawing.StringFormat
$formatRight.Alignment = [System.Drawing.StringAlignment]::Far
$formatRight.FormatFlags = [System.Drawing.StringFormatFlags]::DirectionRightToLeft

$formatCenter = New-Object System.Drawing.StringFormat
$formatCenter.Alignment = [System.Drawing.StringAlignment]::Center

# 1. Hawala No
$g.DrawString('RF-854912', $fontLatin, $brushBlue, (New-Object System.Drawing.RectangleF(950, 205, 160, 30)), $formatCenter)

# 2. Date
$g.DrawString('16/09/2026', $fontLatin, $brushText, (New-Object System.Drawing.RectangleF(65, 205, 180, 30)), $formatCenter)

# 3. Name
$g.DrawString([System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Default.GetBytes('محمد احمد ولد عبد الغفور')), $fontLarge, $brushGreen, (New-Object System.Drawing.RectangleF(50, 280, 790, 45)), $formatRight)

# 4. Address
$g.DrawString([System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Default.GetBytes('کلاس حفظ القرآن، درجہ اول (طالب علم آئی ڈی: #104)')), $fontText, $brushText, (New-Object System.Drawing.RectangleF(50, 342, 850, 45)), $formatRight)

# 5. Purpose
$g.DrawString([System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Default.GetBytes('ماہانہ تعلیمی فیس بابت ماہ ستمبر 2026ء')), $fontText, $brushText, (New-Object System.Drawing.RectangleF(50, 405, 850, 45)), $formatRight)

# 6. Words
$g.DrawString([System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Default.GetBytes('دس ہزار روپے صرف')), $fontText, $brushText, (New-Object System.Drawing.RectangleF(280, 470, 510, 45)), $formatRight)

# 7. Medallion Amount
$g.DrawString([System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Default.GetBytes('(مبلغ)')), $fontMublagh, $brushGold, (New-Object System.Drawing.RectangleF(1000, 340, 205, 40)), $formatCenter)
$g.DrawString('10,000', $fontAmount, $brushGold, (New-Object System.Drawing.RectangleF(1000, 395, 205, 60)), $formatCenter)

# 8. Receiver
$g.DrawString([System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Default.GetBytes('قاری عبد الرحمن صاحب')), $fontText, $brushText, (New-Object System.Drawing.RectangleF(750, 580, 305, 45)), $formatRight)

$src.Save('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\sample_rendered_receipt.jpg', [System.Drawing.Imaging.ImageFormat]::Jpeg)

$brushText.Dispose(); $brushGreen.Dispose(); $brushBlue.Dispose(); $brushGold.Dispose()
$fontText.Dispose(); $fontLarge.Dispose(); $fontAmount.Dispose(); $fontMublagh.Dispose(); $fontLatin.Dispose()
$g.Dispose(); $src.Dispose()

Write-Host "sample_rendered_receipt.jpg created successfully!"
