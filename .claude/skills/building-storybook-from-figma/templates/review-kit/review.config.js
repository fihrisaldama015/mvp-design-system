// The only file of the review page that belongs to the project (the installer creates it once and never overwrites it).
// Everything else in this folder is the shared kit: the same page, look and behaviour in every project.
import usage from "./usage.json"; // written by `npm run usage` (node scripts/figma/usageScan.mjs)

export const config = {
  // The design review service (origin only) and the project slug it gave you. Read them the way this project reads its settings.
  serviceUrl: import.meta.env.PUBLIC_REVIEW_SERVICE_URL,
  project: import.meta.env.PUBLIC_REVIEW_PROJECT,
  usage,
  // Optional. A line shown above the preview frames: what the reviewers will meet in the app that is not part of the review
  // (a welcome dialog, a cookie banner, a login step).
  // frameNote: "Close the welcome dialog first.",
  // Live "with it / without it" boxes, one entry per component folder (src/components/<key>/). Optional: without an entry the
  // reviewers still get the page frames. Each entry:
  //   Component  the real component        sample     props both previews share
  //   controlled the component needs value + onChange (a select)
  //   wide       the component fills its width (an alert); otherwise it gets a fixed, form-sized width
  //   examples   per property ("prop") or removed option ("prop=option"): { with, without, hint? }
  //   hint       what to try
  // A boolean property needs no example: it is rendered on and off.
  previews: {
    // button: { Component: Button, sample: { children: "Save" } },
  },
};
