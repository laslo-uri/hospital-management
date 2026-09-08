# Capture Hospital Desktop 2.0.0 screenshots for the technical dossier.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class NativeUi2 {
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
$exeDir = Join-Path $root "desktop\HospitalDesktop\bin\Release\net8.0-windows"
$outDir = Join-Path $root "docs\assets\screenshots"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$exe = Join-Path $exeDir "HospitalDesktop.exe"
if (-not (Test-Path $exe)) { throw "Missing HospitalDesktop.exe - build Release first" }

function Stop-App {
  Get-Process HospitalDesktop -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
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
  [NativeUi2]::SetForegroundWindow($hwnd) | Out-Null
  Start-Sleep -Milliseconds 500
  $rect = New-Object NativeUi2+RECT
  [NativeUi2]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
  $w = $rect.Right - $rect.Left
  $h = $rect.Bottom - $rect.Top
  if ($w -lt 20 -or $h -lt 20) { throw "Bad window size ${w}x${h}" }
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $hdc = $g.GetHdc()
  $ok = [NativeUi2]::PrintWindow($hwnd, $hdc, 2)
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
      if ($n -and ($n -like "*$needle*")) { return $w }
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
  [NativeUi2]::Click()
}

function Do-Login([string]$user, [string]$pass) {
  Stop-App
  $proc = Start-Process -FilePath $exe -WorkingDirectory $exeDir -PassThru
  $rootEl = Wait-MainWindow $proc.Id
  Start-Sleep -Seconds 1
  $editCond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Edit)
  $edits = $rootEl.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCond)
  Write-Host "edits=$($edits.Count) user=$user"
  if ($edits.Count -lt 1) { throw "No edit fields" }
  $pat = $edits.Item(0).GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  $pat.SetValue($user)
  $edits.Item(0).SetFocus()
  Start-Sleep -Milliseconds 200
  [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
  Start-Sleep -Milliseconds 200
  [System.Windows.Forms.SendKeys]::SendWait("^a")
  [System.Windows.Forms.SendKeys]::SendWait($pass)
  $btn = Find-Named $rootEl "Sign in"
  if (-not $btn) { throw "Sign in button missing" }
  Click-El $btn
  Start-Sleep -Seconds 2
  return $proc
}

Stop-App
$p = Start-Process -FilePath $exe -WorkingDirectory $exeDir -PassThru
Wait-MainWindow $p.Id | Out-Null
Capture-Hwnd $p.MainWindowHandle (Join-Path $outDir "10-login-2.0.0.png")
Stop-App

Do-Login "manager" "m" | Out-Null
Capture-Title "Manager desk" "11-manager-2.0.0.png" | Out-Null
Stop-App

Do-Login "secretary" "s" | Out-Null
Capture-Title "Secretary desk" "12-secretary-2.0.0.png" | Out-Null
Stop-App

Do-Login "doctor" "d" | Out-Null
Capture-Title "Doctor desk" "13-doctor-2.0.0.png" | Out-Null
Stop-App

Do-Login "patient" "p" | Out-Null
Capture-Title "Patient portal" "14-patient-2.0.0.png" | Out-Null
Stop-App

Get-ChildItem $outDir -Filter "*2.0.0.png" | Format-Table Name, Length
Write-Host "DONE desktop 2.0.0"
