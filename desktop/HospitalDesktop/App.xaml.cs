using System.Windows;
using HospitalDesktop.Data;
using HospitalDesktop.Services;
using HospitalDesktop.Views;

namespace HospitalDesktop;

public partial class App : Application
{
    public static HospitalServices Services { get; private set; } = null!;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        var db = HospitalDb.OpenDefault();
        Services = new HospitalServices(db);

        if (e.Args.Any(a => a is "--smoke" or "/smoke"))
        {
            ShutdownMode = ShutdownMode.OnExplicitShutdown;
            var code = SmokeRunner.Run(Services);
            Shutdown(code);
            return;
        }

        new LoginWindow().Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        Services.Db.Dispose();
        base.OnExit(e);
    }
}
