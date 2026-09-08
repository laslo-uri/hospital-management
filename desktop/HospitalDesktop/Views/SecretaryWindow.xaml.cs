using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using HospitalDesktop.Domain;
using HospitalDesktop.I18n;
using HospitalDesktop.Ui;

namespace HospitalDesktop.Views;

public partial class SecretaryWindow : Window
{
    readonly User _user;

    public SecretaryWindow(User user)
    {
        _user = user;
        InitializeComponent();
        Frameless.Apply(this);
        ApplyLanguage();
        Loc.Changed += ApplyLanguage;
        Closed += (_, _) => Loc.Changed -= ApplyLanguage;
        Reload();
    }

    void ApplyLanguage()
    {
        Title = Loc.T("secretaryDesk");
        Caption.Title = Loc.T("secretaryDesk");
        DeskTitle.Text = Loc.T("secretaryDesk");
        UserLabel.Text = $"{_user.DisplayName} · {Loc.T("roleSecretary")}";
        SignOutBtn.Content = Loc.T("signOut");
    }

    void Caption_CloseRequested(object sender, RoutedEventArgs e) => SignOut_Click(sender, e);

    void Reload()
    {
        var doctors = App.Services.UsersByRole(Role.Doctor);
        var patients = App.Services.UsersByRole(Role.Patient);
        DoctorBox.ItemsSource = doctors;
        PatientBox.ItemsSource = patients;
        RecordPatient.ItemsSource = patients;
        if (doctors.Count > 0) DoctorBox.SelectedIndex = 0;
        if (patients.Count > 0)
        {
            PatientBox.SelectedIndex = 0;
            RecordPatient.SelectedIndex = 0;
        }
        ApptGrid.ItemsSource = App.Services.ListAppointments();
        VacDoctor.ItemsSource = doctors;
        if (doctors.Count > 0) VacDoctor.SelectedIndex = 0;
        VacGrid.ItemsSource = App.Services.ListVacations();
    }

    void VacSchedule_Click(object sender, RoutedEventArgs e)
    {
        if (VacDoctor.SelectedItem is not User doctor)
        {
            VacMsg.Text = "Pick a doctor.";
            return;
        }
        if (!DateTime.TryParse(VacStart.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var start) ||
            !DateTime.TryParse(VacEnd.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var end))
        {
            VacMsg.Text = "Use times like 2026-09-20 00:00";
            return;
        }
        var err = App.Services.ScheduleVacation(doctor.Username, start, end, VacNote.Text.Trim(), _user.Username);
        VacMsg.Text = err ?? "Vacation scheduled.";
        if (err is null) Reload();
    }

    void VacCancel_Click(object sender, RoutedEventArgs e)
    {
        if (VacGrid.SelectedItem is Vacation v)
        {
            App.Services.CancelVacation(v.Id);
            Reload();
        }
    }

    void Book_Click(object sender, RoutedEventArgs e)
    {
        if (DoctorBox.SelectedItem is not User doctor || PatientBox.SelectedItem is not User patient)
        {
            Msg.Text = "Pick doctor and patient.";
            return;
        }
        if (!DateTime.TryParse(StartBox.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var start) ||
            !DateTime.TryParse(EndBox.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var end))
        {
            Msg.Text = "Use times like 2026-09-07 14:00";
            return;
        }
        var type = (TypeBox.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "EXAM";
        var err = App.Services.BookAppointment(type, doctor.Username, patient.Username, start, end, "", _user.Username);
        Msg.Text = err ?? "Booked.";
        if (err is null) Msg.Foreground = System.Windows.Media.Brushes.DarkGreen;
        else Msg.Foreground = System.Windows.Media.Brushes.DarkRed;
        Reload();
    }

    void Cancel_Click(object sender, RoutedEventArgs e)
    {
        if (ApptGrid.SelectedItem is Appointment a)
        {
            App.Services.CancelAppointment(a.Id);
            Reload();
        }
    }

    void Register_Click(object sender, RoutedEventArgs e)
    {
        var err = App.Services.RegisterPatient(RegUser.Text.Trim(), RegPass.Text.Trim(), RegFirst.Text.Trim(), RegLast.Text.Trim());
        RegMsg.Text = err ?? "Patient registered.";
        if (err is null) Reload();
    }

    void RecordPatient_Changed(object sender, SelectionChangedEventArgs e)
    {
        if (RecordPatient.SelectedItem is User p)
            RecordSummary.Text = App.Services.GetRecordSummary(p.Username);
    }

    void SaveRecord_Click(object sender, RoutedEventArgs e)
    {
        if (RecordPatient.SelectedItem is not User p) return;
        App.Services.SaveRecordSummary(p.Username, RecordSummary.Text);
        Msg.Text = "Record saved.";
    }

    void SignOut_Click(object sender, RoutedEventArgs e)
    {
        new LoginWindow().Show();
        Close();
    }
}
