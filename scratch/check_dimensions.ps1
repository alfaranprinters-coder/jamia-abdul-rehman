Add-Type -AssemblyName System.Drawing

$oldPath = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\reciept.jpg'
$newPath = 'C:\Users\Lenovo\.gemini\antigravity\brain\e073dab4-dee5-453e-b5e5-e49d8eca38a7\.user_uploaded\media_1789932054337.jpg'

$newImg = [System.Drawing.Image]::FromFile($newPath)
Write-Host "New Image Dimensions: Width=$($newImg.Width), Height=$($newImg.Height)"
$newImg.Dispose()

if (Test-Path $oldPath) {
    $oldImg = [System.Drawing.Image]::FromFile($oldPath)
    Write-Host "Old reciept.jpg Dimensions: Width=$($oldImg.Width), Height=$($oldImg.Height)"
    $oldImg.Dispose()
}
