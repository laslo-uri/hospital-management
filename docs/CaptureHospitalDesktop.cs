// Capture Hospital Desktop 2.0.0 UI screenshots for the technical dossier.
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Automation;
using System.Windows.Forms;

class CaptureHospitalDesktop
{
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, int nFlags);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);
    const int LEFTDOWN = 0x02, LEFTUP = 0x04;
    struct RECT { public int Left, Top, Right, Bottom; }

    static string root, exeDir, outDir, exe;

    static void Main()
    {
        root = @"c:\Users\Laslo Uri\Desktop\my_projects\_older_ftn_projects\HospitalManagementSuite";
        exeDir = Path.Combine(root, @"desktop\HospitalDesktop\bin\Release\net8.0-windows");
        outDir = Path.Combine(root, @"docs\assets\screenshots");
        exe = Path.Combine(exeDir, "HospitalDesktop.exe");
        Directory.CreateDirectory(outDir);
        if (!File.Exists(exe)) throw new Exception("Missing HospitalDesktop.exe");

        Kill();
        var p = Start();
        WaitMain(p);
        CaptureHwnd(p.MainWindowHandle, "10-login-2.0.0.png");
        Kill();

        Login("manager", "m");
        CaptureTitle("Manager desk", "11-manager-2.0.0.png");
        Kill();

        Login("secretary", "s");
        CaptureTitle("Secretary desk", "12-secretary-2.0.0.png");
        Kill();

        Login("doctor", "d");
        CaptureTitle("Doctor desk", "13-doctor-2.0.0.png");
        Kill();

        Login("patient", "p");
        CaptureTitle("Patient portal", "14-patient-2.0.0.png");
        Kill();

        Console.WriteLine("DONE desktop 2.0.0");
        foreach (var f in Directory.GetFiles(outDir, "*2.0.0.png"))
            Console.WriteLine(Path.GetFileName(f) + " " + new FileInfo(f).Length);
    }

    static void Kill()
    {
        foreach (var name in new[] { "HospitalDesktop" })
        {
            foreach (var p in Process.GetProcessesByName(name))
            {
                try { p.Kill(); p.WaitForExit(3000); } catch { }
            }
        }
        Thread.Sleep(800);
    }

    static Process Start()
    {
        var psi = new ProcessStartInfo(exe) { WorkingDirectory = exeDir, UseShellExecute = true };
        return Process.Start(psi);
    }

    static AutomationElement WaitMain(Process p, int timeoutMs = 25000)
    {
        var sw = Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            p.Refresh();
            if (p.MainWindowHandle != IntPtr.Zero)
                return AutomationElement.FromHandle(p.MainWindowHandle);
            Thread.Sleep(300);
        }
        throw new Exception("main window timeout");
    }

    static void CaptureHwnd(IntPtr hwnd, string file)
    {
        SetForegroundWindow(hwnd);
        Thread.Sleep(500);
        RECT r;
        GetWindowRect(hwnd, out r);
        int w = r.Right - r.Left, h = r.Bottom - r.Top;
        if (w < 20 || h < 20) throw new Exception("bad size " + w + "x" + h);
        using (var bmp = new Bitmap(w, h))
        using (var g = Graphics.FromImage(bmp))
        {
            IntPtr hdc = g.GetHdc();
            bool ok = PrintWindow(hwnd, hdc, 2);
            g.ReleaseHdc(hdc);
            if (!ok)
                g.CopyFromScreen(r.Left, r.Top, 0, 0, new Size(w, h));
            bmp.Save(Path.Combine(outDir, file), ImageFormat.Png);
            Console.WriteLine("wrote " + file + " " + w + "x" + h);
        }
    }

    static AutomationElement FindWindow(string needle, int timeoutMs = 20000)
    {
        var sw = Stopwatch.StartNew();
        var cond = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Window);
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            foreach (AutomationElement w in AutomationElement.RootElement.FindAll(TreeScope.Children, cond))
            {
                string n = w.Current.Name;
                if (!string.IsNullOrEmpty(n) && n.IndexOf(needle, StringComparison.OrdinalIgnoreCase) >= 0)
                    return w;
            }
            Thread.Sleep(300);
        }
        throw new Exception("window not found: " + needle);
    }

    static AutomationElement CaptureTitle(string needle, string file)
    {
        var w = FindWindow(needle);
        CaptureHwnd(new IntPtr(w.Current.NativeWindowHandle), file);
        return w;
    }

    static void Login(string user, string pass)
    {
        Kill();
        var p = Start();
        var rootEl = WaitMain(p);
        Thread.Sleep(1200);
        var edits = rootEl.FindAll(TreeScope.Descendants,
            new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit));
        Console.WriteLine("edits=" + edits.Count + " user=" + user);
        if (edits.Count < 1) throw new Exception("no edits");

        // Username TextBox + PasswordBox (PasswordBox is often not Edit)
        ((ValuePattern)edits[0].GetCurrentPattern(ValuePattern.Pattern)).SetValue(user);
        edits[0].SetFocus();
        Thread.Sleep(200);
        SendKeys.SendWait("{TAB}");
        Thread.Sleep(200);
        SendKeys.SendWait("^a");
        SendKeys.SendWait(pass);

        var btn = FindNamed(rootEl, 8000, "Sign in");
        if (btn == null) throw new Exception("Sign in button missing");
        Click(btn);
        Thread.Sleep(2500);
    }

    static AutomationElement FindNamed(AutomationElement rootEl, int timeoutMs, params string[] names)
    {
        var sw = Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            foreach (var name in names)
            {
                var cond = new PropertyCondition(AutomationElement.NameProperty, name);
                var el = rootEl.FindFirst(TreeScope.Descendants, cond);
                if (el != null) return el;
            }
            Thread.Sleep(200);
        }
        return null;
    }

    static void Click(AutomationElement el)
    {
        try
        {
            ((InvokePattern)el.GetCurrentPattern(InvokePattern.Pattern)).Invoke();
            return;
        }
        catch { }
        var r = el.Current.BoundingRectangle;
        Cursor.Position = new Point((int)(r.X + r.Width / 2), (int)(r.Y + r.Height / 2));
        Thread.Sleep(150);
        mouse_event(LEFTDOWN, 0, 0, 0, 0);
        mouse_event(LEFTUP, 0, 0, 0, 0);
    }
}
