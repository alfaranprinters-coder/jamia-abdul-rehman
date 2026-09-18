$titleB64 = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\title_base64.txt').Trim()
$logoB64 = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\logo_base64.txt').Trim()
$receiptB64 = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\receipt_blank_base64.txt').Trim()

Write-Host "Logo length: $($logoB64.Length)"
Write-Host "Title length: $($titleB64.Length)"
Write-Host "Receipt length: $($receiptB64.Length)"
