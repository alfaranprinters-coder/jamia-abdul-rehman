Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_blank.png')

# Save as JPEG with 92% quality
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L)

$src.Save('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_blank.jpg', $codec, $encoderParams)

$bytes = [System.IO.File]::ReadAllBytes('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_blank.jpg')
$b64 = [System.Convert]::ToBase64String($bytes)
$dataUri = "data:image/jpeg;base64," + $b64
[System.IO.File]::WriteAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\receipt_blank_base64.txt', $dataUri)

Write-Host "JPEG File size: $($bytes.Length) bytes ($([Math]::Round($bytes.Length/1024, 1)) KB)"
Write-Host "Base64 URI length: $($dataUri.Length)"

$encoderParams.Dispose()
$src.Dispose()
