$logoB64 = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\logo_base64.txt').Trim()
$titleB64 = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\title_base64.txt').Trim()
$receiptB64 = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\receipt_blank_base64.txt').Trim()

$appJsPath = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js'
$appJs = [System.IO.File]::ReadAllText($appJsPath, [System.Text.Encoding]::UTF8)

# Find where the actual code starts (e.g. "// Madrassah Pro Manager" or "class MadrassahApp")
$marker = "// Madrassah Pro Manager"
$idx = $appJs.IndexOf($marker)
if ($idx -lt 0) {
    $marker = "class MadrassahApp"
    $idx = $appJs.IndexOf($marker)
}

if ($idx -ge 0) {
    $codeBody = $appJs.Substring($idx)
    
    $header = "const LOGO_DATA_URI = '$logoB64';`nconst TITLE_DATA_URI = '$titleB64';`nconst RECEIPT_BLANK_URI = '$receiptB64';`n`n"
    $newAppJs = $header + $codeBody
    
    [System.IO.File]::WriteAllText($appJsPath, $newAppJs, [System.Text.Encoding]::UTF8)
    Write-Host "app.js header fixed perfectly! Code starts at line 5."
} else {
    Write-Host "Marker not found!"
}
