import { Link, useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";
import "./AdminLayout.css";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/dashboard" className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true" />
          Signet
        </Link>
        <button className="btn btn-text" onClick={handleLogout}>
          Sign out
        </button>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
