import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Alert } from "components/alert";
import { Badge } from "components/badge";
import { Button } from "components/button";
import { Card } from "components/card";
import { Checkbox } from "components/checkbox";
import { DatePicker } from "components/date-picker";
import { DateRangePicker } from "components/date-range-picker";
import { Field } from "components/field";
import { IconButton } from "components/icon-button";
import { Input } from "components/input";
import { Modal } from "components/modal";
import { PageHeader } from "components/page-header";
import { Select } from "components/select";
import { Spinner } from "components/spinner";
import { Stepper } from "components/stepper";
import { Textarea } from "components/textarea";
import { Toggle } from "components/toggle";
import { useToast } from "components/toast";
import { EQUIPMENT } from "data/mock";
import { daysFromNow, findConflicts, TEAMS, useReservations } from "data/reservations";

const STEPS = ["Who and what", "When", "Review"];
const MAX_ITEMS = 3;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDate = (d) => dayjs(d).format("D MMM YYYY");
const teamOptions = TEAMS.map((t) => ({ value: t, label: t }));

function validateWho({ name, email, team, items, rulesRead }) {
  const e = {};
  if (!name.trim()) e.name = "Enter the requester's name.";
  if (!email.trim()) e.email = "Enter an email address.";
  else if (!EMAIL.test(email.trim())) e.email = "Enter a valid email address, like name@example.org.";
  if (!team) e.team = "Choose a team.";
  if (items.length === 0) e.items = "Add at least one item.";
  if (!rulesRead) e.rules = "Confirm that you have read the loan rules.";
  return e;
}

function validateWhen({ period, reminderOn, reminderDate }) {
  const e = {};
  if (!period.start || !period.end) e.period = "Choose the first and last day.";
  else if (dayjs(period.end).isBefore(period.start, "day")) e.period = "The end date must be after the start date.";
  if (reminderOn) {
    if (!reminderDate) e.reminder = "Choose the reminder date.";
    else if (period.start && dayjs(reminderDate).isAfter(period.start, "day")) e.reminder = "The reminder must be on or before the first day.";
  }
  return e;
}

export default function NewReservation() {
  const navigate = useNavigate();
  const toast = useToast();
  const { reservations, addReservation } = useReservations();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [team, setTeam] = useState("");
  const [items, setItems] = useState([]);
  const [pick, setPick] = useState("");
  const [period, setPeriod] = useState({ start: "", end: "" });
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  // Checkbox and Textarea take no controlled value/onChange props, so they stay uncontrolled and are read through refs.
  // Every step stays mounted (hidden), so what the user typed survives going back and forth.
  const rulesRef = useRef(null);
  const notesRef = useRef(null);

  const equipmentOptions = EQUIPMENT.map((e) => ({
    value: e.id,
    label: `${e.name} (${e.id})`,
    disabled: items.some((i) => i.id === e.id),
  }));

  const addItem = (id) => {
    const e = EQUIPMENT.find((x) => x.id === id);
    if (e && items.length < MAX_ITEMS) setItems([...items, { id: e.id, name: e.name, category: e.category }]);
    setPick("");
    setErrors({ ...errors, items: undefined });
  };
  const removeItem = (id) => setItems(items.filter((i) => i.id !== id));

  const toggleReminder = (on) => {
    setReminderOn(on);
    if (on && !reminderDate && period.start) {
      const eve = dayjs(period.start).subtract(1, "day").format("YYYY-MM-DD");
      setReminderDate(dayjs(eve).isBefore(daysFromNow(0), "day") ? period.start : eve);
    }
    if (!on) setErrors({ ...errors, reminder: undefined });
  };

  const conflicts = items.length > 0 && period.start && period.end ? findConflicts({ items, start: period.start, end: period.end }, reservations) : [];

  const next = () => {
    const found =
      step === 0
        ? validateWho({ name, email, team, items, rulesRead: !!rulesRef.current?.checked })
        : validateWhen({ period, reminderOn, reminderDate });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step === 1) setNotes(notesRef.current?.value.trim() ?? "");
    setStep(step + 1);
  };
  const back = () => {
    setErrors({});
    setStep(step - 1);
  };

  const create = () => {
    setSaving(true);
    setTimeout(() => {
      const id = addReservation({
        requester: { name: name.trim(), email: email.trim(), team },
        items,
        start: period.start,
        end: period.end,
        notes,
      });
      toast.success(`Reservation ${id} created`);
      navigate(`/reservations/${id}`);
    }, 800);
  };

  const summary = (label, value) => (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-caption">{label}</dt>
      <dd className="text-default">{value}</dd>
    </div>
  );

  const conflictAlert = conflicts.length > 0 && (
    <Alert
      kind="outlined"
      status="warning"
      title={conflicts.length === 1 ? "One reservation already books this equipment" : `${conflicts.length} reservations already book this equipment`}
    >
      {conflicts.map((c) => `${c.id} (${c.requester.name}, ${formatDate(c.start)} to ${formatDate(c.end)})`).join("; ")}. You can still continue, but the store keeper will need to resolve the overlap.
    </Alert>
  );

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <PageHeader title="New reservation" description="Book equipment for a period in three short steps." />
      <Stepper steps={STEPS} current={step} />

      <Card>
        <div className={step === 0 ? "flex flex-col gap-5" : "hidden"}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Requester name" required error={errors.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, Aisyah Rahman" />
            </Field>
            <Field label="Email" required error={errors.email}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.org" />
            </Field>
          </div>
          <Field label="Team" required error={errors.team}>
            <Select options={teamOptions} value={team} onChange={setTeam} placeholder="Choose a team" />
          </Field>
          <Field label="Equipment" required hint={`Add up to ${MAX_ITEMS} items.`} error={errors.items}>
            <Select
              options={equipmentOptions}
              value={pick}
              onChange={addItem}
              placeholder={items.length >= MAX_ITEMS ? "You have added the maximum" : "Choose an item to add"}
              disabled={items.length >= MAX_ITEMS}
            />
          </Field>
          {items.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-1">
                  <Badge tone="info" dot={false}>{i.name} ({i.id})</Badge>
                  <IconButton size="sm" variant="ghost" icon={<X size={16} />} label={`Remove ${i.name} ${i.id}`} onClick={() => removeItem(i.id)} />
                </li>
              ))}
            </ul>
          )}
          <Field error={errors.rules}>
            <Checkbox ref={rulesRef} label="I have read the loan rules" description="Equipment is returned clean, complete and on time." />
          </Field>
        </div>

        <div className={step === 1 ? "flex flex-col gap-5" : "hidden"}>
          <Field label="Period" required hint="The first and the last day the equipment is out." error={errors.period}>
            <DateRangePicker value={period} onChange={(p) => { setPeriod(p); setErrors({ ...errors, period: undefined }); }} min={daysFromNow(0)} presets={false} />
          </Field>
          {conflictAlert}
          <Toggle checked={reminderOn} onChange={toggleReminder} label="Send a reminder before pickup" />
          {reminderOn && (
            <Field label="Reminder date" required hint="We email the requester on this day." error={errors.reminder}>
              <DatePicker value={reminderDate} onChange={(d) => { setReminderDate(d); setErrors({ ...errors, reminder: undefined }); }} min={daysFromNow(0)} max={period.start || undefined} />
            </Field>
          )}
          <Field label="Notes" hint="Optional. Anything the store keeper should know.">
            <Textarea ref={notesRef} placeholder="For example, please include the carry case." />
          </Field>
        </div>

        <div className={step === 2 ? "flex flex-col gap-5" : "hidden"}>
          <div className="grid grid-cols-2 gap-4">
            <Card title="Requester">
              <dl className="flex flex-col gap-3">
                {summary("Name", name.trim())}
                {summary("Email", email.trim())}
                {summary("Team", team)}
              </dl>
            </Card>
            <Card title="Period">
              <dl className="flex flex-col gap-3">
                {summary("From", period.start ? formatDate(period.start) : "")}
                {summary("To", period.end ? formatDate(period.end) : "")}
                {summary("Reminder", reminderOn && reminderDate ? formatDate(reminderDate) : "No reminder")}
              </dl>
            </Card>
          </div>
          <Card title="Equipment">
            <ul className="flex flex-col gap-2">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 text-default">
                  <span>{i.name} ({i.id})</span>
                  <span className="text-sm text-caption">{i.category}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Notes">
            <p className="text-default">{notes || "No notes."}</p>
          </Card>
          {conflictAlert}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        {step === 0 ? (
          <Button kind="text" onClick={() => navigate("/reservations")}>Cancel</Button>
        ) : (
          <Button kind="outlined" prefixIcon={<ArrowLeft />} onClick={back}>Back</Button>
        )}
        {step < 2 ? (
          <Button suffixIcon={<ArrowRight />} onClick={next}>Next</Button>
        ) : (
          <Button prefixIcon={<Check />} onClick={() => setConfirming(true)}>Create reservation</Button>
        )}
      </div>

      <Modal
        open={confirming}
        onClose={() => !saving && setConfirming(false)}
        title="Create this reservation?"
        description={`${items.length} ${items.length === 1 ? "item" : "items"} for ${name.trim()}, ${period.start ? formatDate(period.start) : ""} to ${period.end ? formatDate(period.end) : ""}.`}
        size="sm"
        footer={
          <>
            <Button kind="outlined" disabled={saving} onClick={() => setConfirming(false)}>Back</Button>
            <Button disabled={saving} onClick={create}>Confirm</Button>
          </>
        }
      >
        {saving ? (
          <div className="flex items-center gap-3 text-default">
            <Spinner label="Creating the reservation" />
            <span>Creating the reservation...</span>
          </div>
        ) : (
          <p className="text-default">The reservation starts as upcoming and the store keeper is told about it.</p>
        )}
      </Modal>
    </div>
  );
}
