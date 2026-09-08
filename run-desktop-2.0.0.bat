@echo off
setlocal
set PATH=C:\Program Files\dotnet;%PATH%
cd /d "%~dp0desktop\HospitalDesktop"
dotnet build -c Release
if errorlevel 1 exit /b 1
start "" "bin\Release\net8.0-windows\HospitalDesktop.exe"
