$logoBytes = [System.IO.File]::ReadAllBytes('d:\Project\managment Softwares\madrsa abdul rehman bin auf\logo.jpg')
$logoB64 = [System.Convert]::ToBase64String($logoBytes)
$logoDataUri = "data:image/png;base64," + $logoB64
[System.IO.File]::WriteAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\logo_base64.txt', $logoDataUri)

$titleBytes = [System.IO.File]::ReadAllBytes('d:\Project\managment Softwares\madrsa abdul rehman bin auf\madrsa-title.png')
$titleB64 = [System.Convert]::ToBase64String($titleBytes)
$titleDataUri = "data:image/png;base64," + $titleB64
[System.IO.File]::WriteAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\title_base64.txt', $titleDataUri)

Write-Host "Logo URI length: "$logoDataUri.Length
Write-Host "Title URI length: "$titleDataUri.Length
