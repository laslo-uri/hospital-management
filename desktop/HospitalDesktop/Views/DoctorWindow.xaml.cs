using System.Windows;
using System.Windows.Controls;
using HospitalDesktop.Domain;
using HospitalDesktop.I18n;
using HospitalDesktop.Ui;

namespace HospitalDesktop.Views;

public partial class DoctorWindow : Window
{
    readonly User _user;

    public DoctorWindow(User user)
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
        Title = Loc.T("doctorDesk");
        Caption.Title = Loc.T("doctorDesk");
        MenuTitle.Text = Loc.T("mainMenu");
        UserLabel.Text = $"{_user.DisplayName} · {_user.Specialty ?? "—"}";
    }

    void Caption_CloseRequested(object sender, RoutedEventArgs e) => SignOut_Click(sender, e);

    void ShowCalendar_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 0;
    void ShowRecords_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 1;
    void ShowRx_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 2;
    void ShowReview_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 3;
    void ShowStay_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 4;

    void Reload()
    {
        ApptGrid.ItemsSource = App.Services.ListAppointments(doctor: _user.Username);
        var patients = App.Services.UsersByRole(Role.Patient);
        RxPatient.ItemsSource = patients;
        RecPatient.ItemsSource = patients;
        StayPatient.ItemsSource = patients;
        RefPatient.ItemsSource = patients;
        if (patients.Count > 0)
        {
            RxPatient.SelectedIndex = 0;
            RecPatient.SelectedIndex = 0;
            StayPatient.SelectedIndex = 0;
            RefPatient.SelectedIndex = 0;
        }
        var meds = App.Services.ListMedicines().Where(m => m.Status == "APPROVED").ToList();
        RxMedicine.ItemsSource = meds;
        if (meds.Count > 0) RxMedicine.SelectedIndex = 0;
        MedGrid.ItemsSource = App.Services.ListMedicines().Where(m => m.Status == "PENDING_REVIEW").ToList();
        RxGrid.ItemsSource = App.Services.ListPrescriptions();
        var wards = App.Services.ListRooms().Where(r => r.Type == "WARD").ToList();
        StayRoom.ItemsSource = wards.Count > 0 ? wards : App.Services.ListRooms();
        if (StayRoom.Items.Count > 0) StayRoom.SelectedIndex = 0;
        StayGrid.ItemsSource = App.Services.ListHospitalizations();
        var peers = App.Services.UsersByRole(Role.Doctor).Where(d => d.Username != _user.Username).ToList();
        RefTo.ItemsSource = peers;
        if (peers.Count > 0) RefTo.SelectedIndex = 0;
        RefGrid.ItemsSource = App.Services.ListReferrals(_user.Username);
    }

    void Admit_Click(object sender, RoutedEventArgs e)
    {
        if (StayPatient.SelectedItem is not User p || StayRoom.SelectedItem is not Room room)
        {
            StayMsg.Text = "Pick patient and room.";
            return;
        }
        var err = App.Services.AdmitPatient(p.Username, room.Id, StayReason.Text.Trim());
        StayMsg.Text = err ?? "Admitted.";
        if (err is null) Reload();
    }

    void Discharge_Click(object sender, RoutedEventArgs e)
    {
        if (StayGrid.SelectedItem is Hospitalization h)
        {
            App.Services.DischargePatient(h.Id);
            Reload();
        }
    }

    void Refer_Click(object sender, RoutedEventArgs e)
    {
        if (RefPatient.SelectedItem is not User p || RefTo.SelectedItem is not User to)
        {
            StayMsg.Text = "Pick patient and target doctor.";
            return;
        }
        var err = App.Services.CreateReferral(p.Username, _user.Username, to.Username, RefReason.Text.Trim());
        StayMsg.Text = err ?? "Referral created.";
        if (err is null) Reload();
    }

    void Complete_Click(object sender, RoutedEventArgs e)
    {
        if (ApptGrid.SelectedItem is not Appointment a) return;
        App.Services.CompleteAppointment(a.Id, AnamnesisBox.Text.Trim());
        Msg.Text = "Completed.";
        Reload();
    }

    void Cancel_Click(object sender, RoutedEventArgs e)
    {
        if (ApptGrid.SelectedItem is Appointment a) App.Services.CancelAppointment(a.Id);
        Reload();
    }

    void IssueRx_Click(object sender, RoutedEventArgs e)
    {
        if (RxPatient.SelectedItem is not User p || RxMedicine.SelectedItem is not Medicine m) return;
        App.Services.IssuePrescription(p.Username, _user.Username, m.Id, RxDosage.Text.Trim(), "");
        Reload();
    }

    void Approve_Click(object sender, RoutedEventArgs e)
    {
        if (MedGrid.SelectedItem is Medicine m) App.Services.ReviewMedicine(m.Id, true);
        Reload();
    }

    void Reject_Click(object sender, RoutedEventArgs e)
    {
        if (MedGrid.SelectedItem is Medicine m) App.Services.ReviewMedicine(m.Id, false);
        Reload();
    }

    void RecPatient_Changed(object sender, SelectionChangedEventArgs e)
    {
        if (RecPatient.SelectedItem is User p)
            RecSummary.Text = App.Services.GetRecordSummary(p.Username);
    }

    void SaveRec_Click(object sender, RoutedEventArgs e)
    {
        if (RecPatient.SelectedItem is not User p) return;
        App.Services.SaveRecordSummary(p.Username, RecSummary.Text);
    }

    void SignOut_Click(object sender, RoutedEventArgs e)
    {
        new LoginWindow().Show();
        Close();
    }
}
