import { previewProps } from "./helpers";
import { config } from "./review.config.js";

// The two prop sets to render for a removed property or option, or null when there is nothing to show.
// config.previews has one entry per component folder (src/components/<key>/): see review.config.js.
export function previewFor(doc, item) {
  const key = doc.code?.match(/components\/([^/]+)\//)?.[1];
  const spec = key ? config.previews?.[key] : null;
  const p = spec ? previewProps(spec, item) : null;
  return p ? { spec, ...p } : null;
}
