$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$port = 9222
$path = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\test_receipt_render.html'
$url = 'file:///' + $path.Replace('\', '/')

Get-Process msedge -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*remote-debugging-port*' } | Stop-Process -Force

$proc = Start-Process -FilePath $edge -ArgumentList "--headless", "--remote-debugging-port=$port", "--window-size=1000,700", "--allow-file-access-from-files", ('"' + $url + '"') -PassThru -NoNewWindow
Start-Sleep -Seconds 3

try {
    $targets = Invoke-RestMethod -Uri "http://localhost:$port/json"
    $pageTarget = $targets | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
    
    if ($pageTarget) {
        $wsUrl = $pageTarget.webSocketDebuggerUrl

        $ws = New-Object System.Net.WebSockets.ClientWebSocket
        $ct = [System.Threading.CancellationToken]::None
        $ws.ConnectAsync([Uri]$wsUrl, $ct).Wait()

        $evalPayload = @{
            id = 1
            method = "Page.captureScreenshot"
            params = @{
                format = "png"
            }
        } | ConvertTo-Json -Depth 5

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($evalPayload)
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()

        $ms = New-Object System.IO.MemoryStream
        $buffer = New-Object byte[] 65536
        
        do {
            $segmentRecv = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
            $res = $ws.ReceiveAsync($segmentRecv, $ct).Result
            $ms.Write($buffer, 0, $res.Count)
        } while (!$res.EndOfMessage)

        $jsonStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
        $jsonResult = $jsonStr | ConvertFrom-Json
        
        if ($jsonResult.result -and $jsonResult.result.data) {
            $bytesImage = [System.Convert]::FromBase64String($jsonResult.result.data)
            $outPath = 'C:\Users\Lenovo\.gemini\antigravity\brain\db239094-d25e-48cc-af35-9ed0b98b3335\scratch\receipt_shot.png'
            [System.IO.File]::WriteAllBytes($outPath, $bytesImage)
            Write-Output "SUCCESS: Saved screenshot to $outPath"
        } else {
            Write-Output "No screenshot data"
        }

        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait()
    }
} finally {
    if ($proc -and !$proc.HasExited) { $proc.Kill() }
}
