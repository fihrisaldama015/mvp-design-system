import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, ListChecks, LogOut } from "lucide-react";
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
import PagePreview from "pages/review/PagePreview";
import { call, changePassword, configured, login, sessionStore } from "app/review/serviceClient";
import { changeText, missingDates, mustChangePassword, publishedNote, safeRouteUrl } from "app/review/helpers";
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

// The pages of the app that use the property, and each one as it is now next to the Figma version.
function AffectedPages({ doc, item }) {
  const found = useMemo(() => usageFor(usage, doc.jsxName, item), [doc.jsxName, item]);
  const [path, setPath] = useState(null);
  const note = publishedNote(found.routes.length, doc.usage?.byItem?.[item.id]);
  const route = found.routes.find((r) => r.path === path) ?? found.routes[0];
  return (
    <div className="flex flex-col gap-2">
      <p className="typo-medium-text-sm">Pages that would change</p>
      {!route && <p className="text-caption typo-regular-text-sm">No page in the app uses it today.</p>}
      {route && (
        <>
          <ul className="flex flex-col gap-1 typo-regular-text-sm">
            {found.routes.map((r) => (
              <li key={r.path}>
                <code>{r.path}</code>{" "}
                {safeRouteUrl(r.url) ? <a href={r.url} target="_blank" rel="noreferrer" className="text-primary underline">Open this page</a> : <span className="text-caption">(needs a sample path)</span>}
              </li>
            ))}
          </ul>
          {found.routes.length > 1 && (
            <div className="w-72"><Select label="Page to preview" options={found.routes.map((r) => ({ value: r.path, label: r.path }))} value={route.path} onChange={setPath} /></div>
          )}
          <PagePreview key={route.path} route={route} previewUrl={doc.previewUrl} />
        </>
      )}
      {note && <p className="text-caption typo-regular-text-sm">{note}.</p>}
    </div>
  );
}

function Decision({ doc, item, choice, saved, onChoice, readOnly, date, onDate, dateError }) {
  const preview = useMemo(() => previewFor(doc, item), [doc, item]);
  const story = storybookLink(doc);
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
      {!preview && (
        <p className="text-caption typo-regular-text-sm">
          There is no live preview for this one yet.{" "}
          {story ? <a href={story} target="_blank" rel="noreferrer" className="text-primary underline">Try the component in Storybook</a> : "Ask the developer to show it to you."}
        </p>
      )}
      <AffectedPages doc={doc} item={item} />
      <div className="flex flex-col gap-2">
        <div className="w-96"><Select label="What should we do with it?" options={CHOICES} value={choice ?? ""} placeholder="Choose what to do" disabled={readOnly} onChange={onChoice} /></div>
        {chosen && <p className="text-default typo-regular-text-sm">If you choose this: {chosen.effect}</p>}
        {choice === "keep-deprecated" && (
          <div className="w-72">
            <Input label="Migrate by" type="date" required value={date ?? ""} disabled={readOnly} onChange={(e) => onDate(e.target.value)} status={dateError ? "danger" : "default"} caption={dateError ? "Choose the date the pages should stop using it." : "The date the pages should stop using it."} />
          </div>
        )}
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

const CHOICE_LABELS = Object.fromEntries(CHOICES.map((c) => [c.value, c.label]));

function ReviewCard({ doc, session, onChanged, onExpired, onLocked, onReload }) {
  const [draft, setDraft] = useState(doc.answers);
  const [dates, setDates] = useState(doc.migrateBy ?? {});
  const [dateErrors, setDateErrors] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  // Only a new version of the review resets the choices: a reload after logging in again keeps them.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(doc.answers); setDates(doc.migrateBy ?? {}); setDateErrors([]); }, [doc.version]);

  const applied = doc.status === "applied";
  const needs = doc.items.filter(isRemoval);
  const safe = doc.items.filter((i) => !isRemoval(i));
  const answered = needs.filter((i) => draft[i.id] ?? doc.answers[i.id]).length;
  const changed = (i) => draft[i.id] && (draft[i.id] !== doc.answers[i.id] || (draft[i.id] === "keep-deprecated" && (dates[i.id] ?? "") !== (doc.migrateBy?.[i.id] ?? "")));
  const changes = Object.fromEntries(needs.filter(changed).map((i) => [i.id, draft[i.id]]));
  const lastDecision = [...doc.audit].reverse().find((a) => a.action === "decided");
  const link = figmaUrl(doc);
  const story = storybookLink(doc);

  const save = async () => {
    const missing = missingDates(changes, dates);
    setDateErrors(missing);
    if (missing.length) return setError("Choose a migrate-by date for every property you keep as old.");
    const migrateBy = Object.fromEntries(Object.keys(changes).filter((id) => changes[id] === "keep-deprecated").map((id) => [id, dates[id]]));
    setBusy(true);
    setError(null);
    const r = await call(session, "POST", `/${slugOf(doc.component)}/decision`, { answers: changes, migrateBy, version: doc.version }).catch(() => null);
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
    onChanged(r.json);
  };

  return (
    <Card
      title={doc.component}
      description={doc.figmaPage ? `Figma page "${doc.figmaPage}"` : "Figma component"}
      action={
        <div className="flex items-center gap-3">
          <Badge tone={STATUS[doc.status].tone}>{STATUS[doc.status].label}</Badge>
          {story && <Button as="a" href={story} target="_blank" rel="noreferrer" kind="outlined" size="sm" prefixIcon={<BookOpen />}>Open in Storybook</Button>}
          {link && <Button as="a" href={link} target="_blank" rel="noreferrer" kind="outlined" size="sm" suffixIcon={<ExternalLink />}>Open in Figma</Button>}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {needs.length > 0 && !applied && <ProgressBar value={Math.round((answered / needs.length) * 100)} tone={answered === needs.length ? "success" : "warning"} label={`Your decisions: ${answered} of ${needs.length}`} />}
        {needs.length > 0 && (
          <ul className="flex flex-col gap-4">
            {needs.map((i) => <Decision key={i.id} doc={doc} item={i} choice={draft[i.id]} saved={doc.answers[i.id]} readOnly={applied} onChoice={(v) => setDraft((d) => ({ ...d, [i.id]: v }))} date={dates[i.id]} onDate={(v) => setDates((d) => ({ ...d, [i.id]: v }))} dateError={dateErrors.includes(i.id)} />)}
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
        {doc.audit.length > 0 && (
          <details className="rounded-default border border-default p-4">
            <summary className="cursor-pointer typo-medium-text-sm">Decision history ({doc.audit.length})</summary>
            <ul className="mt-2 flex flex-col gap-2 typo-regular-text-sm">
              {[...doc.audit].reverse().map((a) => (
                <li key={`${a.at}-${a.action}-${a.by}`}>
                  {when(a.at)}, {a.by}: {a.action}
                  {a.changes && Object.keys(a.changes).length > 0 && (
                    <ul className="list-disc pl-5 text-caption">
                      {Object.entries(a.changes).map(([id, c]) => <li key={id}><code>{id}</code>: {changeText(c, CHOICE_LABELS)}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Card>
  );
}

function LoginForm({ onLogin, message, expired }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const enter = async () => {
    setBusy(true);
    setError(null);
    try { onLogin(await login(email.trim(), password)); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  return (
    <div className="flex max-w-md flex-col gap-4">
      {expired && <Alert status="warning" title="Log in again">{message} Your unsaved choices are still on this page.</Alert>}
      {error && <Alert status="danger" title="Cannot log in">{error}</Alert>}
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} caption="Ask the developer if you do not have an account." />
      <Button status="primary" loading={busy} disabled={!email || !password} onClick={enter}>Log in</Button>
    </div>
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

function Header({ session, onLogout, description }) {
  return (
    <PageHeader
      title="Design system review"
      description={description ?? "Decide what happens to component features that the design no longer has."}
      actions={session && <Button kind="outlined" size="sm" prefixIcon={<LogOut />} onClick={onLogout}>Log out</Button>}
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
    const full = await Promise.all(list.json.reviews.map((r) => call(s, "GET", `/${r.slug}`)));
    if (full.some(mustChangePassword)) return lock();
    if (full.some((x) => x.status === 401)) return expire(full.find((x) => x.status === 401).json.error);
    const bad = full.find((x) => !x.ok);
    if (bad) return setProblem(bad.json.error ?? `Error ${bad.status}.`);
    setDocs(Object.fromEntries(full.map((x) => [x.json.component, x.json])));
  }, [expire, lock]);

  useEffect(() => { if (configured && session && !locked) load(session); }, [session, locked, load]);

  const replace = (doc) => setDocs((d) => ({ ...d, [doc.component]: doc }));

  const list = useMemo(() => Object.values(docs ?? {}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [docs]);
  const open = list.filter((d) => d.status !== "applied");
  const applied = list.filter((d) => d.status === "applied");
  const pending = open.filter((d) => d.status === "pending").length;

  if (!configured) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <Header />
        <Alert status="warning" title="The review service is not set up">Set PUBLIC_REVIEW_SERVICE_URL and PUBLIC_REVIEW_PROJECT (see .env.example), then restart the app.</Alert>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="flex flex-col gap-4">
        <Header session={session} onLogout={logout} />
        <ChangePasswordForm session={session} onExpired={expire} onDone={() => start({ ...session, user: { ...session.user, mustChangePassword: false } })} />
      </div>
    );
  }

  if (!session && !docs) {
    return (
      <div className="flex flex-col gap-4">
        <Header />
        <LoginForm onLogin={start} message={expired} expired={Boolean(expired)} />
      </div>
    );
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <Header
        session={session}
        onLogout={logout}
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
      {open.map((d) => <ReviewCard key={d.component} doc={d} session={session} onChanged={replace} onExpired={expire} onLocked={lock} onReload={() => session && load(session)} />)}
      {applied.length > 0 && (
        <>
          <h2 className="typo-semi-bold-text-lg">Applied</h2>
          {applied.map((d) => <ReviewCard key={d.component} doc={d} session={session} onChanged={replace} onExpired={expire} onLocked={lock} onReload={() => session && load(session)} />)}
        </>
      )}
    </div>
  );
}
