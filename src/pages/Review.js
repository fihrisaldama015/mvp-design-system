import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, ListChecks } from "lucide-react";
import { Alert } from "components/alert";
import { Badge } from "components/badge";
import { Button } from "components/button";
import { Card } from "components/card";
import { EmptyState } from "components/empty-state";
import { Input } from "components/input";
import { PageHeader } from "components/page-header";
import { ProgressBar } from "components/progress-bar";
import { Select } from "components/select";
import { StatCard } from "components/stat-card";
import { previewFor } from "pages/review/previews";

// Where the designers and product owners decide what happens to a component property that Figma no longer
// has. The reviews are published by the sync tool (reviewSync) to /api/review; the answers are stored there
// (KV on Vercel, Mongo in swt) and the sync flow reads them. Contract: the skill's reference/review-service.md.
const API = "/api/review";

const CHOICES = [
  { value: "follow-figma", label: "Remove it, to match Figma", effect: "The option disappears from the component. Screens that use it lose it, and the developers update them." },
  { value: "keep-deprecated", label: "Keep it, but mark it as old (deprecated)", effect: "Screens that use it today keep working. New screens do not get it by default, and developers see a warning when they use it. It can be removed later." },
  { value: "keep", label: "Keep it, and add it to Figma", effect: "Nothing changes in the code. The design needs to add it to Figma so both match." },
];
const STATUS = { pending: { tone: "warning", label: "Waiting for an answer" }, answered: { tone: "info", label: "Answered, waiting for the developer" }, applied: { tone: "success", label: "Applied" } };

const store = {
  get: (k) => { try { return window.sessionStorage.getItem(k) ?? ""; } catch { return ""; } },
  set: (k, v) => { try { window.sessionStorage.setItem(k, v); } catch { /* private window */ } },
};
const when = (iso) => (iso ? new Date(iso).toLocaleString() : "");
const isRemoval = (i) => i.kind.startsWith("removed");
const slugOf = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const figmaUrl = (doc) => (doc.figmaFileKey && doc.figmaNode ? `https://www.figma.com/design/${doc.figmaFileKey}?node-id=${doc.figmaNode.replace(":", "-")}` : null);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

async function call(password, method, path = "", body) {
  const res = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", "x-review-password": password }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

// One live copy of the real component, with its own state when it needs a value.
function Live({ spec, props }) {
  const [value, setValue] = useState("");
  const { Component } = spec;
  return <Component {...spec.sample} {...props} {...(spec.controlled ? { value, onChange: setValue } : {})} />;
}

function Preview({ preview, prop }) {
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
        {panel("Without it", "How the component looks in Figma", preview.without)}
        {panel("With it", `The current code, with ${prop} on`, preview.with)}
      </div>
      {preview.spec.hint && <p className="text-caption typo-regular-text-sm">{preview.spec.hint}</p>}
    </div>
  );
}

function Decision({ doc, item, choice, saved, onChoice, readOnly }) {
  const preview = useMemo(() => previewFor(doc, item), [doc, item]);
  const chosen = CHOICES.find((c) => c.value === choice);
  const where = [item.callers ? plural(item.callers, "app file", "app files") : null, item.storyCallers ? plural(item.storyCallers, "Storybook example", "Storybook examples") : null].filter(Boolean).join(" and ");
  return (
    <li className="flex flex-col gap-4 rounded-default border border-default bg-surface p-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={saved ? "success" : choice ? "info" : "warning"}>{saved && saved === choice ? "Answered" : choice ? "Chosen, not saved yet" : "Needs your decision"}</Badge>
          {item.deprecated && <Badge tone="neutral">already marked as old</Badge>}
        </div>
        <h3 className="typo-semi-bold-text-base">The property <code>{item.prop}{item.option ? `="${item.option}"` : ""}</code> is not in the Figma design</h3>
        {item.description && <p className="text-default typo-regular-text-sm">What it does today: {item.description}</p>}
        <p className="text-caption typo-regular-text-sm">
          {item.onByDefault ? `It is on by default, so every ${doc.jsxName ?? "instance"} in the app has it today. ` : ""}
          {where ? `Used in ${where}.` : "Nothing in the app asks for it explicitly."}
        </p>
      </div>
      {preview && <Preview preview={preview} prop={item.prop} />}
      <div className="flex flex-col gap-2">
        <div className="w-96"><Select label="What should we do with it?" options={CHOICES} value={choice ?? ""} placeholder="Choose what to do" disabled={readOnly} onChange={onChoice} /></div>
        {chosen && <p className="text-default typo-regular-text-sm">If you choose this: {chosen.effect}</p>}
      </div>
    </li>
  );
}

const changeLine = (i) => {
  if (i.kind === "added-prop") return <>New property <code>{i.prop}</code>{i.options?.length ? ` (${i.options.join(", ")})` : ""}{i.figmaName ? ` from "${i.figmaName}" in Figma` : ""}</>;
  if (i.kind === "added-option") return <>New choice for <code>{i.prop}</code>: <code>{i.option}</code></>;
  if (i.kind === "default-changed") return <><code>{i.prop}</code> now starts as "{i.to}" instead of "{i.from}"</>;
  return i.detail;
};

function ReviewCard({ doc, password, reviewer, onChanged, onMissingName }) {
  const [draft, setDraft] = useState(doc.answers);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(doc.answers); }, [doc.version, doc.answers]);

  const applied = doc.status === "applied";
  const needs = doc.items.filter(isRemoval);
  const safe = doc.items.filter((i) => !isRemoval(i));
  const answered = needs.filter((i) => draft[i.id] ?? doc.answers[i.id]).length;
  const changes = Object.fromEntries(needs.filter((i) => draft[i.id] && draft[i.id] !== doc.answers[i.id]).map((i) => [i.id, draft[i.id]]));
  const lastDecision = [...doc.audit].reverse().find((a) => a.action === "decided");
  const link = figmaUrl(doc);

  const save = async () => {
    if (!reviewer.trim()) return onMissingName();
    setBusy(true);
    setError(null);
    const r = await call(password, "POST", `/${slugOf(doc.component)}/decision`, { reviewer, answers: changes, version: doc.version }).catch(() => null);
    setBusy(false);
    if (!r) return setError("The server could not be reached. Try again.");
    if (r.status === 409) { onChanged(r.json.current); return setError(`${r.json.error} The page now shows the latest answers.`); }
    if (!r.ok) return setError(r.json.error ?? `Error ${r.status}.`);
    onChanged(r.json);
  };

  return (
    <Card
      title={doc.component}
      description={doc.figmaPage ? `Figma page "${doc.figmaPage}"` : "Figma component"}
      action={
        <div className="flex items-center gap-3">
          <Badge tone={STATUS[doc.status].tone}>{STATUS[doc.status].label}</Badge>
          {link && <Button as="a" href={link} target="_blank" rel="noreferrer" kind="outlined" size="sm" suffixIcon={<ExternalLink />}>Open in Figma</Button>}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {needs.length > 0 && !applied && <ProgressBar value={Math.round((answered / needs.length) * 100)} tone={answered === needs.length ? "success" : "warning"} label={`Your decisions: ${answered} of ${needs.length}`} />}
        {needs.length > 0 && (
          <ul className="flex flex-col gap-4">
            {needs.map((i) => <Decision key={i.id} doc={doc} item={i} choice={draft[i.id]} saved={doc.answers[i.id]} readOnly={applied} onChoice={(v) => setDraft((d) => ({ ...d, [i.id]: v }))} />)}
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
          <div className="flex flex-wrap items-center gap-3">
            <Button status="primary" loading={busy} disabled={Object.keys(changes).length === 0} onClick={save}>Save answers</Button>
            <span className="text-caption typo-regular-text-sm">
              {Object.keys(changes).length ? plural(Object.keys(changes).length, "change", "changes") + " not saved yet" : answered < needs.length ? "You can answer some now and come back for the rest." : "All answered. The developer applies them next."}
            </span>
          </div>
        )}
        {lastDecision && <p className="text-caption typo-regular-text-sm">Last answer by {lastDecision.by}, {when(lastDecision.at)}. Nothing changes in the code until the developer applies it.</p>}
        {error && <Alert status="danger" title="Not saved">{error}</Alert>}
      </div>
    </Card>
  );
}

export default function Review() {
  const [password, setPassword] = useState(() => store.get("reviewPassword"));
  const [typed, setTyped] = useState("");
  const [reviewer, setReviewer] = useState(() => store.get("reviewerName"));
  const [docs, setDocs] = useState(null); // null: not loaded; { [component]: doc }
  const [problem, setProblem] = useState(null);
  const [nameError, setNameError] = useState(false);

  const load = useCallback(async (pw) => {
    setProblem(null);
    const list = await call(pw, "GET").catch(() => null);
    if (!list) return setProblem("The review service could not be reached.");
    if (list.status === 401) { store.set("reviewPassword", ""); setPassword(""); return setProblem("Wrong password."); }
    if (list.status === 503) return setProblem(list.json.error);
    if (!list.ok) return setProblem(list.json.error ?? `Error ${list.status}.`);
    const full = await Promise.all(list.json.reviews.map((r) => call(pw, "GET", `/${r.slug}`).then((x) => x.json)));
    setDocs(Object.fromEntries(full.map((d) => [d.component, d])));
  }, []);

  useEffect(() => { if (password) load(password); }, [password, load]);

  const enter = () => { store.set("reviewPassword", typed); setPassword(typed); };
  const setName = (e) => { setReviewer(e.target.value); store.set("reviewerName", e.target.value); if (e.target.value.trim()) setNameError(false); };
  // Saving without a name: bring the reviewer to the field instead of leaving a dead button.
  const missingName = () => {
    setNameError(true);
    const field = document.getElementById("reviewer-name");
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.focus({ preventScroll: true });
  };
  const replace = (doc) => setDocs((d) => ({ ...d, [doc.component]: doc }));

  const list = useMemo(() => Object.values(docs ?? {}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [docs]);
  const open = list.filter((d) => d.status !== "applied");
  const applied = list.filter((d) => d.status === "applied");
  const pending = open.filter((d) => d.status === "pending").length;

  if (!password) {
    return (
      <div className="flex max-w-md flex-col gap-4">
        <PageHeader title="Design system review" description="Decide what happens to component features that the design no longer has." />
        {problem && <Alert status="danger" title="Cannot open">{problem}</Alert>}
        <Input label="Password" type="password" value={typed} onChange={(e) => setTyped(e.target.value)} caption="Ask the developer if you do not have it." />
        <Button status="primary" disabled={!typed} onClick={enter}>Continue</Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Design system review"
        description="The developers are matching the components in code to the Figma design. A few things exist in the code but not in Figma. Tell us what to do with each one; nothing changes in the code until a developer applies your answer."
      />
      {problem && <Alert status="danger" title="Something went wrong">{problem}</Alert>}
      {docs && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Waiting for your answer" value={pending} tone="warning" icon={<ListChecks />} hint="Reviews with a decision to make" />
          <StatCard label="Answered" value={open.length - pending} tone="info" hint="Waiting for a developer to apply" />
          <StatCard label="Applied" value={applied.length} tone="success" hint="Done" />
        </div>
      )}
      <div className="w-72">
        <Input id="reviewer-name" label="Your name" required value={reviewer} onChange={setName} status={nameError ? "danger" : "default"} caption={nameError ? "Enter your name so we know who answered." : "Recorded with your answers."} />
      </div>
      {docs && !list.length && <EmptyState title="Nothing to review" description="Reviews appear here when the developer syncs a component that already exists from Figma." />}
      {open.map((d) => <ReviewCard key={d.component} doc={d} password={password} reviewer={reviewer} onChanged={replace} onMissingName={missingName} />)}
      {applied.length > 0 && (
        <>
          <h2 className="typo-semi-bold-text-lg">Applied</h2>
          {applied.map((d) => <ReviewCard key={d.component} doc={d} password={password} reviewer={reviewer} onChanged={replace} onMissingName={missingName} />)}
        </>
      )}
    </div>
  );
}
