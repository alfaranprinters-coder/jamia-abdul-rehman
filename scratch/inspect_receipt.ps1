Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile('d:\Project\managment Softwares\madrsa abdul rehman bin auf\assets\raess book.png')
Write-Host "raess book.png Width: $($img.Width), Height: $($img.Height)"
$img.Dispose()

$img2 = [System.Drawing.Image]::FromFile('C:\Users\Lenovo\.gemini\antigravity\brain\db239094-d25e-48cc-af35-9ed0b98b3335\.user_uploaded\media_1789555701194.jpg')
Write-Host "uploaded Width: $($img2.Width), Height: $($img2.Height)"
$img2.Dispose()
