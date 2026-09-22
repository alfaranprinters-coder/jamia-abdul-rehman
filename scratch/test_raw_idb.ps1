$testHtml = @'
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<pre id="out"></pre>
<script>
const out = document.getElementById("out");
function log(msg) { out.textContent += msg + "\n"; }

log("Starting direct indexedDB test...");
try {
    log("indexedDB exists: " + (typeof indexedDB !== "undefined"));
    const req = indexedDB.open("TestMadrassahDB", 1);
    log("Open requested...");
    req.onupgradeneeded = function(e) {
        log("onupgradeneeded triggered");
        const db = e.target.result;
        db.createObjectStore("test_store", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = function(e) {
        log("onsuccess triggered! db version=" + e.target.result.version);
        const db = e.target.result;
        const tx = db.transaction(["test_store"], "readwrite");
        const store = tx.objectStore("test_store");
        const addReq = store.add({ name: "Testing 123" });
        addReq.onsuccess = function() {
            log("Record added with id=" + addReq.result);
            const getReq = store.getAll();
            getReq.onsuccess = function() {
                log("Retrieved count: " + getReq.result.length);
            };
        };
    };
    req.onerror = function(e) {
        log("onerror triggered: " + (e.target.error ? e.target.error.message : "unknown"));
    };
    req.onblocked = function(e) {
        log("onblocked triggered!");
    };
} catch(err) {
    log("Caught exception: " + err.message);
}
</script>
</body>
</html>
'@

$testFile = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\raw_idb_test.html'
[System.IO.File]::WriteAllText($testFile, $testHtml, [System.Text.Encoding]::UTF8)

$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$outFile = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\raw_idb_out.txt'
$url = 'file:///' + $testFile.Replace('\', '/')
$tempDir = Join-Path $env:TEMP ('edge_test_' + [System.Guid]::NewGuid().ToString())

Start-Process -FilePath $edge -ArgumentList '--headless', '--disable-gpu', '--allow-file-access-from-files', ('--user-data-dir=' + $tempDir), '--virtual-time-budget=5000', '--dump-dom', ('"' + $url + '"') -NoNewWindow -Wait -RedirectStandardOutput $outFile

Start-Sleep -Seconds 2
Get-Content $outFile
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
