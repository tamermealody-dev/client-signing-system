// ---------------------------------------------------------------------------
// Mock backend.
//
// The SRS (sections 12-13) calls for a real server, database and API. This
// module implements that same contract entirely in the browser (localStorage)
// so the app runs standalone. Every function is async and returns the same
// shape a real fetch() call to the documented endpoints would, so swapping
// this file for real `fetch("/api/clients")` calls later is a drop-in change
// - nothing in components/pages needs to know the difference.
//
// This is a scaffold, not production storage: localStorage is per-browser,
// unencrypted, and has no server-side validation or auth. See README.md,
// "Moving to a real backend", before handling real client data.
// ---------------------------------------------------------------------------

import { generateClientToken } from "./id";

const STORE_KEY = "css_clients_v1";
const SEQ_KEY = "css_seq_v1";

function readAll() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(clients) {
  localStorage.setItem(STORE_KEY, JSON.stringify(clients));
}

function nextDisplayId() {
  const n = Number(localStorage.getItem(SEQ_KEY) || "0") + 1;
  localStorage.setItem(SEQ_KEY, String(n));
  return `CL${String(n).padStart(3, "0")}`;
}

function delay(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isExpired(client) {
  if (!client.expiresAt) return false;
  return Date.now() > new Date(client.expiresAt).getTime();
}

function serialize(client) {
  // Never let a client-facing lookup accidentally reveal another record's
  // internal database id - only the opaque token is used in URLs (SRS 8, 11).
  return { ...client };
}

/** POST /api/clients */
export async function createClient({ name, age, expiresAt }) {
  await delay();
  const clients = readAll();
  const client = {
    id: nextDisplayId(),
    token: generateClientToken(),
    name: name.trim(),
    age: Number(age),
    status: "pending",
    signature: null,
    createdAt: new Date().toISOString(),
    signedAt: null,
    expiresAt: expiresAt || null,
  };
  clients.push(client);
  writeAll(clients);
  return {
    success: true,
    clientId: client.token,
    clientUrl: `/sign/${client.token}`,
    client: serialize(client),
  };
}

/** GET /api/clients */
export async function listClients() {
  await delay();
  const clients = readAll().map((c) =>
    c.status === "pending" && isExpired(c) ? { ...c, status: "expired" } : c
  );
  return clients.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** GET /api/clients/:token - used by both the admin details page and the
 * public signing page. Only non-sensitive, per-record data is ever returned;
 * there is no way to enumerate other clients from a token (SRS 11). */
export async function getClientByToken(token) {
  await delay();
  const clients = readAll();
  const client = clients.find((c) => c.token === token);
  if (!client) return null;
  if (client.status === "pending" && isExpired(client)) {
    return { ...client, status: "expired" };
  }
  return serialize(client);
}

export async function getClientById(id) {
  await delay();
  const clients = readAll();
  const client = clients.find((c) => c.id === id);
  return client ? serialize(client) : null;
}

/** POST /api/clients/:token/sign */
export async function signClient(token, { name, age, signature }) {
  await delay();
  const clients = readAll();
  const idx = clients.findIndex((c) => c.token === token);
  if (idx === -1) return { success: false, error: "not_found" };

  const client = clients[idx];
  if (client.status === "signed") {
    // SRS 11: prevent duplicate signing for one-time requests.
    return { success: false, error: "already_signed" };
  }
  if (isExpired(client)) {
    return { success: false, error: "expired" };
  }

  clients[idx] = {
    ...client,
    name: name.trim(),
    age: Number(age),
    signature,
    status: "signed",
    signedAt: new Date().toISOString(),
  };
  writeAll(clients);
  return { success: true, client: serialize(clients[idx]) };
}

/** DELETE /api/clients/:id */
export async function deleteClient(id) {
  await delay();
  const clients = readAll().filter((c) => c.id !== id);
  writeAll(clients);
  return { success: true };
}

/** Extend (or set) a pending client's expiry date. SRS §10 lists "Expired" as
 * an optional status the admin controls via an expiration date. */
export async function extendExpiry(id, expiresAt) {
  await delay();
  const clients = readAll();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return { success: false };
  clients[idx] = { ...clients[idx], expiresAt: expiresAt || null };
  writeAll(clients);
  return { success: true, client: serialize(clients[idx]) };
}

/** Admin cancel, distinct from delete - keeps the record but closes the request. */
export async function cancelClient(id) {
  await delay();
  const clients = readAll();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return { success: false };
  clients[idx] = { ...clients[idx], status: "cancelled" };
  writeAll(clients);
  return { success: true, client: serialize(clients[idx]) };
}
