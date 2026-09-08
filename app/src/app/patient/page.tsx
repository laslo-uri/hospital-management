import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { DeskShell } from "@/components/desk-shell";
import {
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  SelectField,
  Table,
  TextareaField,
} from "@/components/ui";
import { translate } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { addHours, fullName } from "@/lib/utils";
import {
  patientBook,
  patientCancel,
  patientReschedule,
} from "@/server/actions/appointments";
import {
  createReminder,
  markNotificationRead,
  submitFeedback,
  submitSurvey,
} from "@/server/actions/comms";
import { getCurrentUser, getSeedClock } from "@/server/auth";
import {
  listAppointmentsForUser,
  listDoctors,
  listNotifications,
  listReminders,
  listRooms,
} from "@/server/queries";

export default async function PatientPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "PATIENT") redirect("/");

  const locale = await getLocale();
  const tr = (key: Parameters<typeof translate>[1], vars?: Record<string, string>) =>
    translate(locale, key, vars);

  const doctors = listDoctors();
  const roomRows = listRooms();
  const appts = listAppointmentsForUser(user.username, "PATIENT");
  const notes = listNotifications(user.username);
  const medReminders = listReminders(user.username);
  const clock = getSeedClock();
  const defaultStart = addHours(clock.toISOString(), 30).slice(0, 16);
  const defaultEnd = addHours(clock.toISOString(), 31).slice(0, 16);

  return (
    <DeskShell user={user}>
      <PageHeader title={tr("patientDeskTitle")} body={tr("patientDeskBody")} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={tr("bookAppointment")}>
          <ActionForm
            action={patientBook}
            className="grid gap-3 sm:grid-cols-2"
            successMessage={tr("booked")}
          >
            <SelectField label={tr("type")} name="type" defaultValue="EXAM">
              <option value="EXAM">EXAM</option>
              <option value="OPERATION">OPERATION</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </SelectField>
            <SelectField label={tr("doctor")} name="doctorUsername">
              {doctors.map((d) => (
                <option key={d.username} value={d.username}>
                  {fullName(d.firstName, d.lastName)}
                  {d.specialty ? ` (${d.specialty})` : ""}
                </option>
              ))}
            </SelectField>
            <SelectField label={tr("room")} name="roomId">
              <option value="">{tr("none")}</option>
              {roomRows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code}
                </option>
              ))}
            </SelectField>
            <Field
              label={tr("startsAt")}
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={defaultStart}
            />
            <Field
              label={tr("endsAt")}
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={defaultEnd}
            />
            <div className="sm:col-span-2">
              <TextareaField label={tr("notes")} name="notes" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">{tr("bookAppointment")}</Button>
            </div>
          </ActionForm>
          <p className="mt-3 text-xs text-muted">{tr("spamProtectionNote")}</p>
        </Card>

        <Card title={tr("survey")}>
          <ActionForm
            action={submitSurvey}
            className="grid gap-3"
            successMessage={tr("thanksSurvey")}
          >
            <SelectField label={tr("target")} name="targetType" defaultValue="HOSPITAL">
              <option value="HOSPITAL">HOSPITAL</option>
              <option value="DOCTOR">DOCTOR</option>
            </SelectField>
            <Field label={tr("targetId")} name="targetId" defaultValue="main" required />
            <Field
              label={tr("rating1to5")}
              name="rating"
              type="number"
              min={1}
              max={5}
              defaultValue={5}
            />
            <TextareaField label={tr("comment")} name="comment" />
            <Button type="submit">{tr("submitSurvey")}</Button>
          </ActionForm>
          <ActionForm
            action={submitFeedback}
            className="mt-6 grid gap-3 border-t border-line pt-4"
            successMessage={tr("feedbackSent")}
          >
            <TextareaField label={tr("feedbackMessage")} name="message" required />
            <Field
              label={tr("rating")}
              name="rating"
              type="number"
              min={1}
              max={5}
              defaultValue={4}
            />
            <Button type="submit" variant="secondary">
              {tr("submitFeedback")}
            </Button>
          </ActionForm>
        </Card>

        <Card title={tr("myAppointments")} className="xl:col-span-2">
          <Table
            headers={[
              tr("when"),
              tr("doctor"),
              tr("type"),
              tr("status"),
              tr("actions"),
            ]}
          >
            {appts.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 text-xs">
                  {a.startsAt} → {a.endsAt}
                </td>
                <td className="px-3 py-2">{a.doctorUsername}</td>
                <td className="px-3 py-2">{a.type}</td>
                <td className="px-3 py-2">
                  <Badge
                    tone={
                      a.status === "CANCELLED"
                        ? "danger"
                        : a.status === "COMPLETED"
                          ? "success"
                          : "teal"
                    }
                  >
                    {a.status}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {a.status === "SCHEDULED" || a.status === "RESCHEDULED" ? (
                    <div className="flex flex-col gap-2">
                      <ActionForm action={patientCancel}>
                        <input type="hidden" name="id" value={a.id} />
                        <Button type="submit" variant="ghost" className="!px-2 !py-1 text-xs">
                          {tr("cancel")}
                        </Button>
                      </ActionForm>
                      <ActionForm
                        action={patientReschedule}
                        className="flex flex-wrap gap-1"
                        successMessage={tr("rescheduled")}
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <input
                          name="startsAt"
                          type="datetime-local"
                          required
                          className="rounded border border-line bg-field px-1 py-0.5 text-xs"
                        />
                        <input
                          name="endsAt"
                          type="datetime-local"
                          required
                          className="rounded border border-line bg-field px-1 py-0.5 text-xs"
                        />
                        <Button type="submit" variant="secondary" className="!py-1 text-xs">
                          {tr("reschedule")}
                        </Button>
                      </ActionForm>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title={tr("reminders")}>
          <Table headers={[tr("medicine"), tr("remindAt"), tr("note")]}>
            {medReminders.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">{r.medicineName}</td>
                <td className="px-3 py-2 text-xs">{r.remindAt}</td>
                <td className="px-3 py-2 text-xs">{r.note}</td>
              </tr>
            ))}
          </Table>
          <ActionForm
            action={createReminder}
            className="mt-4 grid gap-3"
            successMessage={tr("reminderSet")}
          >
            <Field label={tr("medicine")} name="medicineName" required />
            <Field label={tr("remindAt")} name="remindAt" type="datetime-local" required />
            <Field label={tr("note")} name="note" />
            <Button type="submit">{tr("addReminder")}</Button>
          </ActionForm>
        </Card>

        <Card title={tr("notifications")}>
          <Table headers={[tr("title"), tr("body"), ""]}>
            {notes.map((n) => (
              <tr key={n.id} className={n.read ? "opacity-60" : undefined}>
                <td className="px-3 py-2 text-sm font-semibold">{n.title}</td>
                <td className="px-3 py-2 text-xs">{n.body}</td>
                <td className="px-3 py-2">
                  {!n.read ? (
                    <ActionForm action={markNotificationRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <Button type="submit" variant="ghost" className="!px-2 !py-1 text-xs">
                        {tr("markRead")}
                      </Button>
                    </ActionForm>
                  ) : (
                    <span className="text-xs text-muted">{tr("read")}</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </DeskShell>
  );
}
