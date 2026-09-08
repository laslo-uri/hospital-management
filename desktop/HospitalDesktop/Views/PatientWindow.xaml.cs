using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using HospitalDesktop.Domain;
using HospitalDesktop.I18n;
using HospitalDesktop.Ui;

namespace HospitalDesktop.Views;

public partial class PatientWindow : Window
{
    readonly User _user;

    public PatientWindow(User user)
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
        Title = Loc.T("patientPortal");
        Caption.Title = Loc.T("patientPortal");
        DeskTitle.Text = Loc.T("patientPortal");
        SignOutBtn.Content = Loc.T("signOut");
        Reload();
    }

    void Caption_CloseRequested(object sender, RoutedEventArgs e) => SignOut_Click(sender, e);

    void Reload()
    {
        _user.SpamScore = App.Services.GetUser(_user.Username)?.SpamScore ?? _user.SpamScore;
        _user.SuspendedUntil = App.Services.GetUser(_user.Username)?.SuspendedUntil;
        UserLabel.Text = $"{_user.DisplayName} · {Loc.T("spamScore")} {_user.SpamScore}" +
            (_user.SuspendedUntil is not null ? $" · {Loc.T("suspendedUntil")} {_user.SuspendedUntil}" : "");
        ApptGrid.ItemsSource = App.Services.ListAppointments(patient: _user.Username);
        var doctors = App.Services.UsersByRole(Role.Doctor);
        DoctorBox.ItemsSource = doctors;
        if (doctors.Count > 0) DoctorBox.SelectedIndex = 0;
        SummaryText.Text = App.Services.GetRecordSummary(_user.Username);
        RxGrid.ItemsSource = App.Services.ListPrescriptions(_user.Username);
        AnnGrid.ItemsSource = App.Services.ListAnnouncements();
        RemGrid.ItemsSource = App.Services.ListReminders(_user.Username);
        NotifGrid.ItemsSource = App.Services.ListNotifications(_user.Username);
    }

    void Book_Click(object sender, RoutedEventArgs e)
    {
        if (DoctorBox.SelectedItem is not User doctor)
        {
            Msg.Text = "Pick a doctor.";
            return;
        }
        if (!DateTime.TryParse(StartBox.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var start) ||
            !DateTime.TryParse(EndBox.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var end))
        {
            Msg.Text = "Use times like 2026-09-09 09:00";
            return;
        }
        var err = App.Services.BookAppointment("EXAM", doctor.Username, _user.Username, start, end, "Self-booked", _user.Username);
        Msg.Text = err ?? "Booked.";
        Msg.Foreground = err is null
            ? System.Windows.Media.Brushes.DarkGreen
            : System.Windows.Media.Brushes.DarkRed;
        Reload();
    }

    void Cancel_Click(object sender, RoutedEventArgs e)
    {
        if (ApptGrid.SelectedItem is Appointment a) App.Services.CancelAppointment(a.Id);
        Reload();
    }

    void Reschedule_Click(object sender, RoutedEventArgs e)
    {
        if (ApptGrid.SelectedItem is not Appointment a)
        {
            Msg.Text = "Select an appointment.";
            return;
        }
        if (!DateTime.TryParse(RescheduleStart.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var start) ||
            !DateTime.TryParse(RescheduleEnd.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var end))
        {
            Msg.Text = "Use times like 2026-09-10 09:00";
            return;
        }
        var err = App.Services.RescheduleAppointment(a.Id, start, end, _user.Username);
        Msg.Text = err ?? "Rescheduled.";
        Msg.Foreground = err is null
            ? System.Windows.Media.Brushes.DarkGreen
            : System.Windows.Media.Brushes.DarkRed;
        Reload();
    }

    void AddReminder_Click(object sender, RoutedEventArgs e)
    {
        if (!DateTime.TryParse(RemWhen.Text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var when))
        {
            Msg.Text = "Check reminder time.";
            return;
        }
        App.Services.AddReminder(_user.Username, RemMed.Text.Trim(), when, RemNote.Text.Trim());
        Reload();
    }

    void Survey_Click(object sender, RoutedEventArgs e)
    {
        var target = (SurveyTarget.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "HOSPITAL";
        var ratingText = (SurveyRating.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "5";
        _ = int.TryParse(ratingText, out var rating);
        App.Services.SubmitSurvey(_user.Username, target, SurveyId.Text.Trim(), rating, SurveyComment.Text.Trim());
        Msg.Text = "Survey submitted.";
        Msg.Foreground = System.Windows.Media.Brushes.DarkGreen;
    }

    void MarkRead_Click(object sender, RoutedEventArgs e)
    {
        if (NotifGrid.SelectedItem is Notification n)
            App.Services.MarkNotificationRead(n.Id);
        Reload();
    }

    void SignOut_Click(object sender, RoutedEventArgs e)
    {
        new LoginWindow().Show();
        Close();
    }
}
