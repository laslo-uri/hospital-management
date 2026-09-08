using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using HospitalDesktop.Domain;
using HospitalDesktop.I18n;
using HospitalDesktop.Ui;

namespace HospitalDesktop.Views;

public partial class ManagerWindow : Window
{
    readonly User _user;

    public ManagerWindow(User user)
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
        Title = Loc.T("managerDesk");
        Caption.Title = Loc.T("managerDesk");
        DeskTitle.Text = Loc.T("managerDesk");
        UserLabel.Text = $"{_user.DisplayName}\n{Loc.T("roleManager")}";
        NavRooms.Content = Loc.T("rooms");
        NavInventory.Content = Loc.T("inventory");
        NavJobs.Content = Loc.T("jobsTransfers");
        NavMeds.Content = Loc.T("medicines");
        NavAnn.Content = Loc.T("announcements");
        SignOutBtn.Content = Loc.T("signOut");
        TabRooms.Header = Loc.T("rooms");
        TabInventory.Header = Loc.T("inventory");
        TabJobs.Header = Loc.T("jobsTransfers");
        TabMedicines.Header = Loc.T("medicines");
        TabAnnouncements.Header = Loc.T("announcements");
        AddRoomBtn.Content = Loc.T("addRoom");
        ApproveMedBtn.Content = Loc.T("approveSelected");
        RejectMedBtn.Content = Loc.T("rejectSelected");
        PostAnnBtn.Content = Loc.T("postAnnouncement");
        ScheduleXferBtn.Content = Loc.T("scheduleTransfer");
        ScheduleJobBtn.Content = Loc.T("scheduleJob");
    }

    void Caption_CloseRequested(object sender, RoutedEventArgs e) => SignOut_Click(sender, e);

    void NavRooms_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 0;
    void NavInventory_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 1;
    void NavJobs_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 2;
    void NavMeds_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 3;
    void NavAnn_Click(object sender, RoutedEventArgs e) => Tabs.SelectedIndex = 4;

    void Reload()
    {
        var rooms = App.Services.ListRooms();
        RoomsGrid.ItemsSource = rooms;
        InventoryGrid.ItemsSource = App.Services.ListInventory();
        MedicinesGrid.ItemsSource = App.Services.ListMedicines();
        AnnGrid.ItemsSource = App.Services.ListAnnouncements();
        XferFrom.ItemsSource = rooms;
        XferTo.ItemsSource = rooms;
        JobRoom.ItemsSource = rooms;
        if (rooms.Count > 0)
        {
            XferFrom.SelectedIndex = 0;
            XferTo.SelectedIndex = Math.Min(1, rooms.Count - 1);
            JobRoom.SelectedIndex = 0;
        }
        XferGrid.ItemsSource = App.Services.ListPendingTransfers();
        JobsGrid.ItemsSource = App.Services.ListPendingRoomJobs();
    }

    void AddRoom_Click(object sender, RoutedEventArgs e)
    {
        var type = (RoomType.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "EXAM";
        if (!int.TryParse(RoomFloor.Text, out var floor) || !int.TryParse(RoomArea.Text, out var area))
        {
            RoomMsg.Text = "Floor and area must be numbers.";
            return;
        }
        var err = App.Services.AddRoom(RoomCode.Text.Trim(), RoomName.Text.Trim(), type, floor, area);
        RoomMsg.Text = err ?? "";
        if (err is null) Reload();
    }

    void ScheduleXfer_Click(object sender, RoutedEventArgs e)
    {
        if (XferFrom.SelectedItem is not Room from || XferTo.SelectedItem is not Room to)
        {
            JobsMsg.Text = "Pick rooms.";
            return;
        }
        if (!int.TryParse(XferQty.Text, out var qty) ||
            !DateTime.TryParse(XferWhen.Text, CultureInfo.CurrentCulture, DateTimeStyles.AssumeLocal, out var when))
        {
            JobsMsg.Text = "Check quantity and time.";
            return;
        }
        var err = App.Services.ScheduleTransfer(from.Id, to.Id, XferItem.Text.Trim(), qty, when, _user.Username);
        JobsMsg.Text = err ?? "";
        if (err is null) Reload();
    }

    void ScheduleJob_Click(object sender, RoutedEventArgs e)
    {
        if (JobRoom.SelectedItem is not Room room)
        {
            JobsMsg.Text = "Pick a room.";
            return;
        }
        var type = (JobType.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "RENOVATION";
        if (!DateTime.TryParse(JobWhen.Text, CultureInfo.CurrentCulture, DateTimeStyles.AssumeLocal, out var when))
        {
            JobsMsg.Text = "Check apply time.";
            return;
        }
        var err = App.Services.ScheduleRoomJob(room.Id, type, JobDetails.Text.Trim(), when, _user.Username);
        JobsMsg.Text = err ?? "";
        if (err is null) Reload();
    }

    void ApproveMed_Click(object sender, RoutedEventArgs e)
    {
        if (MedicinesGrid.SelectedItem is Medicine m) App.Services.ReviewMedicine(m.Id, true);
        Reload();
    }

    void RejectMed_Click(object sender, RoutedEventArgs e)
    {
        if (MedicinesGrid.SelectedItem is Medicine m) App.Services.ReviewMedicine(m.Id, false);
        Reload();
    }

    void PostAnn_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(AnnTitle.Text) || string.IsNullOrWhiteSpace(AnnBody.Text)) return;
        App.Services.PostAnnouncement(AnnTitle.Text.Trim(), AnnBody.Text.Trim(), _user.Username);
        AnnTitle.Clear();
        AnnBody.Clear();
        Reload();
    }

    void SignOut_Click(object sender, RoutedEventArgs e)
    {
        new LoginWindow().Show();
        Close();
    }
}
