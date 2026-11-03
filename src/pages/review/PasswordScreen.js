import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Alert } from "components/alert";
import { Button } from "components/button";
import { Input } from "components/input";
import AuthLayout from "pages/review/AuthLayout";
import { changePassword } from "app/review/serviceClient";

const MIN = 10;

// The screen a new account sees after its first log in: it must choose its own password before anything else works.
// knownCurrent: the temporary password the person just typed to log in (kept in memory only). When it is there the
// form asks for the new password only; after a page reload it is gone and the form asks for the temporary one.
export default function PasswordScreen({ session, knownCurrent = null, onDone, onExpired, onLogout }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const oldPassword = knownCurrent ?? current;
  const tooShort = next.length > 0 && next.length < MIN;
  const mismatch = again.length > 0 && again !== next;
  const same = next.length > 0 && next === oldPassword;
  const ready = Boolean(oldPassword) && next.length >= MIN && again === next && !same;
  const name = session?.user?.name;
  const kind = show ? "text" : "password";

  const save = async (e) => {
    e?.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try { await changePassword(session, oldPassword, next); onDone(); } catch (err) {
      if (err.status === 401) onExpired(err.message);
      else setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form className="flex w-full max-w-sm flex-col gap-5" onSubmit={save}>
        <div className="flex flex-col gap-1">
          <span className="mb-2 flex size-10 items-center justify-center rounded-full border border-default" aria-hidden><KeyRound size={20} /></span>
          <h2 className="typo-semi-bold-text-xl">{name ? `Welcome, ${name}` : "Welcome"}</h2>
          <p className="typo-regular-text-sm">Choose your own password before you start. {knownCurrent ? "The temporary one you just used stops working." : "It replaces the temporary one the developer gave you."}</p>
        </div>
        {error && <Alert status="danger" title="Password not changed">{error}</Alert>}
        {knownCurrent === null && (
          <Input label="Temporary password" type={kind} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} caption="The one you just logged in with." />
        )}
        <Input
          label="New password"
          type={kind}
          autoComplete="new-password"
          autoFocus={knownCurrent !== null}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          status={tooShort || same ? "danger" : "default"}
          caption={same ? "Choose a different password than the temporary one." : `At least ${MIN} characters.`}
        />
        <Input
          label="Type the new password again"
          type={kind}
          autoComplete="new-password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          status={mismatch ? "danger" : "default"}
          caption={mismatch ? "The two passwords differ." : undefined}
        />
        <Button kind="text" size="sm" className="-ml-4 self-start" prefixIcon={show ? <EyeOff /> : <Eye />} onClick={() => setShow((v) => !v)}>
          {show ? "Hide passwords" : "Show passwords"}
        </Button>
        <Button type="submit" status="primary" loading={busy} disabled={!ready}>Save password and continue</Button>
        {onLogout && <Button kind="text" size="sm" onClick={onLogout}>Not you? Log out</Button>}
      </form>
    </AuthLayout>
  );
}
