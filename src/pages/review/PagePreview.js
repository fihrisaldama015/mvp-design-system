import { useCallback, useEffect, useMemo, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "components/button";
import { Toggle } from "components/toggle";
import { frameUrls } from "app/review/helpers";

const PROTECTION = "Blank or a Vercel login? Turn off Deployment Protection for preview deployments.";

// One preview frame. When `folder` is set, the toggle asks the app inside the frame (app/review/embedHighlight) to outline every
// instance of that component. The state is sent again when the frame loads, because a new page in the frame starts without it.
function Frame({ title, url, embed, path, folder, name, highlight, onHighlight }) {
  const ref = useRef(null);
  const origin = useMemo(() => { try { return new URL(embed, window.location.origin).origin; } catch { return null; } }, [embed]);
  const send = useCallback(() => {
    if (origin && folder && ref.current?.contentWindow) ref.current.contentWindow.postMessage({ type: "review-highlight", on: Boolean(highlight), folder }, origin);
  }, [origin, folder, highlight]);
  useEffect(send, [send]);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="typo-semi-bold-text-sm">{title}</p>
        <div className="flex items-center gap-3">
          {folder && <Toggle checked={Boolean(highlight)} onChange={onHighlight} label={`Highlight ${name}`} />}
          <Button as="a" href={url} target="_blank" rel="noreferrer" kind="outlined" size="sm" suffixIcon={<ExternalLink />}>Open in a new tab</Button>
        </div>
      </div>
      <iframe ref={ref} onLoad={send} title={`${title}: ${path}`} src={embed} referrerPolicy="no-referrer" style={{ height: "75vh" }} className="w-full rounded-default border border-default bg-surface" />
      <p className="text-caption typo-regular-text-sm">{PROTECTION}</p>
    </div>
  );
}

// The page as it is now next to the same page on the candidate preview (the Figma version), so the reviewers
// see the effect of a removal on a real screen. route: { path, url } from usageFor; previewUrl: the candidate's origin.
// folder and name: the component under review (its folder in src/components, and its name), for the highlight toggle.
export default function PagePreview({ route, previewUrl, folder, name, highlight, onHighlight }) {
  const { now, after, nowEmbed, afterEmbed, sample } = frameUrls(route, previewUrl, window.location.origin);
  if (!sample) {
    return <p className="text-caption typo-regular-text-sm">No preview: add a sample path for {route.path} in figma-tokens.config.json (review.routeSamples).</p>;
  }
  const shared = { path: route.path, folder, name, highlight, onHighlight };
  return (
    <div className="review-enter flex flex-col gap-3">
      <div className="flex flex-col gap-4 md:flex-row">
        <Frame title="Now" url={now} embed={nowEmbed} {...shared} />
        {after && <Frame title="With the Figma version" url={after} embed={afterEmbed} {...shared} />}
      </div>
      {!after && <p className="text-caption typo-regular-text-sm">No candidate preview published yet.</p>}
    </div>
  );
}
