$bytes = [System.IO.File]::ReadAllBytes('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\receipt_blank.png')
$b64 = [System.Convert]::ToBase64String($bytes)
$dataUri = "data:image/png;base64," + $b64

[System.IO.File]::WriteAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\receipt_blank_base64.txt', $dataUri)
Write-Host "Base64 URI length: $($dataUri.Length)"
