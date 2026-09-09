import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";

function LoginPage() {
  usePageTitle("Log In");
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
    <main className="app-shell auth-shell">
      <section className="auth-panel">
        <div className="section-heading">
          <h1 className="brand-highlight">Log in to SipLog</h1>
        </div>

        {error && <p className="status-message error form-status" role="alert">{error}</p>}

        <form className="tasting-form wine-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field field-full">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
            <label className="field field-full">
              <span>Password</span>
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

          <div className="button-row form-buttons">
            <button type="submit" className="button-primary" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
