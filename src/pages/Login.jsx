import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../lib/auth";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (login(username, password)) {
      const dest = location.state?.from || "/dashboard";
      navigate(dest, { replace: true });
    } else {
      setError("Incorrect username or password.");
    }
  }

  return (
    <div className="login-screen">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="login-mark" aria-hidden="true" />
        <h1 className="login-title">Signet</h1>
        <p className="login-sub">Client signing &amp; verification, administrator sign-in.</p>

        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className={`field ${error ? "field-error" : ""}`}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <span className="field-error-msg">{error}</span>}
        </div>

        <button type="submit" className="btn btn-primary login-submit">
          Sign in
        </button>

        <p className="login-hint">Demo credentials: admin / admin123</p>
      </form>
    </div>
  );
}
