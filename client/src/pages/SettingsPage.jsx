import { useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { useProfile } from "../hooks/useProfile";
import { usePageTitle } from "../hooks/usePageTitle";

const emptyStatus = { error: "", success: "", saving: false };

function SettingsPage() {
  usePageTitle("Settings");
  const { loading, error, updateEmail, updatePassword } = useProfile();

  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  const [emailStatus, setEmailStatus] = useState(emptyStatus);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState(emptyStatus);

  const handleChangeEmail = async (event) => {
    event.preventDefault();
    setEmailStatus({ error: "", success: "", saving: true });

    try {
      await updateEmail({
        newEmail: emailForm.newEmail,
        currentPassword: emailForm.currentPassword,
      });
      setEmailForm({ newEmail: "", currentPassword: "" });
      setEmailStatus({ error: "", success: "Email updated.", saving: false });
    } catch (err) {
      setEmailStatus({ error: err.message, success: "", saving: false });
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ error: "New passwords don't match.", success: "", saving: false });
      return;
    }

    setPasswordStatus({ error: "", success: "", saving: true });

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus({ error: "", success: "Password updated.", saving: false });
    } catch (err) {
      setPasswordStatus({ error: err.message, success: "", saving: false });
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <section className="panel">
          <div className="section-heading">
            <h1 className="brand-highlight">Settings</h1>
          </div>

          {loading && <p className="feed-loading">Loading your account...</p>}
          {error && <p className="status-message error" role="alert">{error}</p>}

          {!loading && !error && (
            <div className="profile-edit-forms">
              <form className="tasting-form wine-form" onSubmit={handleChangeEmail}>
                <p className="section-kicker">Change email</p>
                {emailStatus.error && (
                  <p className="status-message error form-status" role="alert">{emailStatus.error}</p>
                )}
                {!emailStatus.error && emailStatus.success && (
                  <p className="status-message success form-status" role="status">{emailStatus.success}</p>
                )}
                <div className="field-grid">
                  <label className="field field-full">
                    <span>New email</span>
                    <input
                      type="email"
                      value={emailForm.newEmail}
                      onChange={(event) =>
                        setEmailForm((prev) => ({ ...prev, newEmail: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="field field-full">
                    <span>Current password</span>
                    <input
                      type="password"
                      value={emailForm.currentPassword}
                      onChange={(event) =>
                        setEmailForm((prev) => ({
                          ...prev,
                          currentPassword: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>
                <div className="button-row form-buttons">
                  <button type="submit" className="button-primary" disabled={emailStatus.saving}>
                    {emailStatus.saving ? "Saving..." : "Update email"}
                  </button>
                </div>
              </form>

              <form className="tasting-form wine-form" onSubmit={handleChangePassword}>
                <p className="section-kicker">Change password</p>
                {passwordStatus.error && (
                  <p className="status-message error form-status" role="alert">{passwordStatus.error}</p>
                )}
                {!passwordStatus.error && passwordStatus.success && (
                  <p className="status-message success form-status" role="status">{passwordStatus.success}</p>
                )}
                <div className="field-grid">
                  <label className="field field-full">
                    <span>Current password</span>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>New password</span>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: event.target.value,
                        }))
                      }
                      required
                      minLength={8}
                    />
                  </label>
                  <label className="field">
                    <span>Confirm new password</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: event.target.value,
                        }))
                      }
                      required
                      minLength={8}
                    />
                  </label>
                </div>
                <div className="button-row form-buttons">
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={passwordStatus.saving}
                  >
                    {passwordStatus.saving ? "Saving..." : "Update password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default SettingsPage;
