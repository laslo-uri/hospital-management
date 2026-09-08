using System.Windows;
using System.Windows.Input;
using HospitalDesktop.Domain;
using HospitalDesktop.I18n;
using HospitalDesktop.Ui;

namespace HospitalDesktop.Views;

public partial class LoginWindow : Window
{
    public LoginWindow()
    {
        InitializeComponent();
        Frameless.Apply(this, canResize: false);
        PasswordBox.Password = "d";
        UsernameBox.KeyDown += (_, e) => { if (e.Key == Key.Enter) SignIn_Click(null!, null!); };
        PasswordBox.KeyDown += (_, e) => { if (e.Key == Key.Enter) SignIn_Click(null!, null!); };
        ApplyLanguage();
        Loc.Changed += ApplyLanguage;
        Closed += (_, _) => Loc.Changed -= ApplyLanguage;
    }

    void ApplyLanguage()
    {
        Title = Loc.T("appTitle");
        Caption.Title = Loc.T("appTitle");
        TitleText.Text = Loc.T("appTitle");
        VersionText.Text = Loc.T("desktopVersion");
        UsernameLabel.Text = Loc.T("username");
        PasswordLabel.Text = Loc.T("password");
        SignInText.Text = Loc.T("signIn");
        DemoHint.Text = Loc.T("demoHint");
    }

    void Caption_CloseRequested(object sender, RoutedEventArgs e) => Application.Current.Shutdown();

    void SignIn_Click(object sender, RoutedEventArgs e)
    {
        ErrorText.Text = "";
        var user = App.Services.Authenticate(UsernameBox.Text.Trim(), PasswordBox.Password);
        if (user is null)
        {
            ErrorText.Text = Loc.T("invalidCredentials");
            return;
        }

        Window next = user.Role switch
        {
            Role.Manager => new ManagerWindow(user),
            Role.Secretary => new SecretaryWindow(user),
            Role.Doctor => new DoctorWindow(user),
            Role.Patient => new PatientWindow(user),
            _ => throw new InvalidOperationException()
        };
        next.Show();
        Close();
    }
}
