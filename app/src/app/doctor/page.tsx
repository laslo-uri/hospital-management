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
import {
  completeAppointment,
  createAppointment,
} from "@/server/actions/appointments";
import {
  admitPatient,
  createReferral,
  dischargePatient,
} from "@/server/actions/clinical";
import {
  createPrescription,
  reviewMedicine,
  updateRecord,
} from "@/server/actions/records";
import { getCurrentUser } from "@/server/auth";
import {
  demoDay,
  listAppointmentsForDay,
  listApprovedMedicines,
  listDoctors,
  listHospitalizations,
  listPatients,
  listPendingMedicines,
  listPrescriptionsForDoctor,
  listReferrals,
  listRooms,
  listWardRooms,
} from "@/server/queries";

export default async function DoctorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "DOCTOR") redirect("/");

  const locale = await getLocale();
  const tr = (key: Parameters<typeof translate>[1], vars?: Record<string, string>) =>
    translate(locale, key, vars);

  const today = demoDay();
  const calendar = listAppointmentsForDay(today, user.username);
  const patients = listPatients();
  const doctors = listDoctors().filter((d) => d.username !== user.username);
  const pendingMeds = listPendingMedicines();
  const approvedMeds = listApprovedMedicines();
  const scripts = listPrescriptionsForDoctor(user.username);
  const roomRows = listRooms();
  const wardRooms = listWardRooms();
  const stays = listHospitalizations();
  const referralRows = listReferrals(user.username);
  const dateLabel = today.toISOString().slice(0, 10);

  return (
    <DeskShell user={user}>
      <PageHeader
        title={tr("doctorDeskTitle")}
        body={tr("doctorDeskBody", { date: dateLabel })}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={tr("todaysCalendar")} className="xl:col-span-2">
          <Table
            headers={[
              tr("time"),
              tr("patient"),
              tr("type"),
              tr("status"),
              tr("complete"),
            ]}
          >
            {calendar.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2 text-xs">
                  {a.startsAt.slice(11, 16)}–{a.endsAt.slice(11, 16)} UTC
                </td>
                <td className="px-3 py-2">{a.patientUsername}</td>
                <td className="px-3 py-2">{a.type}</td>
                <td className="px-3 py-2">
                  <Badge tone={a.status === "COMPLETED" ? "success" : "teal"}>
                    {a.status}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {a.status === "SCHEDULED" || a.status === "RESCHEDULED" ? (
                    <ActionForm
                      action={completeAppointment}
                      className="flex flex-wrap gap-2"
                      successMessage={tr("completed")}
                    >
                      <input type="hidden" name="id" value={a.id} />
                      <input
                        name="anamnesis"
                        placeholder={tr("anamnesis")}
                        className="min-w-[10rem] flex-1 rounded border border-line bg-field px-2 py-1 text-xs"
                        required
                      />
                      <Button type="submit" className="!py-1 text-xs">
                        {tr("completeVisit")}
                      </Button>
                    </ActionForm>
                  ) : (
                    <span className="text-xs text-muted">{a.anamnesis || "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          {calendar.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{tr("noAppointmentsToday")}</p>
          ) : null}
        </Card>

        <Card title={tr("quickSchedule")}>
          <ActionForm
            action={createAppointment}
            className="grid gap-3"
            successMessage={tr("scheduled")}
          >
            <SelectField label={tr("type")} name="type" defaultValue="EXAM">
              <option value="EXAM">EXAM</option>
              <option value="OPERATION">OPERATION</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </SelectField>
            <input type="hidden" name="doctorUsername" value={user.username} />
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
            <TextareaField label={tr("notes")} name="notes" />
            <Button type="submit">{tr("schedule")}</Button>
          </ActionForm>
        </Card>

        <Card title={tr("updateMedicalRecord")}>
          <ActionForm
            action={updateRecord}
            className="grid gap-3"
            successMessage={tr("recordSaved")}
          >
            <SelectField label={tr("patient")} name="patientUsername">
              {patients.map((p) => (
                <option key={p.username} value={p.username}>
                  {fullName(p.firstName, p.lastName)}
                </option>
              ))}
            </SelectField>
            <Field label={tr("bloodType")} name="bloodType" placeholder="A+" />
            <TextareaField label={tr("notes")} name="notes" />
            <Button type="submit">{tr("saveRecord")}</Button>
          </ActionForm>
        </Card>

        <Card title={tr("prescriptions")}>
          <ActionForm
            action={createPrescription}
            className="mb-4 grid gap-3 sm:grid-cols-2"
            successMessage={tr("prescribed")}
          >
            <SelectField label={tr("patient")} name="patientUsername">
              {patients.map((p) => (
                <option key={p.username} value={p.username}>
                  {fullName(p.firstName, p.lastName)}
                </option>
              ))}
            </SelectField>
            <SelectField label={tr("medicine")} name="medicineId">
              {approvedMeds.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </SelectField>
            <Field
              label={tr("dosage")}
              name="dosage"
              required
              placeholder="500 mg twice daily"
            />
            <div className="flex items-end">
              <Button type="submit">{tr("createPrescription")}</Button>
            </div>
          </ActionForm>
          <Table headers={[tr("patient"), tr("medicine"), tr("dosage")]}>
            {scripts.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 text-xs">{s.patientUsername}</td>
                <td className="px-3 py-2 text-xs">{s.medicineName}</td>
                <td className="px-3 py-2 text-xs">{s.dosage}</td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title={tr("medicineReviewQueue")}>
          {pendingMeds.length === 0 ? (
            <p className="text-sm text-muted">{tr("noMedicinesPending")}</p>
          ) : (
            <Table headers={[tr("code"), tr("name"), tr("review")]}>
              {pendingMeds.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 font-mono text-xs">{m.code}</td>
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2">
                    <ActionForm
                      action={reviewMedicine}
                      className="flex flex-wrap gap-2"
                      successMessage={tr("reviewed")}
                    >
                      <input type="hidden" name="medicineId" value={m.id} />
                      <input
                        name="comment"
                        placeholder={tr("comment")}
                        className="rounded border border-line bg-field px-2 py-1 text-xs"
                      />
                      <select
                        name="decision"
                        className="rounded border border-line bg-field px-2 py-1 text-xs"
                        defaultValue="APPROVE"
                      >
                        <option value="APPROVE">APPROVE</option>
                        <option value="REJECT">REJECT</option>
                      </select>
                      <Button type="submit" className="!py-1 text-xs">
                        {tr("submit")}
                      </Button>
                    </ActionForm>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={tr("hospitalizations")} className="xl:col-span-2">
          <ActionForm
            action={admitPatient}
            className="mb-4 grid gap-3 sm:grid-cols-2"
            successMessage={tr("admitted")}
          >
            <SelectField label={tr("patient")} name="patientUsername">
              {patients.map((p) => (
                <option key={p.username} value={p.username}>
                  {fullName(p.firstName, p.lastName)}
                </option>
              ))}
            </SelectField>
            <SelectField label={tr("room")} name="roomId">
              {(wardRooms.length ? wardRooms : roomRows).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code}
                </option>
              ))}
            </SelectField>
            <Field label={tr("reason")} name="reason" required />
            <Field label={tr("admittedAt")} name="admittedAt" type="datetime-local" />
            <div className="sm:col-span-2">
              <Button type="submit">{tr("admitPatient")}</Button>
            </div>
          </ActionForm>
          <Table
            headers={[
              tr("patient"),
              tr("room"),
              tr("reason"),
              tr("admittedAt"),
              tr("status"),
              tr("action"),
            ]}
          >
            {stays.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 text-xs">{s.patientUsername}</td>
                <td className="px-3 py-2 text-xs">{s.roomCode}</td>
                <td className="px-3 py-2 text-xs">{s.reason}</td>
                <td className="px-3 py-2 text-xs">{s.admittedAt}</td>
                <td className="px-3 py-2">
                  <Badge tone={s.dischargedAt ? "success" : "teal"}>
                    {s.dischargedAt ? tr("closedStay") : tr("activeStay")}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {!s.dischargedAt ? (
                    <ActionForm
                      action={dischargePatient}
                      successMessage={tr("discharged")}
                    >
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="ghost" className="!px-2 !py-1 text-xs">
                        {tr("discharge")}
                      </Button>
                    </ActionForm>
                  ) : (
                    <span className="text-xs text-muted">{s.dischargedAt}</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title={tr("referrals")} className="xl:col-span-2">
          <ActionForm
            action={createReferral}
            className="mb-4 grid gap-3 sm:grid-cols-2"
            successMessage={tr("referralCreated")}
          >
            <SelectField label={tr("patient")} name="patientUsername">
              {patients.map((p) => (
                <option key={p.username} value={p.username}>
                  {fullName(p.firstName, p.lastName)}
                </option>
              ))}
            </SelectField>
            <SelectField label={tr("toDoctor")} name="toDoctor">
              {doctors.map((d) => (
                <option key={d.username} value={d.username}>
                  {fullName(d.firstName, d.lastName)}
                </option>
              ))}
            </SelectField>
            <div className="sm:col-span-2">
              <TextareaField label={tr("reason")} name="reason" required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">{tr("createReferral")}</Button>
            </div>
          </ActionForm>
          <Table
            headers={[
              tr("patient"),
              tr("fromDoctor"),
              tr("toDoctor"),
              tr("reason"),
              tr("created"),
            ]}
          >
            {referralRows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-xs">{r.patientUsername}</td>
                <td className="px-3 py-2 text-xs">{r.fromDoctor}</td>
                <td className="px-3 py-2 text-xs">{r.toDoctor}</td>
                <td className="px-3 py-2 text-xs">{r.reason}</td>
                <td className="px-3 py-2 text-xs">{r.createdAt}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </DeskShell>
  );
}
