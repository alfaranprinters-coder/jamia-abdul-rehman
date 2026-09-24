Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\assets\89d64f89-4957-4daa-91dd-6c6656ca1a5b.png"
$sourcePath = [System.IO.Path]::GetFullPath($sourcePath)
$destPng = Join-Path $PSScriptRoot "..\assets\app_logo.png"
Copy-Item $sourcePath $destPng -Force

Write-Output "Copied to $destPng"
