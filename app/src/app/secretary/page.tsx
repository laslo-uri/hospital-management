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
import { fullName } from "@/lib/utils";
import { createAnnouncement } from "@/server/actions/comms";
import {
  cancelAppointment,
  createAppointment,
} from "@/server/actions/appointments";
import {
  cancelVacation,
  registerPatient,
  scheduleVacation,
} from "@/server/actions/clinical";
import { getCurrentUser } from "@/server/auth";
import {
  listAnnouncements,
  listAppointmentsForUser,
  listDoctors,
  listPatients,
  listRooms,
  listVacations,
} from "@/server/queries";

export default async function SecretaryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SECRETARY") redirect("/");

  const locale = await getLocale();
  const tr = (key: Parameters<typeof translate>[1], vars?: Record<string, string>) =>
    translate(locale, key, vars);

  const doctors = listDoctors();
  const patients = listPatients();
  const roomRows = listRooms();
  const appts = listAppointmentsForUser(user.username, "SECRETARY");
  const posts = listAnnouncements();
  const vacationRows = listVacations();

  return (
    <DeskShell user={user}>
      <PageHeader
        title={tr("secretaryDeskTitle")}
        body={tr("secretaryDeskBody")}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={tr("scheduleAppointment")}>
          <ActionForm
            action={createAppointment}
            className="grid gap-3 sm:grid-cols-2"
            successMessage={tr("scheduled")}
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
                </option>
              ))}
            </SelectField>
            <SelectField label={tr("patient")} name="patientUsername">
              {patients.map((p) => (
                <option key={p.username} value={p.username}>
                  {fullName(p.firstName, p.lastName)}
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
            <Field label={tr("startsAt")} name="startsAt" type="datetime-local" required />
            <Field label={tr("endsAt")} name="endsAt" type="datetime-local" required />
            <div className="sm:col-span-2">
              <TextareaField label={tr("notes")} name="notes" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">{tr("createAppointment")}</Button>
            </div>
          </ActionForm>
        </Card>

        <Card title={tr("registerPatient")}>
          <ActionForm
            action={registerPatient}
            className="grid gap-3 sm:grid-cols-2"
            successMessage={tr("patientRegistered")}
          >
            <Field label={tr("username")} name="username" required />
            <Field label={tr("password")} name="password" type="password" required />
            <Field label={tr("firstName")} name="firstName" required />
            <Field label={tr("lastName")} name="lastName" required />
            <Field label={tr("email")} name="email" type="email" />
            <Field label={tr("phone")} name="phone" />
            <div className="sm:col-span-2">
              <Button type="submit">{tr("registerPatient")}</Button>
            </div>
          </ActionForm>
        </Card>

        <Card title={tr("patients")}>
          <Table headers={[tr("username"), tr("name"), tr("email"), tr("phone")]}>
            {patients.map((p) => (
              <tr key={p.username}>
                <td className="px-3 py-2 font-mono text-xs">{p.username}</td>
                <td className="px-3 py-2">
                  {fullName(p.firstName, p.lastName)}
                </td>
                <td className="px-3 py-2 text-xs">{p.email}</td>
                <td className="px-3 py-2 text-xs">{p.phone}</td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title={tr("vacations")}>
          <ActionForm
            action={scheduleVacation}
            className="mb-4 grid gap-3 sm:grid-cols-2"
            successMessage={tr("vacationScheduled")}
          >
            <SelectField label={tr("doctor")} name="doctorUsername">
              {doctors.map((d) => (
                <option key={d.username} value={d.username}>
                  {fullName(d.firstName, d.lastName)}
                </option>
              ))}
            </SelectField>
            <Field label={tr("note")} name="note" />
            <Field label={tr("startsAt")} name="startsAt" type="datetime-local" required />
            <Field label={tr("endsAt")} name="endsAt" type="datetime-local" required />
            <div className="sm:col-span-2">
              <Button type="submit">{tr("scheduleVacation")}</Button>
            </div>
          </ActionForm>
          <Table
            headers={[
              tr("doctor"),
              tr("startsAt"),
              tr("endsAt"),
              tr("status"),
              tr("action"),
            ]}
          >
            {vacationRows.map((v) => (
              <tr key={v.id}>
                <td className="px-3 py-2 text-xs">{v.doctorUsername}</td>
                <td className="px-3 py-2 text-xs">{v.startsAt}</td>
                <td className="px-3 py-2 text-xs">{v.endsAt}</td>
                <td className="px-3 py-2">
                  <Badge tone={v.status === "SCHEDULED" ? "teal" : "danger"}>
                    {v.status}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {v.status === "SCHEDULED" ? (
                    <ActionForm
                      action={cancelVacation}
                      successMessage={tr("vacationCancelled")}
                    >
                      <input type="hidden" name="id" value={v.id} />
                      <Button type="submit" variant="ghost" className="!px-2 !py-1 text-xs">
                        {tr("cancelVacation")}
                      </Button>
                    </ActionForm>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title={tr("appointments")} className="xl:col-span-2">
          <Table
            headers={[
              tr("when"),
              tr("type"),
              tr("doctor"),
              tr("patient"),
              tr("status"),
              tr("action"),
            ]}
          >
            {appts.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 text-xs">
                  {a.startsAt} → {a.endsAt}
                </td>
                <td className="px-3 py-2">{a.type}</td>
                <td className="px-3 py-2">{a.doctorUsername}</td>
                <td className="px-3 py-2">{a.patientUsername}</td>
                <td className="px-3 py-2">
                  <Badge
                    tone={
                      a.status === "SCHEDULED"
                        ? "teal"
                        : a.status === "CANCELLED"
                          ? "danger"
                          : "success"
                    }
                  >
                    {a.status}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {a.status === "SCHEDULED" || a.status === "RESCHEDULED" ? (
                    <ActionForm action={cancelAppointment}>
                      <input type="hidden" name="id" value={a.id} />
                      <Button type="submit" variant="ghost" className="!px-2 !py-1 text-xs">
                        {tr("cancel")}
                      </Button>
                    </ActionForm>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title={tr("announcements")} className="xl:col-span-2">
          <ActionForm
            action={createAnnouncement}
            className="mb-4 grid gap-3"
            successMessage={tr("posted")}
          >
            <Field label={tr("title")} name="title" required />
            <TextareaField label={tr("body")} name="body" required />
            <Button type="submit">{tr("postAnnouncement")}</Button>
          </ActionForm>
          <Table headers={[tr("title"), tr("author"), tr("created")]}>
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-xs text-muted">{p.body}</p>
                </td>
                <td className="px-3 py-2 text-xs">{p.authorUsername}</td>
                <td className="px-3 py-2 text-xs">{p.createdAt}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </DeskShell>
  );
}
