import { useState } from "react";
import { Eye, EyeOff, Gavel, Layers, LockKeyhole, Save } from "lucide-react";
import { Alert } from "components/alert";
import { Button } from "components/button";
import { Input } from "components/input";

// What the reviewer will do here, in the order they will do it.
const STEPS = [
  { Icon: Layers, title: "See what changed", text: "The developers list what the code has that Figma no longer has, and where the app uses it." },
  { Icon: Gavel, title: "Choose what happens", text: "Remove it, keep it as old, or keep it and add it to Figma. Every option explains its effect." },
  { Icon: Save, title: "Save your answers", text: "Nothing changes in the code until a developer applies your answer." },
];

// The log in screen of the review page: a short explanation next to the form (stacked on a phone).
// notice: { title, text } shown above the form, for a session that ended.
// onSubmit(email, password) resolves when the log in worked and rejects with an Error whose message is shown.
export default function LoginScreen({ onSubmit, notice = null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const enter = async (e) => {
    e?.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true);
    setError(null);
    try { await onSubmit(email.trim(), password); } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-surface md:grid-cols-2">
      <section className="flex flex-col justify-center gap-8 bg-primary-default px-page-padding py-10 text-base-color md:py-16">
        <div className="flex max-w-lg flex-col gap-3">
          <p className="typo-medium-text-sm uppercase tracking-wide opacity-80">Design system review</p>
          <h1 className="typo-semi-bold-text-2xl">Decide how the components should change</h1>
          <p className="typo-regular-text-base opacity-90">The design and the code have drifted apart in a few places. You choose which one wins.</p>
        </div>
        <ol className="flex max-w-lg flex-col gap-5">
          {STEPS.map(({ Icon, title, text }, n) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-current opacity-90" aria-hidden><Icon size={20} /></span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="typo-semi-bold-text-base">{n + 1}. {title}</p>
                <p className="typo-regular-text-sm opacity-90">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex items-center justify-center px-page-padding py-10 md:py-16">
        <form className="flex w-full max-w-sm flex-col gap-5" onSubmit={enter}>
          <div className="flex flex-col gap-1">
            <span className="mb-2 flex size-10 items-center justify-center rounded-full border border-default" aria-hidden><LockKeyhole size={20} /></span>
            <h2 className="typo-semi-bold-text-xl">Log in to review</h2>
            <p className="text-caption typo-regular-text-sm">Use the account the developer made for you.</p>
          </div>
          {notice && !error && <Alert status="warning" title={notice.title}>{notice.text}</Alert>}
          {error && <Alert status="danger" title="Cannot log in">{error}</Alert>}
          <Input label="Email" type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex flex-col gap-1">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              caption="Ask the developer if you do not have an account."
            />
            <Button kind="text" size="sm" className="-ml-4 self-start" prefixIcon={showPassword ? <EyeOff /> : <Eye />} onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "Hide password" : "Show password"}
            </Button>
          </div>
          <Button type="submit" status="primary" loading={busy} disabled={!email || !password}>Log in</Button>
        </form>
      </section>
    </div>
  );
}
