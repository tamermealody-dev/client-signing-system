// ---------------------------------------------------------------------------
// Demo-only admin auth. SRS section 11 requires the real dashboard to sit
// behind server-side authentication and authorization; this is a client-side
// stand-in so the /dashboard routes are gated by *something* while the app
// runs standalone. Do not reuse this for anything real - see README.md.
// ---------------------------------------------------------------------------

const SESSION_KEY = "css_admin_session_v1";
const DEMO_USER = "admin";
const DEMO_PASS = "admin123";

export function login(username, password) {
  if (username === DEMO_USER && password === DEMO_PASS) {
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
