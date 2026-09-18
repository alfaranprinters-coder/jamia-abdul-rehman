$code = [System.IO.File]::ReadAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\app.js', [System.Text.Encoding]::UTF8)

# Check for syntax errors by parsing with Edge or counting balanced tokens
# Let's count backticks, double quotes, braces, etc.
$openBraces = 0; $closeBraces = 0
$openParens = 0; $closeParens = 0
$openBrackets = 0; $closeBrackets = 0

# Simple tokenizer check
Write-Host "Code length: $($code.Length) chars"

# Test compiling with JScript/Chakra or Edge by running Edge with a test HTML
$testHtml = @"
<!DOCTYPE html>
<html>
<head>
    <script src="db.js"></script>
    <script src="assets/js/address-data.js"></script>
    <script src="assets/js/quran-data.js"></script>
    <script src="hifz.js"></script>
    <script src="app.js"></script>
</head>
<body>
    <div id="main-content"></div>
    <div id="mms-view-title"></div>
    <div id="mms-section-badge"></div>
    <div id="app"></div>
    <script>
        window.addEventListener('DOMContentLoaded', async () => {
            try {
                const testApp = new MadrassahApp();
                await testApp.init();
                console.log('SUCCESS: MadrassahApp initialized!');
                document.title = 'APP_INIT_SUCCESS';
            } catch (err) {
                console.error('ERROR: ' + err.message);
                document.title = 'APP_INIT_ERROR: ' + err.message;
            }
        });
    </script>
</body>
</html>
"@

[System.IO.File]::WriteAllText('d:\Project\managment Softwares\madrsa abdul rehman bin auf\scratch\syntax_test.html', $testHtml, [System.Text.Encoding]::UTF8)
Write-Host "Created scratch/syntax_test.html"
