import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignaturePad from "../components/SignaturePad";
import { getClientByToken, signClient } from "../lib/db";
import "./SignPage.css";

const AGE_MIN = 0;
const AGE_MAX = 130;
const WARNING_WINDOW_DAYS = 2;

function daysUntil(dateString) {
  const ms = new Date(dateString).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function SignPage() {
  const { token } = useParams();
  const padRef = useRef(null);

  const [client, setClient] = useState(undefined); // undefined = loading, null = not found
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sigEmpty, setSigEmpty] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getClientByToken(token).then((c) => {
      setClient(c);
      if (c) {
        setName(c.name || "");
        setAge(c.age ? String(c.age) : "");
      }
    });
  }, [token]);

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "Please enter your full name.";
    else if (!/^[a-zA-Z\u0600-\u06FF\s'.-]+$/.test(name.trim())) {
      next.name = "Please use letters and spaces only.";
    }

    const ageNum = Number(age);
    if (!age.trim()) next.age = "Please enter your age.";
    else if (!Number.isInteger(ageNum) || ageNum < AGE_MIN || ageNum > AGE_MAX) {
      next.age = `Please enter a valid age between ${AGE_MIN} and ${AGE_MAX}.`;
    }

    if (!padRef.current || padRef.current.isEmpty()) {
      next.signature = "Please provide your signature.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    const result = await signClient(token, {
      name,
      age,
      signature: padRef.current.toDataURL(),
    });
    setSubmitting(false);

    if (result.success) {
      setDone(true);
    } else if (result.error === "already_signed") {
      setSubmitError("This request has already been signed.");
      setClient({ ...client, status: "signed" });
    } else if (result.error === "expired") {
      setSubmitError("This signing link has expired.");
      setClient({ ...client, status: "expired" });
    } else {
      setSubmitError("Something went wrong. Please try again.");
    }
  }

  if (client === undefined) {
    return (
      <div className="sign-screen">
        <p className="sign-loading">Loading your document…</p>
      </div>
    );
  }

  if (client === null) {
    return (
      <div className="sign-screen">
        <div className="card sign-card sign-status-card">
          <h1>Link not found</h1>
          <p>This signing link doesn&apos;t match any request. Please check the link or QR code and try again.</p>
        </div>
      </div>
    );
  }

  if (done || client.status === "signed") {
    return (
      <div className="sign-screen">
        <div className="card sign-card sign-status-card sign-confirmation">
          <div className="seal-stamp" aria-hidden="true">
            <span>Signed</span>
          </div>
          <h1>Successfully signed</h1>
          <p>Thank you. Your information and signature have been submitted successfully.</p>
        </div>
      </div>
    );
  }

  if (client.status === "expired") {
    return (
      <div className="sign-screen">
        <div className="card sign-card sign-status-card">
          <h1>This link has expired</h1>
          <p>Please contact the sender to request a new signing link.</p>
        </div>
      </div>
    );
  }

  if (client.status === "cancelled") {
    return (
      <div className="sign-screen">
        <div className="card sign-card sign-status-card">
          <h1>This request was cancelled</h1>
          <p>Please contact the sender if you believe this is a mistake.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sign-screen">
      <form className="card sign-card" onSubmit={handleSubmit} noValidate>
        <p className="sign-eyebrow">Signing request</p>
        <h1>Please confirm your details</h1>
        <p className="sign-intro">
          Review the information below, sign in the box, then submit to complete this request.
        </p>

        {client.expiresAt && daysUntil(client.expiresAt) <= WARNING_WINDOW_DAYS && (
          <p className="sign-expiry-warning">
            {daysUntil(client.expiresAt) <= 0
              ? "This link expires today."
              : `This link expires in ${daysUntil(client.expiresAt)} day${daysUntil(client.expiresAt) === 1 ? "" : "s"}.`}
          </p>
        )}

        <div className={`field ${errors.name ? "field-error" : ""}`}>
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          {errors.name && <span className="field-error-msg">{errors.name}</span>}
        </div>

        <div className={`field ${errors.age ? "field-error" : ""}`}>
          <label htmlFor="age">Age</label>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            min={AGE_MIN}
            max={AGE_MAX}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          {errors.age && <span className="field-error-msg">{errors.age}</span>}
        </div>

        <div className={`field ${errors.signature ? "field-error" : ""}`}>
          <label>Signature</label>
          <SignaturePad ref={padRef} onChange={setSigEmpty} />
          {errors.signature && <span className="field-error-msg">{errors.signature}</span>}
          <div className="sign-pad-actions">
            <button
              type="button"
              className="btn btn-text"
              onClick={() => {
                padRef.current?.clear();
                setSigEmpty(true);
              }}
              disabled={sigEmpty}
            >
              Clear
            </button>
          </div>
        </div>

        {submitError && <p className="sign-submit-error">{submitError}</p>}

        <button type="submit" className="btn btn-primary sign-submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit signature"}
        </button>
      </form>
    </div>
  );
}
