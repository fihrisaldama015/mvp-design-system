import { ExternalLink } from "lucide-react";
import { Button } from "components/button";
import { frameUrls } from "app/review/helpers";

const PROTECTION = "Blank or a Vercel login? Turn off Deployment Protection for preview deployments.";

function Frame({ title, url, path }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="typo-semi-bold-text-sm">{title}</p>
        <Button as="a" href={url} target="_blank" rel="noreferrer" kind="outlined" size="sm" suffixIcon={<ExternalLink />}>Open in a new tab</Button>
      </div>
      <iframe title={`${title}: ${path}`} src={url} referrerPolicy="no-referrer" className="h-96 w-full rounded-default border border-default bg-surface" />
      <p className="text-caption typo-regular-text-sm">{PROTECTION}</p>
    </div>
  );
}

// The page as it is now next to the same page on the candidate preview (the Figma version), so the reviewers
// see the effect of a removal on a real screen. route: { path, url } from usageFor; previewUrl: the candidate's origin.
export default function PagePreview({ route, previewUrl }) {
  const { now, after, sample } = frameUrls(route, previewUrl, window.location.origin);
  if (!sample) {
    return <p className="text-caption typo-regular-text-sm">No preview: add a sample path for {route.path} in figma-tokens.config.json (review.routeSamples).</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 md:flex-row">
        <Frame title="Now" url={now} path={route.path} />
        {after && <Frame title="With the Figma version" url={after} path={route.path} />}
      </div>
      {!after && <p className="text-caption typo-regular-text-sm">No candidate preview published yet.</p>}
    </div>
  );
}
