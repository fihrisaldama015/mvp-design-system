// What to change for each answered review item. Pure: no imports, no I/O. buildPlan takes the stored review and, per removal item,
// the result of usageFor(usage, doc.jsxName, item) ({ count, routes, uses: [{ file, line, attrs }] }); planText renders it.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const label = (i) => (i.option !== undefined ? `${i.prop}="${i.option}"` : i.prop);
const where = (u) => `${u.file}:${u.line}`;

export function buildPlan(doc, usageByItem = {}) {
  const name = doc.component;
  const doneRun = { type: "run", text: `node scripts/figma/reviewSync.mjs --done "${name}"` };
  const noteOf = (id) => {
    const a = [...(doc.audit ?? [])].reverse().find((x) => x.action === "decided" && x.note && x.changes && id in x.changes);
    return a?.note;
  };
  const steps = (doc.items ?? []).map((i) => {
    const choice = doc.answers?.[i.id] ?? null;
    const uses = usageByItem[i.id]?.uses ?? [];
    const removal = i.kind.startsWith("removed");
    let kind, actions;
    if (!removal) {
      kind = "safe-addition";
      actions = [{ type: "run", text: `Safe to add (${i.kind} ${label(i)}): follow reference/existing-component.md; nothing is removed.` }];
    } else if (!choice) {
      kind = "unanswered";
      actions = [{ type: "wait", text: `Not answered yet: do not change code for ${label(i)}. The reviewers answer on the /review page.` }];
    } else if (choice === "keep") {
      kind = "keep";
      actions = [{ type: "wait", text: "Figma changes first: do not change code; publish again after the design is updated." }];
    } else if (choice === "keep-deprecated") {
      kind = "keep-deprecated";
      const by = DATE.test(String(doc.migrateBy?.[i.id] ?? "")) ? doc.migrateBy[i.id] : null;
      actions = [];
      if (i.kind === "removed-prop" && !i.deprecated) actions.push({ type: "edit", file: doc.code ?? undefined, text: `start the propTypes description of \`${i.prop}\` with \`@deprecated\` (component file${doc.code ? ` ${doc.code}` : ""}: dev repo only, do not edit it in the vibe repo)` });
      actions.push({ type: "wait", text: `Keep ${label(i)} until ${by ?? "(no valid migrate-by date: ask the reviewers)"}; ${uses.length ? `remaining uses to migrate: ${uses.map(where).join(", ")}` : "no uses remain"}.` });
      actions.push({ type: "run", text: `${doneRun.text} (it passes and prints the burn-down)` });
    } else {
      kind = "follow-figma";
      actions = [];
      if (i.kind === "removed-prop") {
        actions.push({ type: "edit", file: doc.code ?? undefined, text: `remove \`${i.prop}\` from propTypes and from the component (this is the dev repo's component file; in the vibe repo do not edit it: tell the developer and stop)` });
        for (const u of uses) actions.push({ type: "edit", file: u.file, line: u.line, text: `remove the \`${i.prop}\` attribute` });
        actions.push({ type: "run", text: "npm run usage (must report 0 uses)" });
      } else {
        for (const u of uses) actions.push({ type: "edit", file: u.file, line: u.line, text: `${i.prop}="${i.option}" is no longer in Figma: use one of the remaining options` });
        actions.push({ type: "run", text: "npm run usage (must report 0 uses)" });
      }
      actions.push(doneRun);
    }
    const note = removal && choice ? noteOf(i.id) : undefined;
    return { id: i.id, kind, choice, title: `${i.kind} ${label(i)}`, ...(note ? { note } : {}), actions };
  });
  return {
    component: name, status: doc.status, version: doc.version, steps,
    finalChecks: [
      "Re-read the Figma node and run reviewSync.mjs --verify <components file>: it must say unchanged",
      "npm test",
      "npm run build",
      `node scripts/figma/reviewSync.mjs --done "${name}"`,
    ],
  };
}

export function planText(plan) {
  const out = [`Plan for "${plan.component}" (status ${plan.status}, version ${plan.version})`, ""];
  plan.steps.forEach((s, n) => {
    out.push(`${n + 1}. ${s.title}  [${s.kind}]`);
    if (s.note) out.push(`   Reviewer's note: ${s.note}`);
    for (const a of s.actions) out.push(`   - ${a.type.toUpperCase()}${a.file ? ` ${a.file}${a.line ? `:${a.line}` : ""}` : ""}: ${a.text}`);
    out.push("");
  });
  out.push("Final checks:");
  plan.finalChecks.forEach((c, n) => out.push(`  ${n + 1}. ${c}`));
  return out.join("\n");
}
