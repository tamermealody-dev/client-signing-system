import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import AdminLayout from "../components/AdminLayout";
import StatusBadge from "../components/StatusBadge";
import QrCode from "../components/QrCode";
import { createClient, listClients, deleteClient } from "../lib/db";
import "./Dashboard.css";

function originUrl() {
  return window.location.origin;
}

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [justCreated, setJustCreated] = useState(null);
  const [toast, setToast] = useState("");

  async function refresh() {
    setLoading(true);
    setClients(await listClients());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [clients, query]);

  async function handleCreate(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const age = form.age.value;
    if (!name.trim() || !age) return;

    const result = await createClient({ name, age });
    setShowForm(false);
    form.reset();
    setJustCreated(result.client);
    await refresh();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete the signing request for ${name}? This cannot be undone.`)) {
      return;
    }
    await deleteClient(id);
    if (justCreated?.id === id) setJustCreated(null);
    await refresh();
  }

  function copyLink(token) {
    const url = `${originUrl()}/sign/${token}`;
    navigator.clipboard?.writeText(url);
    setToast("Link copied");
  }

  async function downloadQr(token, name) {
    const dataUrl = await QRCode.toDataURL(`${originUrl()}/sign/${token}`, {
      width: 512,
      margin: 2,
    });
    const link = document.createElement("a");
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.href = dataUrl;
    link.click();
  }

  return (
    <AdminLayout>
      <div className="dash-head">
        <div>
          <h1>Clients</h1>
          <p className="dash-sub">{clients.length} signing request{clients.length === 1 ? "" : "s"}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "New client"}
        </button>
      </div>

      {showForm && (
        <form className="card new-client-card" onSubmit={handleCreate}>
          <div className="new-client-row">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" placeholder="e.g. Ahmed Ali" required />
            </div>
            <div className="field">
              <label htmlFor="age">Age</label>
              <input id="age" name="age" type="number" min="0" max="130" placeholder="25" required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Generate link &amp; QR code
          </button>
        </form>
      )}

      {justCreated && (
        <div className="card created-card">
          <div className="created-qr">
            <QrCode value={`${originUrl()}/sign/${justCreated.token}`} />
          </div>
          <div className="created-body">
            <p className="created-eyebrow">Request created for</p>
            <h2>{justCreated.name}</h2>
            <p className="mono created-id">{justCreated.token}</p>
            <div className="created-link-row">
              <input
                readOnly
                className="created-link-input"
                value={`${originUrl()}/sign/${justCreated.token}`}
                onFocus={(e) => e.target.select()}
              />
              <button className="btn btn-quiet" onClick={() => copyLink(justCreated.token)}>
                Copy
              </button>
            </div>
            <div className="created-actions">
              <a className="btn btn-quiet" href={`/sign/${justCreated.token}`} target="_blank" rel="noreferrer">
                Open signing page
              </a>
              <Link className="btn btn-quiet" to={`/clients/${justCreated.id}`}>
                View client
              </Link>
              <button
                className="btn btn-quiet"
                onClick={() => downloadQr(justCreated.token, justCreated.name)}
              >
                Download QR
              </button>
              <button className="btn btn-text" onClick={() => setJustCreated(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dash-toolbar">
        <input
          className="dash-search"
          placeholder="Search by name or client ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="dash-empty">Loading clients…</p>
      ) : filtered.length === 0 ? (
        <div className="dash-empty card">
          <p>{clients.length === 0 ? "No signing requests yet." : "No clients match that search."}</p>
          {clients.length === 0 && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Create the first one
            </button>
          )}
        </div>
      ) : (
        <table className="ledger">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Status</th>
              <th>Created</th>
              <th>Signed</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="mono">{c.id}</td>
                <td>
                  <Link to={`/clients/${c.id}`} className="ledger-name">
                    {c.name}
                  </Link>
                </td>
                <td>{c.age}</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td>{c.signedAt ? new Date(c.signedAt).toLocaleDateString() : "—"}</td>
                <td className="ledger-actions">
                  <button className="btn btn-text" onClick={() => copyLink(c.token)}>
                    Copy link
                  </button>
                  <button className="btn btn-text" onClick={() => downloadQr(c.token, c.name)}>
                    QR
                  </button>
                  <Link className="btn btn-text" to={`/clients/${c.id}`}>
                    View
                  </Link>
                  <button className="btn btn-text ledger-delete" onClick={() => handleDelete(c.id, c.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {toast && <div className="toast">{toast}</div>}
    </AdminLayout>
  );
}
