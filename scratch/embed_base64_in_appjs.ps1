$logoUri = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\logo_base64.txt').Trim()
$titleUri = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\title_base64.txt').Trim()

$appJs = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js')

if (-not ($appJs.Contains("const LOGO_DATA_URI"))) {
    $header = "const LOGO_DATA_URI = '$logoUri';`nconst TITLE_DATA_URI = '$titleUri';`n`n"
    $appJs = $header + $appJs
    [System.IO.File]::WriteAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js', $appJs)
    Write-Host "Base64 URIs successfully prepended to app.js!"
} else {
    Write-Host "LOGO_DATA_URI already present in app.js!"
}
