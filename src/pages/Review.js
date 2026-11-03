import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, BookOpen, CalendarClock, CheckCircle2, ChevronDown, ChevronUp, Eraser, ExternalLink, Gauge, Gavel, History, Hourglass, Info, Layers, ListChecks, LogOut, Monitor, PenLine, RefreshCw, RotateCw, Save, TriangleAlert, Unlink, Upload } from "lucide-react";
import { Alert } from "components/alert";
import { Badge } from "components/badge";
import { Button } from "components/button";
import { Card } from "components/card";
import { ConfirmDialog } from "components/confirm-dialog";
import { EmptyState } from "components/empty-state";
import { Field } from "components/field";
import { Input } from "components/input";
import { PageHeader } from "components/page-header";
import { Select } from "components/select";
import { Stepper } from "components/stepper";
import { Tabs } from "components/tabs";
import { ChoiceCards } from "proposed/choice-cards";
import { ProgressRing } from "proposed/progress-ring";
import { StatCard } from "components/stat-card";
import { Textarea } from "components/textarea";
import { previewFor } from "pages/review/previews";
import PagePreview from "pages/review/PagePreview";
import { call, changePassword, configured, login, sessionStore } from "app/review/serviceClient";
import { NOTE_MAX, activityKind, actorLabel, changeSentence, changeText, decisionDetails, developerNote, defaultRoute, deadlineText, eventLabel, itemName, timelineSteps, daysLeft, missingDates, mustChangePassword, publishedNote, previewNotes, safeRouteUrl, trendText, usageTrend } from "app/review/helpers";
import { usageFor } from "../../scripts/figma/usageCore.mjs";
import usage from "app/review/usage.json";

// Where the designers and product owners decide what happens to a component property that Figma no longer
// has. The reviews are published by the sync tool (reviewSync) to the design review service; the reviewers log in
// to it here, the answers are stored there and the sync flow reads them. Contract: the skill's reference/review-service.md.

const CHOICES = [
  { value: "follow-figma", label: "Remove it, to match Figma", effect: "The option disappears from the component. Screens that use it lose it, and the developers update them." },
  { value: "keep-deprecated", label: "Keep it, but mark it as old (deprecated)", effect: "Screens that use it today keep working. New screens do not get it by default, and developers see a warning when they use it. It can be removed later." },
  { value: "keep", label: "Keep it, and add it to Figma", effect: "Nothing changes in the code. The design needs to add it to Figma so both match." },
];
// Each choice has its own colour and icon, so the three read as three different things before a word is read.
const CHOICE_LOOK = { "follow-figma": { icon: <Eraser size={20} />, tone: "danger" }, "keep-deprecated": { icon: <Hourglass size={20} />, tone: "warning" }, keep: { icon: <PenLine size={20} />, tone: "info" } };
const CHOICE_CARDS = CHOICES.map((c) => ({ value: c.value, label: c.label, description: c.effect, ...CHOICE_LOOK[c.value] }));
const STATUS = { pending: { tone: "warning", label: "Waiting for an answer" }, answered: { tone: "info", label: "Answered, waiting for the developer" }, applied: { tone: "success", label: "Applied" } };

const when = (iso) => (iso ? new Date(iso).toLocaleString() : "");
const isRemoval = (i) => i.kind.startsWith("removed");
const slugOf = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const figmaUrl = (doc) => (doc.figmaFileKey && doc.figmaNode ? `https://www.figma.com/design/${doc.figmaFileKey}?node-id=${doc.figmaNode.replace(":", "-")}` : null);
// The component's documentation page in Storybook (all its stories, with Controls to switch a property on and off).
const storybookLink = (doc) => (doc.storybookUrl && doc.storyId ? `${doc.storybookUrl.replace(/\/$/, "")}/?path=/docs/${doc.storyId}--docs` : null);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// One live copy of the real component, with its own state when it needs a value.
function Live({ spec, props }) {
  const [value, setValue] = useState("");
  const { Component } = spec;
  return <Component {...spec.sample} {...props} {...(spec.controlled ? { value, onChange: setValue } : {})} />;
}

function Preview({ preview, prop, option }) {
  const notes = previewNotes(prop, option);
  const panel = (title, note, props) => (
    <div className="flex min-h-48 flex-1 flex-col gap-3 rounded-default border border-default bg-surface p-4">
      <div>
        <p className="typo-semi-bold-text-sm">{title}</p>
        <p className="text-caption typo-regular-text-sm">{note}</p>
      </div>
      <div className={preview.spec.wide ? "w-full" : "w-72"}><Live spec={preview.spec} props={props} /></div>
    </div>
  );
  return (
    <div className="flex flex-col gap-2">
      <p className="typo-medium-text-sm">See the difference</p>
      <div className="flex flex-col gap-3 md:flex-row">
        {panel("With it", notes.with, preview.with)}
        {panel("Without it", notes.without, preview.without)}
      </div>
      {(preview.hint ?? preview.spec.hint) && <p className="text-caption typo-regular-text-sm">{preview.hint ?? preview.spec.hint}</p>}
    </div>
  );
}

// A titled block with an icon, so a review reads as a few clear sections instead of one long page of text.
function Section({ icon, title, hint, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h4 className="flex items-center gap-2 typo-semi-bold-text-base">{icon}{title}</h4>
        {hint && <p className="text-caption typo-regular-text-sm">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// The pages of the app that use the property: one tab per page (they scroll sideways when there are many), the current
// one underlined, and under them the page as it is now next to the Figma version.
function AffectedPages({ doc, item }) {
  const found = useMemo(() => usageFor(usage, doc.jsxName, item), [doc.jsxName, item]);
  const [path, setPath] = useState(null);
  const note = publishedNote(found.routes.length, doc.usage?.byItem?.[item.id]);
  const route = found.routes.find((r) => r.path === path) ?? defaultRoute(found.routes);
  if (!route) return <p className="text-caption typo-regular-text-sm">No page in the app uses it today.</p>;
  const at = found.routes.indexOf(route) + 1;
  return (
    <div className="flex flex-col gap-3">
      {found.routes.length > 1 ? (
        <div className="flex flex-col gap-2">
          <p className="text-caption typo-regular-text-sm">Page {at} of {found.routes.length}</p>
          <div className="overflow-x-auto"><Tabs className="min-w-max" tabs={found.routes.map((r) => ({ value: r.path, label: r.path }))} value={route.path} onChange={setPath} /></div>
        </div>
      ) : <p className="typo-medium-text-sm"><code>{route.path}</code></p>}
      <PagePreview key={route.path} route={route} previewUrl={doc.previewUrl} />
      {note && <p className="text-caption typo-regular-text-sm">{note}.</p>}
    </div>
  );
}

// How much the decision matters: uses in this build next to the count at the last sync, the trend, the deadline of a
// saved "keep it, but mark it as old" answer. Each tile is left out when its data is missing.
function Impact({ doc, item, saved, today }) {
  const found = useMemo(() => usageFor(usage, doc.jsxName, item), [doc.jsxName, item]);
  const atSync = doc.usage?.byItem?.[item.id]?.count;
  const trend = trendText(usageTrend(doc.usageHistory, item.id));
  const dateText = saved === "keep-deprecated" ? deadlineText(doc.migrateBy?.[item.id], today) : "";
  const overdue = dateText && daysLeft(doc.migrateBy[item.id], today) < 0;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard label="Used in" value={found.count} hint={found.count === 1 ? "place in the app" : "places in the app"} tone={found.count ? "warning" : "success"} icon={<Layers size={20} />} />
      <StatCard label="Pages that would change" value={found.routes.length} hint={found.routes.length === 1 ? "page" : "pages"} tone={found.routes.length ? "warning" : "success"} icon={<Monitor size={20} />} />
      {typeof atSync === "number" && <StatCard label="At the last sync" value={atSync} hint={trend ? `Over the syncs: ${trend}` : "places in the app"} tone="neutral" icon={<History size={20} />} />}
      {item.onByDefault && <StatCard label="On by default" value="Yes" hint={`Every ${doc.jsxName ?? "instance"} has it today`} tone="warning" icon={<Gauge size={20} />} />}
      {dateText && <StatCard label="Migrate by" value={doc.migrateBy[item.id]} hint={overdue ? "Overdue" : dateText.replace(/^Migrate by \S+ ?/, "")} tone={overdue ? "danger" : "info"} icon={<CalendarClock size={20} />} />}
    </div>
  );
}

function Decision({ doc, item, choice, saved, detail, onChoice, readOnly, date, onDate, dateError, today }) {
  const preview = useMemo(() => previewFor(doc, item), [doc, item]);
  const story = storybookLink(doc);
  const decision = CHOICES.find((c) => c.value === saved);
  const devNote = developerNote(item.description);
  return (
    <li className="flex flex-col gap-6 rounded-default border border-default bg-surface p-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-caption typo-medium-text-sm"><Unlink size={14} />Removed in Figma</span>
          <Badge tone={saved ? "success" : choice ? "info" : "warning"}>{saved && saved === choice ? "Decision saved" : choice ? "Chosen, not saved yet" : "Needs your decision"}</Badge>
          {item.deprecated && <Badge tone="neutral">already marked as old</Badge>}
        </div>
        <h3 className="typo-semi-bold-text-lg">{changeSentence(doc.jsxName ?? doc.component, item)}</h3>
        <p className="text-caption typo-regular-text-sm">The code still has it and the Figma design does not. Your decision tells the developers which one wins.</p>
        {devNote && (
          <details>
            <summary className="cursor-pointer text-caption typo-medium-text-sm">Developer's note (technical)</summary>
            <p className="mt-2 break-words text-caption typo-regular-text-sm">{devNote}</p>
          </details>
        )}
      </div>
      <Section icon={<Gauge size={18} />} title="How much it affects">
        <Impact doc={doc} item={item} saved={saved} today={today} />
      </Section>
      {preview && <Preview preview={preview} prop={item.prop} option={item.option} />}
      {!preview && (
        <p className="text-caption typo-regular-text-sm">
          There is no side-by-side box for this component. Compare the pages below
          {story ? <>, or <a href={story} target="_blank" rel="noreferrer" className="text-primary underline">try it in Storybook</a></> : ""}.
        </p>
      )}
      <Section icon={<Monitor size={18} />} title="See it on a page" hint="On the left the page as it is now, on the right the page with the Figma version.">
        <AffectedPages doc={doc} item={item} />
      </Section>
      <section className="flex flex-col gap-4 rounded-default border-2 border-primary p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Gavel size={28} /></div>
          <div className="flex flex-col gap-0.5">
            <h4 className="typo-semi-bold-text-lg">What should we do?</h4>
            <p className="text-caption typo-regular-text-sm">Pick one. The developers apply it next.</p>
          </div>
        </div>
        <ChoiceCards options={CHOICE_CARDS} value={choice ?? ""} disabled={readOnly} onChange={onChoice} />
        {choice === "keep-deprecated" && (
          <div className="w-72">
            <Input label="Migrate by" type="date" required value={date ?? ""} disabled={readOnly} onChange={(e) => onDate(e.target.value)} status={dateError ? "danger" : "default"} caption={dateError ? "Choose the date the pages should stop using it." : "The date the pages should stop using it."} />
          </div>
        )}
        {saved && (
          <div className="flex flex-col gap-1 rounded-default border border-success p-3">
            <p className="flex items-center gap-2 typo-semi-bold-text-sm"><CheckCircle2 size={16} className="shrink-0 text-success" />Decision saved: {decision?.label ?? saved}</p>
            {detail && (detail.by || detail.at || detail.migrateBy) && (
              <p className="text-caption typo-regular-text-sm">{[detail.by && `by ${detail.by}`, when(detail.at), detail.migrateBy && `migrate by ${detail.migrateBy}`].filter(Boolean).join(" · ")}</p>
            )}
            {detail?.note && <p className="break-words border-l-2 border-default pl-3 typo-regular-text-sm">&ldquo;{detail.note}&rdquo;</p>}
          </div>
        )}
      </section>
    </li>
  );
}

const changeLine = (i) => {
  if (i.kind === "added-prop") return <>New property <code>{i.prop}</code>{i.options?.length ? ` (${i.options.join(", ")})` : ""}{i.figmaName ? ` from "${i.figmaName}" in Figma` : ""}</>;
  if (i.kind === "added-option") return <>New choice for <code>{i.prop}</code>: <code>{i.option}</code></>;
  if (i.kind === "default-changed") return <><code>{i.prop}</code> now starts as "{i.to}" instead of "{i.from}"</>;
  return i.detail;
};

const CHOICE_LABELS = Object.fromEntries(CHOICES.map((c) => [c.value, c.label]));

// The left edge says where a review stands at a glance; the icons give each kind of event in the activity log its own look.
const ACCENT = { pending: "border-warning", answered: "border-info", applied: "border-success" };
const ACTIVITY = {
  published: { Icon: Upload, tone: "text-caption" },
  reopened: { Icon: RefreshCw, tone: "text-warning" },
  synced: { Icon: RotateCw, tone: "text-caption" },
  decided: { Icon: CheckCircle2, tone: "text-success" },
  applied: { Icon: BadgeCheck, tone: "text-primary" },
  other: { Icon: Info, tone: "text-caption" },
};

function ReviewCard({ doc, index, total, open, onToggle, onUnsaved, session, onChanged, onExpired, onLocked, onReload }) {
  const [draft, setDraft] = useState(doc.answers);
  const [dates, setDates] = useState(doc.migrateBy ?? {});
  const [dateErrors, setDateErrors] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  // Only a new version of the review resets the choices: a reload after logging in again keeps them.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(doc.answers); setDates(doc.migrateBy ?? {}); setDateErrors([]); }, [doc.version]);

  const applied = doc.status === "applied";
  const needs = doc.items.filter(isRemoval);
  const safe = doc.items.filter((i) => !isRemoval(i));
  const answered = needs.filter((i) => draft[i.id] ?? doc.answers[i.id]).length;
  const changed = (i) => draft[i.id] && (draft[i.id] !== doc.answers[i.id] || (draft[i.id] === "keep-deprecated" && (dates[i.id] ?? "") !== (doc.migrateBy?.[i.id] ?? "")));
  const changes = Object.fromEntries(needs.filter(changed).map((i) => [i.id, draft[i.id]]));
  const unsaved = Object.keys(changes).length;
  const savedCount = needs.filter((i) => doc.answers[i.id]).length; // what the service has, not what is picked on this page
  // The page needs the total: it asks before a reload or a log out would drop the picked answers.
  useEffect(() => {
    onUnsaved?.(doc.component, unsaved);
    return () => onUnsaved?.(doc.component, 0);
  }, [unsaved, doc.component, onUnsaved]);
  const details = useMemo(() => decisionDetails(doc.audit, doc.answers, doc.migrateBy), [doc.audit, doc.answers, doc.migrateBy]);
  const decided = Object.values(details);
  const decidedBy = decided.find((d) => d.by)?.by;
  const decisionSummary = [...new Set(decided.map((d) => CHOICE_LABELS[d.choice] ?? d.choice))].join(", ") + (decidedBy ? ` · by ${decidedBy}` : "");
  const timeline = timelineSteps(doc.audit, doc.status);
  const link = figmaUrl(doc);
  const story = storybookLink(doc);

  const save = async () => {
    const missing = missingDates(changes, dates);
    setDateErrors(missing);
    if (missing.length) return setError("Choose a migrate-by date for every property you keep as old.");
    const migrateBy = Object.fromEntries(Object.keys(changes).filter((id) => changes[id] === "keep-deprecated").map((id) => [id, dates[id]]));
    setBusy(true);
    setError(null);
    const r = await call(session, "POST", `/${slugOf(doc.component)}/decision`, { answers: changes, migrateBy, version: doc.version, ...(note.trim() ? { note: note.trim() } : {}) }).catch(() => null);
    setBusy(false);
    if (!r) return setError("The server could not be reached. Try again.");
    if (r.status === 401) return onExpired(r.json.error);
    if (mustChangePassword(r)) return onLocked();
    if (r.status === 409) {
      if (r.json.current) { onChanged(r.json.current); return setError(`${r.json.error} The page now shows the latest answers.`); }
      onReload();
      return setError(`${r.json.error ?? "Someone else changed this review."} The page is reloading the latest answers.`);
    }
    if (!r.ok) return setError(r.json.error ?? `Error ${r.status}.`);
    setNote("");
    onChanged(r.json);
  };

  const toggleFromCard = onToggle; // the whole card opens when it is collapsed
  const clickable = open ? {} : {
    role: "button",
    tabIndex: 0,
    "aria-expanded": false,
    onClick: toggleFromCard,
    onKeyDown: (e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleFromCard(); } },
  };

  return (
    <div className={`group rounded-default border-l-4 ${ACCENT[doc.status] ?? "border-default"} ${open ? "" : "cursor-pointer transition-shadow hover:shadow-md"}`} {...clickable}>
    <Card
      title={doc.component}
      description={`Review ${index} of ${total} · ${doc.figmaPage ? `Figma page "${doc.figmaPage}"` : "Figma component"}`}
      action={
        <div className="flex items-center gap-3">
          <Badge tone={STATUS[doc.status].tone}>{STATUS[doc.status].label}</Badge>
          {unsaved > 0 && <Badge tone="warning" dot>{unsaved} not saved</Badge>}
          {open && story && <Button as="a" href={story} target="_blank" rel="noreferrer" kind="outlined" size="sm" prefixIcon={<BookOpen />}>Open in Storybook</Button>}
          {open && link && <Button as="a" href={link} target="_blank" rel="noreferrer" kind="outlined" size="sm" suffixIcon={<ExternalLink />}>Open in Figma</Button>}
          <Button kind="text" size="sm" suffixIcon={open ? <ChevronUp /> : <ChevronDown />} onClick={(e) => { e.stopPropagation(); onToggle(); }}>{open ? "Hide" : "Show"}</Button>
        </div>
      }
    >
      {!open ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 typo-regular-text-sm">
          {needs.length > 0 && !applied && <span>Decisions saved: {savedCount} of {needs.length}</span>}
          {decided.length > 0 && <span className="flex items-center gap-1 text-caption"><CheckCircle2 size={14} className="text-success" />{decisionSummary}</span>}
          {needs.length === 0 && decided.length === 0 && <span className="text-caption">{timeline.details[timeline.current === 3 ? 2 : timeline.current === 2 ? 1 : 0]}</span>}
          <span className="ml-auto flex items-center gap-1 text-caption transition-colors group-hover:text-primary">Click to open<ChevronDown size={16} /></span>
        </div>
      ) : (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Stepper steps={timeline.labels} current={timeline.current} />
            <ul className="text-caption typo-regular-text-sm flex flex-col gap-1">
              {timeline.details.filter(Boolean).map((d) => <li key={d}>{d}</li>)}
            </ul>
          </div>
          {needs.length > 0 && (
            <ProgressRing value={savedCount} max={needs.length} tone={savedCount === needs.length ? "success" : "warning"} label="Decisions saved" className="md:border-l md:border-default md:pl-6" />
          )}
        </div>
        {needs.length > 0 && (
          <ul className="flex flex-col gap-4">
            {needs.map((i) => <Decision key={i.id} doc={doc} item={i} choice={draft[i.id]} saved={doc.answers[i.id]} detail={details[i.id]} readOnly={applied} onChoice={(v) => setDraft((d) => ({ ...d, [i.id]: v }))} date={dates[i.id]} onDate={(v) => setDates((d) => ({ ...d, [i.id]: v }))} dateError={dateErrors.includes(i.id)} today={today} />)}
          </ul>
        )}
        {safe.length > 0 && (
          <details className="rounded-default border border-default p-4">
            <summary className="cursor-pointer typo-medium-text-sm">Also changing, no decision needed ({safe.length})</summary>
            <p className="mt-2 text-caption typo-regular-text-sm">These come straight from the Figma design and are added to the component automatically.</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 typo-regular-text-sm">{safe.map((i) => <li key={i.id}>{changeLine(i)}</li>)}</ul>
          </details>
        )}
        {!applied && needs.length > 0 && (
          <section className={`flex flex-col gap-4 rounded-default border-2 p-5 ${unsaved > 0 ? "border-warning" : "border-default"}`}>
            <div className="flex flex-col gap-1">
              <h4 className="flex items-center gap-2 typo-semi-bold-text-base"><Save size={18} />Save your answers</h4>
              {unsaved > 0 && <p className="flex items-center gap-2 typo-medium-text-sm"><TriangleAlert size={16} className="shrink-0 text-warning" />{plural(unsaved, "answer", "answers")} not saved yet. Nothing is sent until you press Save answers.</p>}
            </div>
            <div className="max-w-xl">
              <Field label="Why? (optional)" hint={`${note.length} of ${NOTE_MAX} characters. Shown to the developer and kept in the activity log.`}>
                <Textarea rows={3} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button status="primary" loading={busy} disabled={unsaved === 0} onClick={save}>Save answers</Button>
              <span className="text-caption typo-regular-text-sm">
                {unsaved ? "Your answers stay on this page until you save them." : answered < needs.length ? "You can answer some now and come back for the rest." : "All answered. The developer applies them next."}
              </span>
            </div>
          </section>
        )}
        {doc.status === "answered" && <p className="text-caption typo-regular-text-sm">Nothing changes in the code until the developer applies it.</p>}
        {error && <Alert status="danger" title="Not saved">{error}</Alert>}
        {doc.audit.length > 0 && (
          <section className="flex flex-col gap-3">
            <Button kind="text" size="sm" className="self-start" prefixIcon={<History />} suffixIcon={logOpen ? <ChevronUp /> : <ChevronDown />} onClick={() => setLogOpen((v) => !v)}>Activity log ({doc.audit.length})</Button>
            {logOpen && (
              <ol className="flex flex-col">
                {[...doc.audit].reverse().map((a, n, all) => {
                  const kind = activityKind(a.action);
                  const { Icon, tone } = ACTIVITY[kind];
                  const strong = kind === "decided" || kind === "applied";
                  return (
                    <li key={`${a.at}-${a.action}-${a.by}-${n}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <Icon size={18} className={`shrink-0 ${tone}`} />
                        {n < all.length - 1 && <div className="mt-1 w-0 flex-1 border-l border-default" />}
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5 pb-4">
                        <p className={strong ? "typo-medium-text-sm" : "text-caption typo-regular-text-sm"}>{eventLabel(a.action)}</p>
                        <p className="text-caption typo-regular-text-sm">{[actorLabel(a), when(a.at)].filter(Boolean).join(" · ")}</p>
                        {a.changes && Object.keys(a.changes).length > 0 && (
                          <ul className="flex flex-col gap-0.5 typo-regular-text-sm">
                            {Object.entries(a.changes).map(([id, c]) => <li key={id} className="break-words"><code>{itemName(id)}</code>: {changeText(c, CHOICE_LABELS, a.migrateBy?.[id])}</li>)}
                          </ul>
                        )}
                        {typeof a.note === "string" && a.note && <p className="mt-1 break-words border-l-2 border-default pl-3 text-caption typo-regular-text-sm">&ldquo;{a.note}&rdquo;</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        )}
      </div>
      )}
    </Card>
    </div>
  );
}

function LoginForm({ onLogin, message, expired }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const enter = async (e) => {
    e?.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true);
    setError(null);
    try { onLogin(await login(email.trim(), password)); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  return (
    <form className="flex max-w-md flex-col gap-4" onSubmit={enter}>
      {expired && <Alert status="warning" title="Log in again">{message} Your unsaved choices are still on this page.</Alert>}
      {error && <Alert status="danger" title="Cannot log in">{error}</Alert>}
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} caption="Ask the developer if you do not have an account." />
      <Button type="submit" status="primary" loading={busy} disabled={!email || !password}>Log in</Button>
    </form>
  );
}

function ChangePasswordForm({ session, onDone, onExpired }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const tooShort = next.length > 0 && next.length < 10;
  const mismatch = again.length > 0 && again !== next;
  const save = async () => {
    setBusy(true);
    setError(null);
    try { await changePassword(session, current, next); onDone(); } catch (e) {
      if (e.status === 401) onExpired(e.message);
      else setError(e.message);
    }
    setBusy(false);
  };
  return (
    <div className="flex max-w-md flex-col gap-4">
      <Alert status="info" title="Choose a new password">You are using a temporary password. Set your own before you continue.</Alert>
      {error && <Alert status="danger" title="Not changed">{error}</Alert>}
      <Input label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <Input label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} status={tooShort ? "danger" : "default"} caption="At least 10 characters." />
      <Input label="New password again" type="password" value={again} onChange={(e) => setAgain(e.target.value)} status={mismatch ? "danger" : "default"} caption={mismatch ? "The two passwords differ." : undefined} />
      <Button status="primary" loading={busy} disabled={!current || next.length < 10 || again !== next} onClick={save}>Change password</Button>
    </div>
  );
}

// The page has no app sidebar (see App.js) and uses the full width; forms keep their own narrow width.
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 p-page-padding">
      <div className="flex w-full flex-col gap-6">{children}</div>
    </div>
  );
}

function Header({ session, onLogout, onRefresh, description }) {
  return (
    <PageHeader
      title="Design system review"
      description={description ?? "Decide what happens to component features that the design no longer has."}
      actions={session && (
        <div className="flex items-center gap-2">
          {onRefresh && <Button kind="outlined" size="sm" prefixIcon={<RefreshCw />} onClick={onRefresh}>Refresh</Button>}
          <Button kind="outlined" size="sm" prefixIcon={<LogOut />} onClick={onLogout}>Log out</Button>
        </div>
      )}
    />
  );
}

export default function Review() {
  const [session, setSession] = useState(() => sessionStore.get());
  const [expired, setExpired] = useState(null); // the service's message when the session ended
  const [docs, setDocs] = useState(null); // null: not loaded; { [component]: doc }
  const [problem, setProblem] = useState(null);
  const locked = Boolean(session?.user?.mustChangePassword);

  const logout = () => { sessionStore.set(null); setSession(null); setExpired(null); setDocs(null); setProblem(null); };
  // The account must set its own password before anything else works.
  const lock = useCallback(() => setSession((s) => {
    if (!s) return s;
    const next = { ...s, user: { ...s.user, mustChangePassword: true } };
    sessionStore.set(next);
    return next;
  }), []);
  const start = (next) => { sessionStore.set(next); setSession(next); setExpired(null); };
  // An ended session keeps the loaded reviews (and the unsaved choices in the cards) on the page.
  const expire = useCallback((message) => { sessionStore.set(null); setSession(null); setExpired(message || "Your session expired. Log in again."); }, []);

  const load = useCallback(async (s) => {
    setProblem(null);
    const list = await call(s, "GET").catch(() => null);
    if (!list) return setProblem("The review service could not be reached.");
    if (list.status === 401) return expire(list.json.error);
    if (mustChangePassword(list)) return lock();
    if (!list.ok) return setProblem(list.json.error ?? `Error ${list.status}.`);
    let full;
    try { full = await Promise.all(list.json.reviews.map((r) => call(s, "GET", `/${r.slug}`))); } catch { return setProblem("The review service could not be reached."); }
    if (full.some(mustChangePassword)) return lock();
    if (full.some((x) => x.status === 401)) return expire(full.find((x) => x.status === 401).json.error);
    const bad = full.find((x) => !x.ok);
    if (bad) return setProblem(bad.json.error ?? `Error ${bad.status}.`);
    setDocs(Object.fromEntries(full.map((x) => [x.json.component, x.json])));
  }, [expire, lock]);

  useEffect(() => { if (configured && session && !locked) load(session); }, [session, locked, load]);
  // A review published while this tab was open (or in the background) shows up when the tab is looked at again.
  // The cards keep their unsaved choices: they only reset when a review gets a new version.
  useEffect(() => {
    if (!configured || !session || locked) return undefined;
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 5000) return;
      last = Date.now();
      load(session);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [session, locked, load]);

  const replace = (doc) => setDocs((d) => ({ ...d, [doc.component]: doc }));

  const list = useMemo(() => Object.values(docs ?? {}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [docs]);
  const open = list.filter((d) => d.status !== "applied");
  const applied = list.filter((d) => d.status === "applied");
  const pending = open.filter((d) => d.status === "pending").length;
  const everything = [...open, ...applied];
  const [openSet, setOpenSet] = useState(null); // null: the default, only the first review that waits for an answer is open
  const firstPending = open.find((d) => d.status === "pending")?.component;
  const expanded = openSet ?? new Set(firstPending ? [firstPending] : []);
  const toggle = (component) => setOpenSet(() => { const next = new Set(expanded); if (next.has(component)) next.delete(component); else next.add(component); return next; });
  const [unsavedMap, setUnsavedMap] = useState({});
  const reportUnsaved = useCallback((component, n) => setUnsavedMap((m) => {
    if ((m[component] ?? 0) === n) return m;
    const next = { ...m };
    if (n) next[component] = n; else delete next[component];
    return next;
  }), []);
  const unsavedTotal = Object.values(unsavedMap).reduce((a, b) => a + b, 0);
  const [leaving, setLeaving] = useState(null); // "reload" | "logout" while the dialog asks
  const skipGuard = useRef(false);
  const cardProps = (d) => ({ doc: d, index: everything.indexOf(d) + 1, total: everything.length, open: expanded.has(d.component), onToggle: () => toggle(d.component), onUnsaved: reportUnsaved });
  useEffect(() => {
    if (!unsavedTotal) return undefined;
    // F5 and Ctrl/Cmd+R get the page's own dialog. The browser's reload button and closing the tab cannot be customised: the browser asks.
    const onKey = (e) => {
      if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "r")) { e.preventDefault(); setLeaving("reload"); }
    };
    const warn = (e) => { if (skipGuard.current) return; e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", warn); };
  }, [unsavedTotal]);
  const confirmLeave = () => {
    const what = leaving;
    setLeaving(null);
    if (what === "logout") return logout();
    skipGuard.current = true;
    window.location.reload();
  };

  if (!configured) {
    return (
      <Shell>
        <Header />
        <Alert status="warning" title="The review service is not set up">Set PUBLIC_REVIEW_SERVICE_URL and PUBLIC_REVIEW_PROJECT (see .env.example), then restart the app.</Alert>
      </Shell>
    );
  }

  if (locked) {
    return (
      <Shell>
        <Header session={session} onLogout={logout} />
        <ChangePasswordForm session={session} onExpired={expire} onDone={() => start({ ...session, user: { ...session.user, mustChangePassword: false } })} />
      </Shell>
    );
  }

  if (!session && !docs) {
    return (
      <Shell>
        <Header />
        <LoginForm onLogin={start} message={expired} expired={Boolean(expired)} />
      </Shell>
    );
  }

  return (
    <Shell>
      <Header
        session={session}
        onLogout={() => (unsavedTotal ? setLeaving("logout") : logout())}
        onRefresh={() => session && load(session)}
        description="The developers are matching the components in code to the Figma design. A few things exist in the code but not in Figma. Tell us what to do with each one; nothing changes in the code until a developer applies your answer."
      />
      {!session && <LoginForm onLogin={start} message={expired} expired />}
      {problem && <Alert status="danger" title="Something went wrong">{problem}</Alert>}
      {docs && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Waiting for your answer" value={pending} tone="warning" icon={<ListChecks />} hint="Reviews with a decision to make" />
          <StatCard label="Answered" value={open.length - pending} tone="info" hint="Waiting for a developer to apply" />
          <StatCard label="Applied" value={applied.length} tone="success" hint="Done" />
        </div>
      )}
      {docs && !list.length && <EmptyState title="Nothing to review" description="Reviews appear here when the developer syncs a component that already exists from Figma." />}
      {docs && everything.length > 1 && (
        <div className="flex justify-end gap-2">
          <Button kind="text" size="sm" onClick={() => setOpenSet(new Set(everything.map((d) => d.component)))}>Expand all</Button>
          <Button kind="text" size="sm" onClick={() => setOpenSet(new Set())}>Collapse all</Button>
        </div>
      )}
      {open.map((d) => <ReviewCard key={d.component} {...cardProps(d)} session={session} onChanged={replace} onExpired={expire} onLocked={lock} onReload={() => session && load(session)} />)}
      {applied.length > 0 && (
        <>
          <h2 className="typo-semi-bold-text-lg">Applied</h2>
          {applied.map((d) => <ReviewCard key={d.component} {...cardProps(d)} session={session} onChanged={replace} onExpired={expire} onLocked={lock} onReload={() => session && load(session)} />)}
        </>
      )}
      <ConfirmDialog
        open={leaving !== null}
        onClose={() => setLeaving(null)}
        onConfirm={confirmLeave}
        title="Leave without saving?"
        description={`You picked ${plural(unsavedTotal, "answer", "answers")} that ${unsavedTotal === 1 ? "is" : "are"} not saved yet. If you ${leaving === "logout" ? "log out" : "reload the page"}, ${unsavedTotal === 1 ? "it is" : "they are"} lost. Choose Cancel to go back and press Save answers.`}
        confirmLabel={leaving === "logout" ? "Log out anyway" : "Reload anyway"}
        tone="danger"
      />
    </Shell>
  );
}
