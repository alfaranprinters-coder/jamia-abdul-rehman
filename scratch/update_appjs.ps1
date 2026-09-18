$filePath = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Remove the dash-header-meta div
$oldHtml = @'
                <div class="dash-header-right">
                    <img src="${TITLE_DATA_URI}" alt="مدرسہ عبد الرحمن بن عوف غفوریہ" class="dash-title-img">
                    <div class="dash-header-meta">
                        <span class="dash-meta-item"><i class="fas fa-mosque" style="color:var(--primary);"></i> جامعہ اسلامیہ</span>
                        <span class="dash-meta-divider">•</span>
                        <span class="dash-meta-item"><i class="fas fa-map-marker-alt" style="color:#ef4444;"></i> چک نمبر 28-10 آر بوسال کالونی، ضلع خانیوال</span>
                        <span class="dash-meta-divider">•</span>
                        <span class="dash-meta-badge ${isBanat ? 'badge-banat' : 'badge-banin'}">
                            <i class="fas ${isBanat ? 'fa-venus' : 'fa-mars'}"></i> ${sectionLabel}
                        </span>
                    </div>
                </div>
'@

$newHtml = @'
                <div class="dash-header-right">
                    <img src="${TITLE_DATA_URI}" alt="مدرسہ عبد الرحمن بن عوف غفوریہ" class="dash-title-img">
                </div>
'@

if ($content.Contains($oldHtml)) {
    $content = $content.Replace($oldHtml, $newHtml)
    [System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Successfully replaced in app.js!"
} else {
    Write-Host "Target string not found, attempting regex replacement..."
    $regex = '(?s)<div class="dash-header-meta">.*?</div>\s*</div>'
    $replacement = '</div>'
    if ($content -match $regex) {
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, $regex, $replacement)
        [System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Successfully replaced using regex in app.js!"
    } else {
        Write-Host "Regex match also failed."
    }
}
