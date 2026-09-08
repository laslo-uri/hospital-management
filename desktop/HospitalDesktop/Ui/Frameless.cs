using System.Windows;
using System.Windows.Shell;

namespace HospitalDesktop.Ui;

public static class Frameless
{
    public static void Apply(Window window, bool canResize = true)
    {
        window.WindowStyle = WindowStyle.None;
        window.ResizeMode = canResize ? ResizeMode.CanResize : ResizeMode.NoResize;
        WindowChrome.SetWindowChrome(window, new WindowChrome
        {
            CaptionHeight = 36,
            ResizeBorderThickness = canResize ? new Thickness(6) : new Thickness(0),
            GlassFrameThickness = new Thickness(0),
            CornerRadius = new CornerRadius(0),
            UseAeroCaptionButtons = false,
        });
    }
}
