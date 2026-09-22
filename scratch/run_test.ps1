$tempDir = Join-Path $env:TEMP ('edge_test_' + [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$testHtml = @'
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <script src='../assets/js/address-data.js'></script>
    <script src='../assets/js/quran-data.js'></script>
    <script src='../db.js'></script>
    <script src='../hifz.js'></script>
    <script src='../donors.js'></script>
    <script src='../graduates.js'></script>
    <script src='../timetable.js'></script>
    <script src='../app.js'></script>
</head>
<body>
    <div id='main-content'></div>
    <pre id='log'></pre>
    <script>
    async function test() {
        const logEl = document.getElementById('log');
        function print(msg) { logEl.textContent += msg + '\n'; }
        try {
            print('1. Initializing MadrassahDB...');
            await MadrassahDB.initDB();
            print('2. DB open success. version=' + MadrassahDB.db.version);
            
            print('3. Saving student in banin...');
            const id1 = await MadrassahDB.saveStudent({
                name: 'محمد احمد',
                fatherName: 'عبد اللہ',
                phone: '03001111111',
                admissionDate: '2026-09-22',
                department: 'حفظ',
                className: 'درجہ اول',
                section: 'banin'
            });
            print('Student 1 saved with id=' + id1);
            
            print('4. Saving student in banat...');
            const id2 = await MadrassahDB.saveStudent({
                name: 'فاطمہ زہرا',
                fatherName: 'محمد علی',
                phone: '03002222222',
                admissionDate: '2026-09-22',
                department: 'ناظرہ',
                className: 'قاعدہ',
                section: 'banat'
            });
            print('Student 2 saved with id=' + id2);
            
            print('5. Fetching banin students...');
            const baninList = await MadrassahDB.getAllStudents('banin');
            print('Banin count: ' + baninList.length + ' -> ' + JSON.stringify(baninList.map(s => ({id: s.id, name: s.name, sec: s.section}))));
            
            print('6. Fetching banat students...');
            const banatList = await MadrassahDB.getAllStudents('banat');
            print('Banat count: ' + banatList.length + ' -> ' + JSON.stringify(banatList.map(s => ({id: s.id, name: s.name, sec: s.section}))));
            
            print('TEST COMPLETE SUCCESS');
        } catch(e) {
            print('ERROR: ' + e.message + '\n' + e.stack);
        }
    }
    test();
    </script>
</body>
</html>
'@

$testFile = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\test_db_runner.html'
[System.IO.File]::WriteAllText($testFile, $testHtml, [System.Text.Encoding]::UTF8)

$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$outFile = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\test_db_runner_out.txt'
$url = 'file:///' + $testFile.Replace('\', '/')

Start-Process -FilePath $edge -ArgumentList '--headless', '--disable-gpu', '--allow-file-access-from-files', ('--user-data-dir=' + $tempDir), '--virtual-time-budget=8000', '--dump-dom', ('"' + $url + '"') -NoNewWindow -Wait -RedirectStandardOutput $outFile

Start-Sleep -Seconds 2
if (Test-Path $outFile) {
    Get-Content $outFile | Select-String -Pattern '1\.|2\.|3\.|4\.|5\.|6\.|Student|TEST|ERROR'
} else {
    Write-Output "outFile not found"
}
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
