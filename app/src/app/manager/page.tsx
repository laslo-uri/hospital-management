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
import {
  addInventory,
  applyDueJobsAction,
  createRoom,
  scheduleRoomJob,
  scheduleTransfer,
  updateRoom,
} from "@/server/actions/facility";
import { proposeMedicine } from "@/server/actions/records";
import { getCurrentUser } from "@/server/auth";
import {
  listInventory,
  listMedicines,
  listPendingRoomJobs,
  listPendingTransfers,
  listRooms,
} from "@/server/queries";

export default async function ManagerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "MANAGER") redirect("/");

  const locale = await getLocale();
  const tr = (key: Parameters<typeof translate>[1], vars?: Record<string, string>) =>
    translate(locale, key, vars);

  const roomRows = listRooms();
  const inventory = listInventory();
  const transfers = listPendingTransfers();
  const jobs = listPendingRoomJobs();
  const meds = listMedicines();

  return (
    <DeskShell user={user}>
      <PageHeader title={tr("managerDeskTitle")} body={tr("managerDeskBody")} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={tr("rooms")}>
          <Table
            headers={[
              tr("code"),
              tr("name"),
              tr("type"),
              tr("status"),
              tr("update"),
            ]}
          >
            {roomRows.map((room) => (
              <tr key={room.id}>
                <td className="px-3 py-2 font-mono text-xs">{room.code}</td>
                <td className="px-3 py-2">{room.name}</td>
                <td className="px-3 py-2">
                  <Badge tone="teal">{room.type}</Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge
                    tone={
                      room.status === "ACTIVE"
                        ? "success"
                        : room.status === "RENOVATION"
                          ? "warn"
                          : "neutral"
                    }
                  >
                    {room.status}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <ActionForm
                    action={updateRoom}
                    className="flex flex-wrap items-end gap-2"
                    successMessage={tr("updated")}
                  >
                    <input type="hidden" name="id" value={room.id} />
                    <input
                      name="name"
                      defaultValue={room.name}
                      className="w-28 rounded border border-line bg-field px-2 py-1 text-xs"
                    />
                    <select
                      name="status"
                      defaultValue={room.status}
                      className="rounded border border-line bg-field px-2 py-1 text-xs"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="RENOVATION">RENOVATION</option>
                      <option value="MERGED">MERGED</option>
                      <option value="SPLIT">SPLIT</option>
                    </select>
                    <Button type="submit" variant="secondary" className="!py-1 text-xs">
                      {tr("save")}
                    </Button>
                  </ActionForm>
                </td>
              </tr>
            ))}
          </Table>

          <ActionForm
            action={createRoom}
            className="mt-4 grid gap-3 sm:grid-cols-2"
            successMessage={tr("roomCreated")}
          >
            <Field label={tr("code")} name="code" required placeholder="EX-102" />
            <Field label={tr("name")} name="name" required />
            <SelectField label={tr("type")} name="type" defaultValue="EXAM">
              <option value="ORDINARY">ORDINARY</option>
              <option value="OR">OR</option>
              <option value="EXAM">EXAM</option>
              <option value="WARD">WARD</option>
              <option value="WAREHOUSE">WAREHOUSE</option>
            </SelectField>
            <Field label={tr("floor")} name="floor" type="number" defaultValue={1} />
            <Field label={tr("areaSqm")} name="areaSqm" type="number" defaultValue={20} />
            <div className="flex items-end">
              <Button type="submit">{tr("createRoom")}</Button>
            </div>
          </ActionForm>
        </Card>

        <Card title={tr("inventory")}>
          <Table headers={[tr("room"), tr("item"), tr("kind"), tr("qty")]}>
            {inventory.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2 font-mono text-xs">{item.roomCode}</td>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">{item.kind}</td>
                <td className="px-3 py-2">{item.quantity}</td>
              </tr>
            ))}
          </Table>
          <ActionForm
            action={addInventory}
            className="mt-4 grid gap-3 sm:grid-cols-2"
            successMessage={tr("added")}
          >
            <SelectField label={tr("room")} name="roomId" required>
              {roomRows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.name}
                </option>
              ))}
            </SelectField>
            <Field label={tr("itemName")} name="name" required />
            <SelectField label={tr("kind")} name="kind" defaultValue="DYNAMIC">
              <option value="STATIC">STATIC</option>
              <option value="DYNAMIC">DYNAMIC</option>
            </SelectField>
            <Field label={tr("quantity")} name="quantity" type="number" defaultValue={1} />
            <div className="sm:col-span-2">
              <Button type="submit">{tr("addInventory")}</Button>
            </div>
          </ActionForm>
        </Card>

        <Card title={tr("scheduleEquipmentTransfer")}>
          <ActionForm
            action={scheduleTransfer}
            className="grid gap-3 sm:grid-cols-2"
            successMessage={tr("transferScheduled")}
          >
            <SelectField label={tr("fromRoom")} name="fromRoomId">
              {roomRows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code}
                </option>
              ))}
            </SelectField>
            <SelectField label={tr("toRoom")} name="toRoomId">
              {roomRows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code}
                </option>
              ))}
            </SelectField>
            <Field
              label={tr("itemName")}
              name="itemName"
              required
              placeholder="Monitor cart"
            />
            <Field label={tr("quantity")} name="quantity" type="number" defaultValue={1} />
            <Field label={tr("applyAt")} name="applyAt" type="datetime-local" required />
            <div className="flex items-end">
              <Button type="submit">{tr("scheduleTransfer")}</Button>
            </div>
          </ActionForm>
        </Card>

        <Card title={tr("scheduleRoomJob")}>
          <ActionForm
            action={scheduleRoomJob}
            className="grid gap-3 sm:grid-cols-2"
            successMessage={tr("jobScheduled")}
          >
            <SelectField label={tr("room")} name="roomId">
              {roomRows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code}
                </option>
              ))}
            </SelectField>
            <SelectField label={tr("jobType")} name="jobType" defaultValue="RENOVATION">
              <option value="RENOVATION">RENOVATION</option>
              <option value="SPLIT">SPLIT</option>
              <option value="MERGE">MERGE</option>
            </SelectField>
            <TextareaField label={tr("details")} name="details" />
            <Field label={tr("applyAt")} name="applyAt" type="datetime-local" required />
            <div className="sm:col-span-2">
              <Button type="submit">{tr("scheduleJob")}</Button>
            </div>
          </ActionForm>
        </Card>

        <Card title={tr("pendingJobs")} body={tr("pendingJobsBody")}>
          <Table headers={[tr("type"), tr("details"), tr("applyAt")]}>
            {transfers.map((xfer) => (
              <tr key={`t-${xfer.id}`}>
                <td className="px-3 py-2">{tr("transfer")}</td>
                <td className="px-3 py-2 text-xs">
                  {xfer.itemName} ×{xfer.quantity} ({xfer.fromRoomId}→{xfer.toRoomId})
                </td>
                <td className="px-3 py-2 text-xs">{xfer.applyAt}</td>
              </tr>
            ))}
            {jobs.map((j) => (
              <tr key={`j-${j.id}`}>
                <td className="px-3 py-2">{j.jobType}</td>
                <td className="px-3 py-2 text-xs">
                  {tr("room")} {j.roomId}: {j.details}
                </td>
                <td className="px-3 py-2 text-xs">{j.applyAt}</td>
              </tr>
            ))}
          </Table>
          <ActionForm
            action={applyDueJobsAction}
            className="mt-4"
            successMessage={tr("appliedDueJobs")}
          >
            <Button type="submit">{tr("applyDueJobs")}</Button>
          </ActionForm>
        </Card>

        <Card title={tr("medicinesOverview")}>
          <Table headers={[tr("code"), tr("name"), tr("status")]}>
            {meds.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2 font-mono text-xs">{m.code}</td>
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2">
                  <Badge
                    tone={
                      m.status === "APPROVED"
                        ? "success"
                        : m.status === "REJECTED"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {m.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
          <ActionForm
            action={proposeMedicine}
            className="mt-4 grid gap-3 sm:grid-cols-2"
            successMessage={tr("proposed")}
          >
            <Field label={tr("code")} name="code" required />
            <Field label={tr("name")} name="name" required />
            <div className="sm:col-span-2">
              <Button type="submit">{tr("proposeMedicine")}</Button>
            </div>
          </ActionForm>
        </Card>
      </div>
    </DeskShell>
  );
}
