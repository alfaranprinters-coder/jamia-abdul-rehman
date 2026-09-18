$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$port = 9222
$path = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\test_hifz_save.html'
$url = 'file:///' + $path.Replace('\', '/')

Get-Process msedge -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*remote-debugging-port*' } | Stop-Process -Force

$proc = Start-Process -FilePath $edge -ArgumentList "--headless", "--remote-debugging-port=$port", "--allow-file-access-from-files", ('"' + $url + '"') -PassThru -NoNewWindow
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
            method = "Runtime.evaluate"
            params = @{
                expression = "document.getElementById('debug-out').textContent"
                returnByValue = $true
            }
        } | ConvertTo-Json -Depth 5

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($evalPayload)
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()

        $buffer = New-Object byte[] 65536
        $segmentRecv = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
        $result = $ws.ReceiveAsync($segmentRecv, $ct).Result

        $jsonResult = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Count)
        Write-Output "DEBUG-OUT CONTENT:"
        Write-Output $jsonResult

        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $ct).Wait()
    }
} finally {
    if ($proc -and !$proc.HasExited) { $proc.Kill() }
}
