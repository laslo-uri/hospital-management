using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Shell;

namespace HospitalDesktop.Ui;

public partial class CaptionBar : UserControl
{
    public static readonly DependencyProperty TitleProperty =
        DependencyProperty.Register(nameof(Title), typeof(string), typeof(CaptionBar),
            new PropertyMetadata(""));

    public static readonly DependencyProperty AccentBrushProperty =
        DependencyProperty.Register(nameof(AccentBrush), typeof(Brush), typeof(CaptionBar),
            new PropertyMetadata(Brushes.Transparent));

    public static readonly DependencyProperty ShowMaximizeProperty =
        DependencyProperty.Register(nameof(ShowMaximize), typeof(bool), typeof(CaptionBar),
            new PropertyMetadata(true));

    public event RoutedEventHandler? CloseRequested;

    public CaptionBar()
    {
        InitializeComponent();
        Loaded += (_, _) =>
        {
            MaxButton.Visibility = ShowMaximize ? Visibility.Visible : Visibility.Collapsed;
            WindowChrome.SetIsHitTestVisibleInChrome(MinButton, true);
            WindowChrome.SetIsHitTestVisibleInChrome(MaxButton, true);
            WindowChrome.SetIsHitTestVisibleInChrome(CloseButton, true);
        };
    }

    public string Title
    {
        get => (string)GetValue(TitleProperty);
        set => SetValue(TitleProperty, value);
    }

    public Brush AccentBrush
    {
        get => (Brush)GetValue(AccentBrushProperty);
        set => SetValue(AccentBrushProperty, value);
    }

    public bool ShowMaximize
    {
        get => (bool)GetValue(ShowMaximizeProperty);
        set => SetValue(ShowMaximizeProperty, value);
    }

    void Drag_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2 && ShowMaximize)
        {
            ToggleMaximize();
            return;
        }
        Window.GetWindow(this)?.DragMove();
    }

    void Min_Click(object sender, RoutedEventArgs e)
    {
        var w = Window.GetWindow(this);
        if (w is not null) w.WindowState = WindowState.Minimized;
    }

    void Max_Click(object sender, RoutedEventArgs e) => ToggleMaximize();

    void Close_Click(object sender, RoutedEventArgs e)
    {
        if (CloseRequested is not null)
        {
            CloseRequested(this, e);
            return;
        }
        Window.GetWindow(this)?.Close();
    }

    void ToggleMaximize()
    {
        var w = Window.GetWindow(this);
        if (w is null) return;
        w.WindowState = w.WindowState == WindowState.Maximized
            ? WindowState.Normal
            : WindowState.Maximized;
    }
}
