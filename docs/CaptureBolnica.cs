// Capture Bolnica 1.0.0 UI screenshots for the technical dossier.
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Automation;
using System.Windows.Forms;

class CaptureBolnica
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
        exeDir = Path.Combine(root, @"_legacy-1.0.0\BolnicaProjekat\Bolnica\bin\Debug");
        outDir = Path.Combine(root, @"docs\assets\screenshots");
        exe = Path.Combine(exeDir, "Bolnica.exe");
        Directory.CreateDirectory(outDir);
        if (!File.Exists(exe)) throw new Exception("Missing Bolnica.exe");

        Kill();
        var p = Start();
        WaitMain(p);
        CaptureHwnd(p.MainWindowHandle, "00-login.png");
        Kill();

        Login("LasloUri", "laci");
        var home = CaptureTitle("LekarHome", "01-lekar-home.png");
        ClickNamed(home, "Radni kalendar", "Radni Kalendar");
        Thread.Sleep(1000);
        CaptureTitle("LekarHome", "02-lekar-calendar.png");
        ClickNamed(home, "Lekovi");
        Thread.Sleep(1000);
        CaptureTitle("LekarHome", "03-lekar-recept.png");
        Kill();

        Login("mihajloostojic", "sifra");
        home = CaptureTitle("Sekretar", "04-sekretar-home.png");
        if (!ClickNamed(home, "Termini", "Zakazi termin", "Zakaži termin"))
            File.Copy(Path.Combine(outDir, "04-sekretar-home.png"), Path.Combine(outDir, "05-sekretar-schedule.png"), true);
        else
        {
            Thread.Sleep(1000);
            CaptureTitle("Sekretar", "05-sekretar-schedule.png");
        }
        Kill();

        Login("rastislavkukucka", "sifra");
        home = CaptureTitle("Upravnik", "06-upravnik-home.png");
        if (!ClickNamed(home, "Prostorije"))
            File.Copy(Path.Combine(outDir, "06-upravnik-home.png"), Path.Combine(outDir, "07-upravnik-rooms.png"), true);
        else
        {
            Thread.Sleep(1000);
            CaptureTitle("Upravnik", "07-upravnik-rooms.png");
        }
        Kill();

        Login("peraperic", "pera");
        home = CaptureTitle("Pacijent", "08-pacijent-home.png");
        if (!ClickNamed(home, "Termini", "Zakazani"))
            File.Copy(Path.Combine(outDir, "08-pacijent-home.png"), Path.Combine(outDir, "09-pacijent-termini.png"), true);
        else
        {
            Thread.Sleep(1000);
            CaptureTitle("Pacijent", "09-pacijent-termini.png");
        }
        Kill();

        Console.WriteLine("DONE");
        foreach (var f in Directory.GetFiles(outDir, "*.png"))
            Console.WriteLine(Path.GetFileName(f) + " " + new FileInfo(f).Length);
    }

    static void Kill()
    {
        foreach (var p in Process.GetProcessesByName("Bolnica"))
        {
            try { p.Kill(); p.WaitForExit(3000); } catch { }
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
        Thread.Sleep(400);
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
            string path = Path.Combine(outDir, file);
            bmp.Save(path, ImageFormat.Png);
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
        var root = WaitMain(p);
        Thread.Sleep(1000);
        var edits = root.FindAll(TreeScope.Descendants,
            new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit));
        Console.WriteLine("edits=" + edits.Count + " user=" + user);
        if (edits.Count < 1) throw new Exception("no edits");
        ((ValuePattern)edits[0].GetCurrentPattern(ValuePattern.Pattern)).SetValue(user);
        if (edits.Count >= 2)
            ((ValuePattern)edits[1].GetCurrentPattern(ValuePattern.Pattern)).SetValue(pass);
        else
        {
            edits[0].SetFocus();
            Thread.Sleep(200);
            SendKeys.SendWait("{TAB}");
            Thread.Sleep(200);
            SendKeys.SendWait(pass);
        }
        var btn = FindNamed(root, 8000, "Prijavi se");
        if (btn == null) throw new Exception("login button missing");
        Click(btn);
        Thread.Sleep(2000);
    }

    static AutomationElement FindNamed(AutomationElement root, int timeoutMs, params string[] names)
    {
        var sw = Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            foreach (var name in names)
            {
                var cond = new PropertyCondition(AutomationElement.NameProperty, name);
                var el = root.FindFirst(TreeScope.Descendants, cond);
                if (el != null) return el;
            }
            Thread.Sleep(200);
        }
        return null;
    }

    static bool ClickNamed(AutomationElement root, params string[] names)
    {
        var el = FindNamed(root, 5000, names);
        if (el == null) { Console.WriteLine("not found: " + string.Join("|", names)); return false; }
        Click(el);
        return true;
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
