@echo off
REM Summarizer — Desktop File Organizer Launcher
echo.
echo  ^>^>^>  Summarizer — Desktop File Organizer
echo  ^>^>^>  http://localhost:3003
echo  ^>^>^>  Press Ctrl+C to stop
echo.
cd /d "%~dp0"
node start.js
pause