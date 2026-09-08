@echo off
setlocal
cd /d "%~dp0_legacy-1.0.0\BolnicaProjekat\Bolnica"

set MSBUILD=
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" set "MSBUILD=%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
if exist "%ProgramFiles%\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" set "MSBUILD=%ProgramFiles%\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe"
if exist "%ProgramFiles%\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe" set "MSBUILD=%ProgramFiles%\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe"
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe" set "MSBUILD=%ProgramFiles(x86)%\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe"

if "%MSBUILD%"=="" (
  echo MSBuild not found. Install Visual Studio Build Tools with the .NET desktop workload.
  exit /b 1
)

where nuget >nul 2>&1
if %ERRORLEVEL%==0 (
  nuget restore Bolnica.sln
) else (
  "%MSBUILD%" Bolnica.sln /t:Restore /p:RestorePackagesConfig=true /v:m
)

REM Prefer system 4.7.2 targeting pack; otherwise NuGet reference assemblies (no machine-wide install).
set "FX472=%CD%\packages\Microsoft.NETFramework.ReferenceAssemblies.net472.1.0.3\build\.NETFramework\v4.7.2"
set "FX40=%CD%\packages\Microsoft.NETFramework.ReferenceAssemblies.net40.1.0.3\build\.NETFramework\v4.0"
if not exist "%FX472%\mscorlib.dll" (
  where nuget >nul 2>&1
  if %ERRORLEVEL%==0 (
    nuget install Microsoft.NETFramework.ReferenceAssemblies.net472 -Version 1.0.3 -OutputDirectory packages -NonInteractive
    nuget install Microsoft.NETFramework.ReferenceAssemblies.net40 -Version 1.0.3 -OutputDirectory packages -NonInteractive
  )
)

if exist "%FX40%\mscorlib.dll" (
  "%MSBUILD%" "..\Jarloo.Calendar\MyCalendar.Calendar.csproj" /p:Configuration=Debug /p:FrameworkPathOverride="%FX40%" /v:m
) else (
  "%MSBUILD%" "..\Jarloo.Calendar\MyCalendar.Calendar.csproj" /p:Configuration=Debug /v:m
)
if errorlevel 1 exit /b 1

if exist "%FX472%\mscorlib.dll" (
  "%MSBUILD%" Bolnica.csproj /p:Configuration=Debug /p:FrameworkPathOverride="%FX472%" /v:m
) else (
  "%MSBUILD%" Bolnica.csproj /p:Configuration=Debug /v:m
)
if errorlevel 1 exit /b 1

cd bin\Debug
start "" Bolnica.exe
endlocal
