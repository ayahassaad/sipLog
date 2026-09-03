import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell auth-shell">
      <section className="panel form-panel auth-panel">
        <div className="section-heading">
          <p className="section-kicker">Welcome back</p>
          <h2>Log in to SipLog</h2>
        </div>

        {error && <p className="status-message error form-status">{error}</p>}

        <form className="tasting-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="full-width">
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
            <label className="full-width">
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </label>
          </div>

          <div className="button-row">
            <button type="submit" className="button-primary" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
