import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Alert } from "components/alert";
import { Button } from "components/button";
import { Input } from "components/input";
import AuthLayout from "pages/review/AuthLayout";

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
    <AuthLayout>
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
    </AuthLayout>
  );
}
