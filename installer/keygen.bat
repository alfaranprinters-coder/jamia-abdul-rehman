@echo off
chcp 65001 >nul
title مدرسہ عبد الرحمن بن عوف - کی جنریٹر
color 0A
cls
echo ================================================================
echo   مدرسہ عبد الرحمن ؓ بن عوف غفوریہ - خانیوال
echo   ایڈمن ایکٹیویشن کی جنریٹر (Key Generator)
echo ================================================================
echo.
set /p hwid="کلائنٹ کمپیوٹر کی ہارڈویئر آئی ڈی لکھیں یا پیسٹ کریں: "
if "%hwid%"=="" goto end

node -e "const salt = 'MADRASAH_PRO_SECRET_KEY_2026'; const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const hw = process.argv[1].toUpperCase().replace(/[^A-Z0-9]/g, ''); let blocks = []; for (let b = 1; b <= 4; b++) { let sum = b * 7919; for (let i = 0; i < hw.length; i++) { sum = (sum * 33 + hw.charCodeAt(i) * 17 + salt.charCodeAt((i + b * 5) % salt.length) * 13) % 1048573; } let s = ''; for (let k = 0; k < 4; k++) { s += alpha[sum % 32]; sum = Math.floor(sum / 32); } blocks.push(s); } console.log('\n------------------------------------------------'); console.log('  ہارڈویئر آئی ڈی: ' + process.argv[1]); console.log('  ایکٹیویشن کی  : AK-' + blocks.join('-')); console.log('------------------------------------------------\n');" "%hwid%"

:end
echo.
pause
