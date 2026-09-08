import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import Avatar from "../components/Avatar";
import { useProfile } from "../hooks/useProfile";
import { compressImage } from "../utils/compressImage";
import { uploadImage } from "../services/uploadService";

const emptyStatus = { error: "", success: "", saving: false };

function ProfilePage() {
  const { profile, loading, error, updateProfile, updateEmail, updatePassword, toggleFollow } =
    useProfile();

  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [nameForm, setNameForm] = useState({ name: "", username: "" });
  const [nameStatus, setNameStatus] = useState(emptyStatus);

  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  const [emailStatus, setEmailStatus] = useState(emptyStatus);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState(emptyStatus);

  // Keep the name/username fields in sync whenever the profile (re)loads.
  useEffect(() => {
    if (profile) {
      setNameForm({ name: profile.name, username: profile.username });
    }
  }, [profile]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoError("");
      const compressedImage = await compressImage(file);
      const uploadedUrl = await uploadImage(compressedImage, { type: "avatar" });
      await updateProfile({ avatarUrl: uploadedUrl });
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveName = async (event) => {
    event.preventDefault();
    setNameStatus({ error: "", success: "", saving: true });

    try {
      await updateProfile({ name: nameForm.name, username: nameForm.username });
      setNameStatus({ error: "", success: "Profile updated.", saving: false });
    } catch (err) {
      setNameStatus({ error: err.message, success: "", saving: false });
    }
  };

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

  const renderConnectionList = (people, emptyMessage) => {
    if (people.length === 0) {
      return <p className="status-message">{emptyMessage}</p>;
    }

    return (
      <div className="connection-list">
        {people.map((person) => (
          <div className="connection-row" key={person.id}>
            <Avatar url={person.avatarUrl} name={person.name} size="sm" />
            <span className="connection-name">@{person.username}</span>
            <button
              type="button"
              className={`button-gold ${person.isFollowing ? "is-following" : ""}`}
              onClick={() => toggleFollow(person.id, person.isFollowing)}
            >
              {person.isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <SiteHeader />
      <div className="app-shell">
        <section className="panel profile-panel">
          {loading && <p className="feed-loading">Loading your profile...</p>}
          {error && <p className="status-message error">{error}</p>}

          {!loading && !error && profile && (
            <>
              <div className="profile-header">
                {editing ? (
                  <div className="photo-upload-wrap">
                    <label
                      className={`photo-circle ${profile.avatarUrl ? "has-photo" : ""}`}
                      htmlFor="avatar-input"
                    >
                      {profile.avatarUrl && (
                        <img src={profile.avatarUrl} alt="Profile avatar preview" />
                      )}
                      <span className="camera-icon-wrap">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 8a1 1 0 0 1 1-1h2.2l.9-1.5A1 1 0 0 1 8.96 5h6.08a1 1 0 0 1 .86.5L16.8 7H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
                          <circle cx="12" cy="13" r="3.4" />
                        </svg>
                      </span>
                    </label>
                    <input
                      type="file"
                      id="avatar-input"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingPhoto}
                    />
                    <span className="photo-caption">
                      {uploadingPhoto ? "Uploading..." : "Click to change photo"}
                    </span>
                    {photoError && <p className="status-message error form-status">{photoError}</p>}
                  </div>
                ) : (
                  <Avatar url={profile.avatarUrl} name={profile.name} size="lg" />
                )}

                <div className="profile-identity">
                  {editing ? (
                    <form className="tasting-form wine-form" onSubmit={handleSaveName}>
                      {nameStatus.error && (
                        <p className="status-message error form-status">{nameStatus.error}</p>
                      )}
                      {!nameStatus.error && nameStatus.success && (
                        <p className="status-message success form-status">{nameStatus.success}</p>
                      )}
                      <div className="field-grid">
                        <label className="field">
                          <span>Name</span>
                          <input
                            type="text"
                            value={nameForm.name}
                            onChange={(event) =>
                              setNameForm((prev) => ({ ...prev, name: event.target.value }))
                            }
                            required
                          />
                        </label>
                        <label className="field">
                          <span>Username</span>
                          <input
                            type="text"
                            value={nameForm.username}
                            onChange={(event) =>
                              setNameForm((prev) => ({ ...prev, username: event.target.value }))
                            }
                            required
                            minLength={3}
                            maxLength={20}
                            pattern="[a-z0-9_]+"
                            title="Lowercase letters, numbers, and underscores only"
                            autoCapitalize="none"
                          />
                        </label>
                      </div>
                      <div className="button-row form-buttons">
                        <button type="submit" className="button-primary" disabled={nameStatus.saving}>
                          {nameStatus.saving ? "Saving..." : "Save profile"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h2 className="brand-highlight">{profile.name}</h2>
                      <p className="profile-handle">@{profile.username}</p>
                    </>
                  )}
                </div>

                <div className="button-row profile-edit-toggle">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setEditing((prev) => !prev)}
                  >
                    {editing ? "Done editing" : "Edit Profile"}
                  </button>
                </div>
              </div>

              {editing && (
                <div className="profile-edit-forms">
                  <form className="tasting-form wine-form" onSubmit={handleChangeEmail}>
                    <p className="section-kicker">Change email</p>
                    {emailStatus.error && (
                      <p className="status-message error form-status">{emailStatus.error}</p>
                    )}
                    {!emailStatus.error && emailStatus.success && (
                      <p className="status-message success form-status">{emailStatus.success}</p>
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
                      <p className="status-message error form-status">{passwordStatus.error}</p>
                    )}
                    {!passwordStatus.error && passwordStatus.success && (
                      <p className="status-message success form-status">{passwordStatus.success}</p>
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
            </>
          )}
        </section>

        {!loading && !error && profile && (
          <>
            <section className="panel">
              <div className="section-heading">
                <h2 className="brand-highlight">Following ({profile.following.length})</h2>
              </div>
              {renderConnectionList(profile.following, "You're not following anyone yet.")}
            </section>

            <section className="panel">
              <div className="section-heading">
                <h2 className="brand-highlight">Followers ({profile.followers.length})</h2>
              </div>
              {renderConnectionList(profile.followers, "No one is following you yet.")}
            </section>
          </>
        )}
      </div>
    </>
  );
}

export default ProfilePage;
