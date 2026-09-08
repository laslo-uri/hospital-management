# Capture Bolnica 1.0.0 screenshots for the technical dossier.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class NativeUi {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, int nFlags);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
  public const int LEFTDOWN = 0x02;
  public const int LEFTUP = 0x04;
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
  public static void Click() { mouse_event(LEFTDOWN, 0, 0, 0, 0); mouse_event(LEFTUP, 0, 0, 0, 0); }
}
"@

$root = "c:\Users\Laslo Uri\Desktop\my_projects\_older_ftn_projects\HospitalManagementSuite"
$exeDir = Join-Path $root "_legacy-1.0.0\BolnicaProjekat\Bolnica\bin\Debug"
$outDir = Join-Path $root "docs\assets\screenshots"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$exe = Join-Path $exeDir "Bolnica.exe"
if (-not (Test-Path $exe)) { throw "Missing Bolnica.exe - build first" }

function Stop-Bolnica {
  Get-Process Bolnica -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 800
}

function Wait-MainWindow([int]$procId, [int]$timeoutMs = 25000) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while ($sw.ElapsedMilliseconds -lt $timeoutMs) {
    $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($p -and $p.MainWindowHandle -ne [IntPtr]::Zero) {
      return [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
    }
    Start-Sleep -Milliseconds 300
  }
  throw "Timed out waiting for main window"
}

function Capture-Hwnd([IntPtr]$hwnd, [string]$path) {
  [NativeUi]::SetForegroundWindow($hwnd) | Out-Null
  Start-Sleep -Milliseconds 500
  $rect = New-Object NativeUi+RECT
  [NativeUi]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
  $w = $rect.Right - $rect.Left
  $h = $rect.Bottom - $rect.Top
  if ($w -lt 20 -or $h -lt 20) { throw "Bad window size ${w}x${h}" }
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $hdc = $g.GetHdc()
  $ok = [NativeUi]::PrintWindow($hwnd, $hdc, 2)
  $g.ReleaseHdc($hdc)
  if (-not $ok) {
    $g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size($w, $h)))
  }
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "wrote $path ($w x $h)"
}

function Find-WindowByTitle([string]$needle, [int]$timeoutMs = 20000) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $cond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Window)
  while ($sw.ElapsedMilliseconds -lt $timeoutMs) {
    $wins = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
      [System.Windows.Automation.TreeScope]::Children, $cond)
    foreach ($w in $wins) {
      $n = $w.Current.Name
      if ($n -and ($n -like "*$needle*")) {
        return $w
      }
    }
    Start-Sleep -Milliseconds 300
  }
  return $null
}

function Capture-Title([string]$needle, [string]$file) {
  $w = Find-WindowByTitle $needle
  if (-not $w) { throw "Window '$needle' not found" }
  $hwnd = [IntPtr]$w.Current.NativeWindowHandle
  Capture-Hwnd $hwnd (Join-Path $outDir $file)
  return $w
}

function Find-Named($rootEl, [string]$name, [int]$timeoutMs = 5000) {
  $cond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::NameProperty, $name)
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while ($sw.ElapsedMilliseconds -lt $timeoutMs) {
    $el = $rootEl.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
    if ($el) { return $el }
    Start-Sleep -Milliseconds 200
  }
  return $null
}

function Set-EditValue($el, [string]$text) {
  $pat = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  $pat.SetValue($text)
}

function Click-El($el) {
  try {
    $inv = $el.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
    $inv.Invoke()
    return
  } catch {}
  $r = $el.Current.BoundingRectangle
  $x = [int]($r.X + $r.Width / 2)
  $y = [int]($r.Y + $r.Height / 2)
  [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($x, $y)
  Start-Sleep -Milliseconds 150
  [NativeUi]::Click()
}

function Do-Login([string]$user, [string]$pass) {
  Stop-Bolnica
  $proc = Start-Process -FilePath $exe -WorkingDirectory $exeDir -PassThru
  $rootEl = Wait-MainWindow $proc.Id
  Start-Sleep -Seconds 1
  $editCond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Edit)
  $edits = $rootEl.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCond)
  Write-Host "edits=$($edits.Count) user=$user"
  if ($edits.Count -lt 1) { throw "No edit fields" }
  Set-EditValue $edits.Item(0) $user
  if ($edits.Count -ge 2) {
    Set-EditValue $edits.Item(1) $pass
  } else {
    $edits.Item(0).SetFocus()
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.SendKeys]::SendWait($pass)
  }
  $btn = Find-Named $rootEl "Prijavi se"
  if (-not $btn) { throw "Login button missing" }
  Click-El $btn
  Start-Sleep -Seconds 2
  return $proc
}

Stop-Bolnica
$p = Start-Process -FilePath $exe -WorkingDirectory $exeDir -PassThru
Wait-MainWindow $p.Id | Out-Null
Capture-Hwnd $p.MainWindowHandle (Join-Path $outDir "00-login.png")
Stop-Bolnica

Do-Login "LasloUri" "laci" | Out-Null
$home = Capture-Title "LekarHome" "01-lekar-home.png"
$btn = Find-Named $home "Radni kalendar"
if (-not $btn) { $btn = Find-Named $home "Radni Kalendar" }
if ($btn) { Click-El $btn; Start-Sleep -Seconds 1; Capture-Title "LekarHome" "02-lekar-calendar.png" }
else { Copy-Item (Join-Path $outDir "01-lekar-home.png") (Join-Path $outDir "02-lekar-calendar.png") -Force }
$btn = Find-Named $home "Lekovi"
if ($btn) { Click-El $btn; Start-Sleep -Seconds 1; Capture-Title "LekarHome" "03-lekar-recept.png" }
else { Copy-Item (Join-Path $outDir "01-lekar-home.png") (Join-Path $outDir "03-lekar-recept.png") -Force }
Stop-Bolnica

Do-Login "mihajloostojic" "sifra" | Out-Null
$home = Capture-Title "Sekretar" "04-sekretar-home.png"
$btn = Find-Named $home "Zakazi termin"
if (-not $btn) { $btn = Find-Named $home "Termini" }
if ($btn) { Click-El $btn; Start-Sleep -Seconds 1; Capture-Title "Sekretar" "05-sekretar-schedule.png" }
else { Copy-Item (Join-Path $outDir "04-sekretar-home.png") (Join-Path $outDir "05-sekretar-schedule.png") -Force }
Stop-Bolnica

Do-Login "rastislavkukucka" "sifra" | Out-Null
$home = Capture-Title "Upravnik" "06-upravnik-home.png"
$btn = Find-Named $home "Prostorije"
if ($btn) { Click-El $btn; Start-Sleep -Seconds 1; Capture-Title "Upravnik" "07-upravnik-rooms.png" }
else { Copy-Item (Join-Path $outDir "06-upravnik-home.png") (Join-Path $outDir "07-upravnik-rooms.png") -Force }
Stop-Bolnica

Do-Login "peraperic" "pera" | Out-Null
$home = Capture-Title "Pacijent" "08-pacijent-home.png"
$btn = Find-Named $home "Termini"
if (-not $btn) { $btn = Find-Named $home "Zakazani" }
if ($btn) { Click-El $btn; Start-Sleep -Seconds 1; Capture-Title "Pacijent" "09-pacijent-termini.png" }
else { Copy-Item (Join-Path $outDir "08-pacijent-home.png") (Join-Path $outDir "09-pacijent-termini.png") -Force }
Stop-Bolnica

Get-ChildItem $outDir -Filter "*.png" | Format-Table Name, Length
Write-Host "DONE"
