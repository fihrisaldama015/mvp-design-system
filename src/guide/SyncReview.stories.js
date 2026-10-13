import { useEffect, useState } from "react";
import { Alert } from "components/alert";
import { Badge } from "components/badge";
import { Button } from "components/button";
import { Select } from "components/select";

const RECEIVER = "http://localhost:9232";
const FILE = "review-decisions.json";

const CHOICES = [
  { value: "follow-figma", label: "Remove it, follow Figma" },
  { value: "keep-deprecated", label: "Keep it as deprecated" },
  { value: "keep", label: "Keep it, ask the designer to add it to Figma" },
];

const KIND_LABEL = {
  "added-prop": "New prop",
  "added-option": "New option",
  "default-changed": "Default changes",
  "removed-prop": "Gone from Figma",
  "removed-option": "Gone from Figma",
};

const when = (iso) => (iso ? new Date(iso).toLocaleString() : "");

/**
 * Sync review: the page the dev answers before a component that already exists is
 * synced from Figma. Additions are safe and go in. A prop or option that Figma no
 * longer has needs an answer: remove it, keep it as deprecated (callers keep
 * working, new pages get it off by default), or keep it and ask the designer. The
 * answers are saved as `review-decisions.json` (you can save some now and answer the rest later, e.g. while waiting for someone) next to the Figma dump, and the page
 * shows what is saved there when it opens, so a refresh does not lose them. The review itself
 * (`.figma-dump/sync-review.json`) is read from the receiver too: it lives on the machine that ran the sync, not in git.
 */
export default {
  title: "Guide/Sync review",
  parameters: { layout: "padded", docs: { page: null } },
};

function Item({ item, choice, onChoice }) {
  const needs = item.kind.startsWith("removed");
  return (
    <li className="flex flex-col gap-2 border-b border-default py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={needs ? "warning" : item.kind === "default-changed" ? "info" : "success"}>{KIND_LABEL[item.kind]}</Badge>
        <code className="typo-semi-bold-text-sm">{item.prop}{item.option ? `="${item.option}"` : ""}</code>
        {item.callers !== undefined && <span className="text-caption typo-regular-text-sm">{item.callers} app + {item.storyCallers ?? 0} story files{item.onByDefault ? ", on by default: every caller gets it" : " use it"}</span>}
        {item.deprecated && <Badge tone="neutral">already deprecated</Badge>}
      </div>
      <p className="text-caption typo-regular-text-sm">{item.detail}</p>
      {needs && (
        <div className="w-96">
          <Select options={CHOICES} value={choice ?? ""} placeholder="Choose what to do" onChange={onChoice} />
        </div>
      )}
    </li>
  );
}

function Review() {
  const [review, setReview] = useState(null); // { components }, or null while loading / when there is none
  const [receiverDown, setReceiverDown] = useState(false);
  const names = Object.keys(review?.components ?? {});
  const [answers, setAnswers] = useState({});
  const [saved, setSaved] = useState(null); // { at, answers } as stored in the file, or null
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // What the file already holds is the truth: show it instead of an empty form.
  useEffect(() => {
    const get = (name) => fetch(`${RECEIVER}/load?name=${name}`).then((r) => (r.ok ? r.json() : null));
    Promise.all([get("sync-review.json"), get(FILE)])
      .then(([rev, file]) => {
        setReview(rev);
        if (file?.decisions) {
          setAnswers(file.decisions);
          setSaved({ at: file.decidedAt, answers: file.decisions });
        }
      })
      .catch(() => setReceiverDown(true))
      .finally(() => setLoaded(true));
  }, []);

  if (receiverDown) return <Alert status="warning" title="The receiver is not running">The review lives on this machine and is read through the receiver: <code>npm run figma:receiver</code>, then reload.</Alert>;
  if (!loaded) return null;
  if (!names.length) return <Alert status="info" title="Nothing to review on this machine">Reviews are made by <code>scripts/figma/reviewSync.mjs</code> when a component that already exists is synced from Figma, and stay on the machine that ran it.</Alert>;

  const open = names.flatMap((n) => review.components[n].items.filter((i) => i.kind.startsWith("removed")).map((i) => `${n}/${i.id}`));
  const missing = open.filter((k) => !answers[k]);
  const current = Object.fromEntries(open.filter((k) => answers[k]).map((k) => [k, answers[k]]));
  const unchanged = saved && JSON.stringify(current) === JSON.stringify(Object.fromEntries(open.filter((k) => saved.answers[k]).map((k) => [k, saved.answers[k]])));
  const payload = () => JSON.stringify({ decidedAt: new Date().toISOString(), decisions: current }, null, 2);

  const save = async () => {
    setError(null);
    try {
      const body = payload();
      const res = await fetch(`${RECEIVER}/save?name=${FILE}`, { method: "POST", body });
      if (!res.ok) throw new Error(`Receiver answered ${res.status}.`);
      setSaved({ at: JSON.parse(body).decidedAt, answers: current });
    } catch (e) {
      setError(e.message.startsWith("Receiver") ? e.message : "The receiver on port 9232 is not running. Copy the answers below instead.");
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      {names.map((n) => {
        const c = review.components[n];
        const safe = c.items.filter((i) => !i.kind.startsWith("removed"));
        const needs = c.items.filter((i) => i.kind.startsWith("removed"));
        return (
          <section key={n} className="flex flex-col gap-2">
            <h2 className="typo-semi-bold-text-lg">{n}</h2>
            <p className="text-caption typo-regular-text-sm">Figma {c.figmaPage} · node {c.figmaNode} · code {c.code}</p>
            <ul>
              {needs.map((i) => <Item key={i.id} item={i} choice={answers[`${n}/${i.id}`]} onChoice={(v) => setAnswers((a) => ({ ...a, [`${n}/${i.id}`]: v }))} />)}
              {safe.map((i) => <Item key={i.id} item={i} />)}
            </ul>
          </section>
        );
      })}
      <div className="flex items-center gap-3">
        <Button status="primary" disabled={!loaded || Object.keys(current).length === 0 || unchanged} onClick={save}>{unchanged ? "Saved" : "Save answers"}</Button>
        <span className="text-caption typo-regular-text-sm">
          {unchanged ? `Saved ${when(saved.at)}` : saved ? "You changed an answer: save again" : Object.keys(current).length ? "Not saved yet" : "Answer at least one removal to save"}
          {missing.length ? `${unchanged || saved ? " · " : " · "}${missing.length} still waiting for an answer (they stay pending; the agent will not touch them)` : ""}
        </span>
      </div>
      {unchanged && <Alert status="success" title="Saved">review-decisions.json is in the Figma dump folder. Tell the agent to continue; nothing is applied until you do.{missing.length ? " Items without an answer stay pending, you can answer them later." : ""}</Alert>}
      {error && <Alert status="danger" title="Not saved">{error}</Alert>}
      {error && <pre className="overflow-auto rounded-default bg-default-default p-3 typo-regular-text-sm">{payload()}</pre>}
    </div>
  );
}

export const Overview = { render: () => <Review /> };
