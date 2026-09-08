using System.Windows;
using System.Windows.Controls;
using HospitalDesktop.I18n;

namespace HospitalDesktop.Ui;

public partial class LanguageBar : UserControl
{
    public LanguageBar()
    {
        InitializeComponent();
        Loaded += (_, _) =>
        {
            LangBox.SelectedIndex = Loc.Current switch
            {
                AppLocale.Sr => 1,
                AppLocale.Hu => 2,
                _ => 0,
            };
            RefreshLabel();
            Loc.Changed += RefreshLabel;
        };
        Unloaded += (_, _) => Loc.Changed -= RefreshLabel;
    }

    void RefreshLabel()
    {
        LangLabel.Text = Loc.T("language");
    }

    void LangBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (LangBox.SelectedItem is not ComboBoxItem item) return;
        var code = item.Tag as string ?? "en";
        Loc.SetFromCode(code);
    }
}
