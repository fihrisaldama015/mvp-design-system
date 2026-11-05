// The only file of the review page that belongs to this project. The rest of this folder is the shared kit (see index.js).
import { Alert } from "components/alert";
import { Button } from "components/button";
import { Select } from "components/select";
import usage from "./usage.json"; // written by `npm run usage`

const CATEGORIES = [
  { value: "camera", label: "Camera" },
  { value: "laptop", label: "Laptop" },
  { value: "audio", label: "Audio" },
  { value: "lighting", label: "Lighting" },
  { value: "tripod", label: "Tripod" },
];

export const config = {
  serviceUrl: import.meta.env.PUBLIC_REVIEW_SERVICE_URL,
  project: import.meta.env.PUBLIC_REVIEW_PROJECT,
  usage,
  // Live "with it / without it" boxes, one entry per component folder (src/components/<key>/). Entry keys: Component, sample,
  // controlled (needs value + onChange), wide (fills its width), examples ("prop" or "prop=option": { with, without, hint? }), hint.
  // A boolean property needs no example: it is rendered on and off.
  previews: {
    select: {
      Component: Select,
      controlled: true,
      sample: { options: CATEGORIES, placeholder: "Choose a category" },
      hint: "Click the dropdown to open its menu, then compare the two.",
    },
    alert: {
      Component: Alert,
      wide: true,
      sample: { status: "warning", title: "3 loans are overdue", children: "Send a reminder to the borrowers." },
      examples: {
        action: { with: { action: <Button size="sm" kind="outlined">Remind all</Button> }, without: {} },
        "kind=outlined": { with: { kind: "outlined" }, without: { kind: "filled" }, hint: "The outlined alert has a border and no fill, the filled one is solid." },
      },
      hint: "The alert with an action shows a button on the right.",
    },
  },
};
