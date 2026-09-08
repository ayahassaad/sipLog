import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import Avatar from "../components/Avatar";
import { useProfile } from "../hooks/useProfile";
import { compressImage } from "../utils/compressImage";
import { uploadImage } from "../services/uploadService";

const emptyStatus = { error: "", success: "", saving: false };

function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile();

  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [nameForm, setNameForm] = useState({ name: "", username: "" });
  const [nameStatus, setNameStatus] = useState(emptyStatus);

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
      setNameStatus(emptyStatus);
      setEditing(false);
    } catch (err) {
      setNameStatus({ error: err.message, success: "", saving: false });
    }
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
              <div className={`profile-header ${editing ? "" : "profile-header-view"}`}>
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
                          {nameStatus.saving ? "Saving..." : "Save changes"}
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

                {!editing && (
                  <div className="profile-stats">
                    <div className="profile-stat">
                      <span className="profile-stat-num">{profile.following.length}</span>
                      <span className="profile-stat-label">Following</span>
                    </div>
                    <div className="profile-stat">
                      <span className="profile-stat-num">{profile.followers.length}</span>
                      <span className="profile-stat-label">Followers</span>
                    </div>
                  </div>
                )}

                {!editing && (
                  <div className="button-row profile-edit-toggle">
                    <button
                      type="button"
                      className="button-primary"
                      onClick={() => setEditing(true)}
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default ProfilePage;
