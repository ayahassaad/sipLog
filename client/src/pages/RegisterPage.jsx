import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";

function RegisterPage() {
  usePageTitle("Sign Up");
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
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
      await register(form);
      navigate("/", { replace: true });
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
          <h1>
            Create your <span className="brand-highlight">SipLog</span> account
          </h1>
        </div>

        {error && <p className="status-message error form-status" role="alert">{error}</p>}

        <form className="tasting-form wine-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field field-full">
              <span>Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
            <label className="field field-full">
              <span>Username</span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9_]+"
                title="Lowercase letters, numbers, and underscores only"
                autoCapitalize="none"
              />
            </label>
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
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
