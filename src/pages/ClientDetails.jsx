import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import StatusBadge from "../components/StatusBadge";
import QrCode from "../components/QrCode";
import { getClientById, deleteClient, cancelClient, extendExpiry } from "../lib/db";
import "./ClientDetails.css";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(undefined);
  const [toast, setToast] = useState("");
  const [editingExpiry, setEditingExpiry] = useState(false);

  useEffect(() => {
    getClientById(id).then(setClient);
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  if (client === undefined) {
    return (
      <AdminLayout>
        <p>Loading…</p>
      </AdminLayout>
    );
  }

  if (client === null) {
    return (
      <AdminLayout>
        <div className="card details-notfound">
          <h1>Client not found</h1>
          <p>This client may have been deleted.</p>
          <Link to="/dashboard" className="btn btn-quiet">
            Back to dashboard
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const url = `${window.location.origin}/sign/${client.token}`;

  async function handleDelete() {
    if (!window.confirm(`Delete the signing request for ${client.name}? This cannot be undone.`)) {
      return;
    }
    await deleteClient(client.id);
    navigate("/dashboard", { replace: true });
  }

  async function handleCancel() {
    const updated = await cancelClient(client.id);
    if (updated.success) setClient(updated.client);
  }

  async function handleExpirySave(e) {
    e.preventDefault();
    const raw = e.target.expiresAt.value;
    const expiresAt = raw ? `${raw}T23:59:59` : null;
    const updated = await extendExpiry(client.id, expiresAt);
    if (updated.success) {
      setClient(updated.client);
      setEditingExpiry(false);
      setToast(expiresAt ? "Expiry date updated" : "Expiry date removed");
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(url);
    setToast("Link copied");
  }

  return (
    <AdminLayout>
      <Link to="/dashboard" className="details-back">
        Back to clients
      </Link>

      <div className="details-head">
        <div>
          <p className="mono details-id">{client.id}</p>
          <h1>{client.name}</h1>
        </div>
        <StatusBadge status={client.status} />
      </div>

      <div className="details-grid">
        <div className="card details-panel">
          <dl className="details-list">
            <div>
              <dt>Age</dt>
              <dd>{client.age}</dd>
            </div>
            <div>
              <dt>Client token</dt>
              <dd className="mono">{client.token}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(client.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Signed</dt>
              <dd>{client.signedAt ? new Date(client.signedAt).toLocaleString() : "Not yet signed"}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd className={client.status === "expired" ? "details-expiry-overdue" : ""}>
                {client.expiresAt ? new Date(client.expiresAt).toLocaleDateString() : "No expiry set"}
              </dd>
            </div>
          </dl>

          {editingExpiry ? (
            <form className="details-expiry-form" onSubmit={handleExpirySave}>
              <input
                type="date"
                name="expiresAt"
                defaultValue={client.expiresAt ? client.expiresAt.slice(0, 10) : ""}
              />
              <button type="submit" className="btn btn-quiet">
                Save
              </button>
              <button type="button" className="btn btn-text" onClick={() => setEditingExpiry(false)}>
                Cancel
              </button>
            </form>
          ) : (
            client.status !== "signed" && (
              <button className="btn btn-text details-expiry-edit" onClick={() => setEditingExpiry(true)}>
                {client.expiresAt ? "Change expiry date" : "Set an expiry date"}
              </button>
            )
          )}

          <hr className="hairline" />

          <div className="details-link-row">
            <input readOnly value={url} className="details-link-input" onFocus={(e) => e.target.select()} />
            <button className="btn btn-quiet" onClick={copyLink}>
              Copy
            </button>
          </div>

          <div className="details-actions">
            <a className="btn btn-quiet" href={`/sign/${client.token}`} target="_blank" rel="noreferrer">
              Open signing page
            </a>
            {client.status === "pending" && (
              <button className="btn btn-quiet" onClick={handleCancel}>
                Cancel request
              </button>
            )}
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete client
            </button>
          </div>
        </div>

        <div className="card details-qr-panel">
          <QrCode value={url} size={160} />
          <p className="details-qr-caption">Scan to open the signing page</p>
        </div>
      </div>

      <div className="card details-signature">
        <h2>Signature</h2>
        {client.signature ? (
          <img src={client.signature} alt={`${client.name}'s signature`} className="signature-img" />
        ) : (
          <p className="details-empty">No signature submitted yet.</p>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </AdminLayout>
  );
}
