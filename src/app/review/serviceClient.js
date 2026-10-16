// Client of the design review service (login, password change, the project's reviews).
// Set PUBLIC_REVIEW_SERVICE_URL and PUBLIC_REVIEW_PROJECT (see .env.example).
export const SERVICE = (import.meta.env.PUBLIC_REVIEW_SERVICE_URL ?? "").trim().replace(/\/$/, "");
export const PROJECT = (import.meta.env.PUBLIC_REVIEW_PROJECT ?? "").trim();
export const configured = Boolean(SERVICE && PROJECT);

const KEY = "review-session";

// The session is { token, user } as JSON in sessionStorage: gone when the tab closes.
export const sessionStore = {
  get() {
    try { return JSON.parse(window.sessionStorage.getItem(KEY) ?? "null"); } catch { return null; }
  },
  set(session) {
    try {
      if (session) window.sessionStorage.setItem(KEY, JSON.stringify(session));
      else window.sessionStorage.removeItem(KEY);
    } catch { /* private window: the session lasts until reload */ }
  },
};

async function send(url, method, token, body) {
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

// Resolves to { token, user }; rejects with an Error whose message is the service's, or a plain one when unreachable.
export async function login(email, password) {
  const r = await send(`${SERVICE}/api/v1/auth/login`, "POST", null, { email, password }).catch(() => null);
  if (!r) throw new Error("The review service could not be reached.");
  if (!r.ok) throw new Error(r.json.error ?? `Error ${r.status}.`);
  return { token: r.json.token, user: r.json.user };
}

export async function changePassword(session, current, next) {
  const r = await send(`${SERVICE}/api/v1/auth/password`, "POST", session.token, { current, next }).catch(() => null);
  if (!r) throw new Error("The review service could not be reached.");
  if (!r.ok) throw Object.assign(new Error(r.json.error ?? `Error ${r.status}.`), { status: r.status });
}

// { status, ok, json } for the project's reviews; path is "" (list) or "/<slug>" or "/<slug>/decision".
export function call(session, method, path = "", body) {
  return send(`${SERVICE}/api/v1/projects/${PROJECT}/reviews${path}`, method, session?.token, body);
}
