# Signet — Client Signing & Verification System

A React scaffold of the Client Signing & Verification System described in the
SRS: an administrator creates a signing request, the client opens it by
unique link or QR code, fills in their name and age, signs on a canvas, and
the admin can track and review status.

This is a **frontend scaffold**. It runs standalone in the browser with no
server, using `localStorage` as a stand-in database, so you can see and use
the whole flow immediately. The "Moving to a real backend" section below
covers what to replace before handling real client data.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. You'll land on the admin dashboard.

**Demo admin login:** `admin` / `admin123` (see `src/lib/auth.js`)

## What's implemented

- **Admin dashboard** (`/dashboard`) — ledger of all clients, search by name
  or ID, create a new client (auto-generates a unique token, link and QR
  code), copy link, download QR as PNG, view details, delete.
- **Client details page** (`/clients/:id`) — full record, status, QR code,
  copy link, cancel/delete, and the submitted signature once signed.
- **Public signing page** (`/sign/:token`) — the page a client reaches via
  the link or QR code. Editable name/age, a signature pad (mouse, touch and
  pen via Pointer Events, with Clear), inline validation matching the SRS's
  required-field rules, and a confirmation screen on success. Handles
  not-found, expired, cancelled and already-signed states.
- **Status lifecycle** — `pending → signed`, plus optional `expired` /
  `cancelled`, as described in SRS section 10.
- **Mock API layer** (`src/lib/db.js`) — implements the same function
  signatures as the REST endpoints in SRS section 13
  (`createClient`, `getClientByToken`, `listClients`, `signClient`,
  `deleteClient`, `cancelClient`) so it's a drop-in swap for real HTTP calls.

## What's intentionally out of scope here

Per SRS sections 11–13, a production system needs a real server, database,
and auth layer. This scaffold does not include:

- A backend server or real database (Postgres/MySQL/MongoDB).
- Real admin authentication/authorization (server-side sessions, hashed
  passwords, rate limiting).
- Server-side validation (all validation here is client-side only, which is
  necessary for UX but never sufficient for security).
- Signature storage in durable, access-controlled storage (signatures are
  currently stored as base64 PNGs inside `localStorage`).
- Legal-compliance features called out in SRS section 18 (identity
  verification, consent capture, audit logging, timestamping/integrity
  proofs) — required only if the signature must be legally binding.

## Moving to a real backend

Everything in the UI talks to `src/lib/db.js`, and every function there
mirrors a documented endpoint:

| `db.js` function        | Endpoint (SRS §13)              |
|--------------------------|----------------------------------|
| `createClient`           | `POST /api/clients`             |
| `listClients`            | `GET /api/clients`               |
| `getClientByToken`       | `GET /api/clients/:token`        |
| `signClient`             | `POST /api/clients/:token/sign`  |
| `deleteClient`           | `DELETE /api/clients/:id`        |

To connect a real backend, replace the bodies of these functions with
`fetch()` calls to your API — the function names, arguments and return
shapes (`{ success, clientId, clientUrl, client }` etc.) were designed to
match, so no page or component needs to change. Also add:

- Real auth in `src/lib/auth.js` (e.g. a session cookie + a `/api/login`
  call) and enforce it server-side, not just in the router.
- A signature upload step (send the canvas PNG to your server/object storage
  instead of embedding it as a data URL).
- Server-side re-validation of name/age/signature on submit, and of the
  token's status (don't trust the client's belief that a request is still
  `pending`).

## Project structure

```
src/
  components/       SignaturePad, QrCode, StatusBadge, AdminLayout
  pages/            Login, Dashboard, ClientDetails, SignPage
  lib/
    db.js           Mock data layer (see table above)
    auth.js         Demo-only admin auth guard
    id.js           Unique client token generator (CL-XXXXXXX)
  styles/
    tokens.css      Design tokens (color, type, spacing)
    global.css      Base styles + shared UI primitives
```

## Tech

React 19 + Vite, `react-router-dom` for routing, the `qrcode` package for QR
generation, and a small dependency-free canvas signature pad (Pointer
Events, so it works with mouse, touch and stylus). No CSS framework — a
small custom token system in `src/styles/tokens.css`.

## Notes on the design

The visual language leans on the subject matter — sealing and signing a
document — rather than a generic dashboard look: an oxblood "wax seal" accent,
a serif for headings paired with a plain sans for UI text, a ledger-style
table with hairline rules for the client list, and a stamp animation on the
signing confirmation screen.
