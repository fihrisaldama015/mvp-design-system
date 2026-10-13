import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "components/alert";
import { Badge } from "components/badge";
import { Button } from "components/button";
import { Card } from "components/card";
import { EmptyState } from "components/empty-state";
import { Input } from "components/input";
import { PageHeader } from "components/page-header";
import { Select } from "components/select";

// Where the designers and product owners decide what happens to a component prop that Figma no longer
// has. The reviews are published by the sync tool (reviewSync --publish) to /api/review; the answers are
// stored there (KV on Vercel, Mongo in swt) and the sync flow reads them. The contract: the skill's
// reference/review-service.md.
const API = "/api/review";

const CHOICES = [
  { value: "follow-figma", label: "Remove it, follow Figma" },
  { value: "keep-deprecated", label: "Keep it as deprecated" },
  { value: "keep", label: "Keep it, ask the designer to add it to Figma" },
];
const KIND_LABEL = { "added-prop": "New prop", "added-option": "New option", "default-changed": "Default changes", "removed-prop": "Gone from Figma", "removed-option": "Gone from Figma" };
const STATUS = { pending: { tone: "warning", label: "Waiting for an answer" }, answered: { tone: "info", label: "Answered, not applied yet" }, applied: { tone: "success", label: "Applied" } };

const store = {
  get: (k) => { try { return window.sessionStorage.getItem(k) ?? ""; } catch { return ""; } },
  set: (k, v) => { try { window.sessionStorage.setItem(k, v); } catch { /* private window */ } },
};
const when = (iso) => (iso ? new Date(iso).toLocaleString() : "");
const isRemoval = (i) => i.kind.startsWith("removed");

async function call(password, method, path = "", body) {
  const res = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", "x-review-password": password }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

function Item({ item, choice, onChoice, readOnly }) {
  const needs = isRemoval(item);
  return (
    <li className="flex flex-col gap-2 border-b border-default py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={needs ? "warning" : item.kind === "default-changed" ? "info" : "success"}>{KIND_LABEL[item.kind]}</Badge>
        <code className="typo-semi-bold-text-sm">{item.prop}{item.option ? `="${item.option}"` : ""}</code>
        {item.callers !== undefined && (
          <span className="text-caption typo-regular-text-sm">{item.callers} app + {item.storyCallers ?? 0} story files{item.onByDefault ? ", on by default: every caller gets it" : " use it"}</span>
        )}
        {item.deprecated && <Badge tone="neutral">already deprecated</Badge>}
      </div>
      <p className="text-caption typo-regular-text-sm">{item.detail}</p>
      {needs && (
        <div className="w-96">
          <Select options={CHOICES} value={choice ?? ""} placeholder="Choose what to do" disabled={readOnly} onChange={onChoice} />
        </div>
      )}
    </li>
  );
}

function ReviewCard({ doc, password, reviewer, onChanged, onMissingName }) {
  const [draft, setDraft] = useState(doc.answers);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(doc.answers); }, [doc.version, doc.answers]);

  const applied = doc.status === "applied";
  const needs = doc.items.filter(isRemoval);
  const safe = doc.items.filter((i) => !isRemoval(i));
  const changes = Object.fromEntries(needs.filter((i) => draft[i.id] && draft[i.id] !== doc.answers[i.id]).map((i) => [i.id, draft[i.id]]));
  const waiting = needs.filter((i) => !(draft[i.id] ?? doc.answers[i.id])).length;
  const lastDecision = [...doc.audit].reverse().find((a) => a.action === "decided");

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
      description={`Figma node ${doc.figmaNode} · read ${when(doc.readAt)}`}
      action={<Badge tone={STATUS[doc.status].tone}>{STATUS[doc.status].label}</Badge>}
    >
      <ul>
        {needs.map((i) => <Item key={i.id} item={i} choice={draft[i.id]} readOnly={applied} onChoice={(v) => setDraft((d) => ({ ...d, [i.id]: v }))} />)}
        {safe.map((i) => <Item key={i.id} item={i} />)}
      </ul>
      {!applied && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button status="primary" loading={busy} disabled={Object.keys(changes).length === 0} onClick={save}>Save answers</Button>
          <span className="text-caption typo-regular-text-sm">
            {Object.keys(changes).length ? `${Object.keys(changes).length} change(s) not saved` : waiting ? `${waiting} removal(s) still waiting for an answer (you can come back later)` : "All answered"}
          </span>
        </div>
      )}
      {lastDecision && <p className="mt-2 text-caption typo-regular-text-sm">Last answer by {lastDecision.by}, {when(lastDecision.at)}. Nothing changes in the code until the developer applies it.</p>}
      {error && <div className="mt-3"><Alert status="danger" title="Not saved">{error}</Alert></div>}
    </Card>
  );
}

const slugOf = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Design system review"
        description={docs ? `${pending} waiting for an answer, ${open.length - pending} answered and waiting for the developer, ${applied.length} applied.` : "Loading..."}
      />
      {problem && <Alert status="danger" title="Something went wrong">{problem}</Alert>}
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
