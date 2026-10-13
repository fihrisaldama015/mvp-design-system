import { Alert } from "components/alert";
import { Button } from "components/button";
import { Select } from "components/select";

// Live previews for the review page. When a property is gone from Figma, the reviewers see the real
// component twice: as Figma has it, and as the code has it, so they can compare without a developer.
// One entry per component folder (src/components/<key>/): add one when a review involves a visual property.
//   Component  the real component        sample     props both previews share
//   controlled the component needs value + onChange (Select)
//   wide       the component fills its width (Alert); otherwise it gets a fixed, form-sized width
//   examples   per property: { with, without } props, for a property that is not a simple on/off switch
//   hint       what to try
// A boolean property (a removal with a default of true or false) needs no example: it is rendered on and off.
const CATEGORIES = [
  { value: "camera", label: "Camera" },
  { value: "laptop", label: "Laptop" },
  { value: "audio", label: "Audio" },
  { value: "lighting", label: "Lighting" },
  { value: "tripod", label: "Tripod" },
];

export const PREVIEWS = {
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
      action: {
        with: { action: <Button size="sm" kind="outlined">Remind all</Button> },
        without: {},
      },
    },
    hint: "The alert with an action shows a button on the right.",
  },
};

// The two prop sets to render for a removed property, or null when there is nothing to show.
export function previewFor(doc, item) {
  const key = doc.code?.match(/components\/([^/]+)\//)?.[1];
  const spec = key ? PREVIEWS[key] : null;
  if (!spec || item.kind !== "removed-prop") return null;
  const example = spec.examples?.[item.prop];
  if (example) return { spec, with: example.with, without: example.without };
  if (item.default === "true" || item.default === "false") return { spec, with: { [item.prop]: true }, without: { [item.prop]: false } };
  return null;
}
