$outFile = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\hifz_save_res.txt'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

$testHtml = @'
<!DOCTYPE html>
<html>
<head>
    <script>
    window.errors = [];
    window.onerror = function(msg, url, line, col, err) {
        window.errors.push({msg: msg, url: url, line: line, col: col, stack: err ? err.stack : ''});
        return false;
    };
    </script>
    <script src="../db.js"></script>
    <script src="../assets/js/address-data.js"></script>
    <script src="../assets/js/quran-data.js"></script>
    <script src="../hifz.js"></script>
</head>
<body>
    <div id="debug-out">PENDING</div>
    <script>
    async function testSave() {
        const logs = [];
        try {
            logs.push('Initializing DB...');
            await MadrassahDB.initDB();
            logs.push('DB Initialized.');

            // Test 1: saveHifzEnrollment
            logs.push('Testing saveHifzEnrollment...');
            const enrollData = {
                studentId: 1,
                teacherId: 1,
                halaqa: 'حلقہ اول',
                startDate: '2026-09-16',
                status: 'جاری',
                currentJuz: 1,
                currentPage: 1,
                currentSurah: 'الفاتحة',
                notes: 'تست'
            };
            const enrollRes = await MadrassahDB.saveHifzEnrollment(enrollData);
            logs.push('Enrollment Saved ID: ' + enrollRes);

            // Test 2: saveHifzDailyRecord
            logs.push('Testing saveHifzDailyRecord...');
            const dailyData = {
                studentId: 1,
                date: '2026-09-16',
                sabaqJuz: 1,
                sabaqPage: 1,
                sabaqGrade: 'ممتاز',
                sabqiJuz: 1,
                sabqiGrade: 'جید',
                manzilJuz: 1,
                manzilGrade: 'مقبول',
                teacherId: 1,
                halaqa: 'حلقہ اول'
            };
            const dailyRes = await MadrassahDB.saveHifzDailyRecord(dailyData);
            logs.push('Daily Record Saved ID: ' + dailyRes);

            // Test 3: saveHifzJuzProgress
            logs.push('Testing saveHifzJuzProgress...');
            const juzData = {
                studentId: 1,
                juzNumber: 1,
                status: 'in_progress',
                completedDate: null,
                revisionCount: 0,
                notes: 'صفحہ 1 جاری'
            };
            const juzRes = await MadrassahDB.saveHifzJuzProgress(juzData);
            logs.push('Juz Progress Saved ID: ' + juzRes);

            // Test 4: saveHifzDailyRecordsBatch
            logs.push('Testing saveHifzDailyRecordsBatch...');
            const batchRes = await MadrassahDB.saveHifzDailyRecordsBatch([dailyData]);
            logs.push('Batch Saved Count: ' + batchRes.length);

            document.getElementById('debug-out').textContent = JSON.stringify({ success: true, logs, errors: window.errors }, null, 2);
        } catch (err) {
            logs.push('EXCEPTION: ' + err.toString() + ' | Stack: ' + (err.stack || 'No stack'));
            document.getElementById('debug-out').textContent = JSON.stringify({ success: false, logs, error: err.toString(), stack: err.stack, errors: window.errors }, null, 2);
        }
    }

    testSave();
    </script>
</body>
</html>
'@

$path = 'd:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\test_hifz_save.html'
[System.IO.File]::WriteAllText($path, $testHtml, [System.Text.Encoding]::UTF8)

$url = 'file:///' + $path.Replace('\', '/')
$proc = Start-Process -FilePath $edge -ArgumentList '--headless', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=5000', '--dump-dom', ('"' + $url + '"') -PassThru -NoNewWindow -RedirectStandardOutput $outFile
$proc.WaitForExit(10000)

$content = [System.IO.File]::ReadAllText($outFile)
$match = [regex]::Match($content, '<div id="debug-out">([\s\S]*?)</div>')
if ($match.Success) {
    Write-Output $match.Groups[1].Value
} else {
    Write-Output "No debug div"
}
