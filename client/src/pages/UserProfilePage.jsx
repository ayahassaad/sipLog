import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Avatar from "../components/Avatar";
import BottleRating from "../components/BottleRating";
import FollowListModal from "../components/FollowListModal";
import { useAuth } from "../context/useAuth";
import { usePublicProfile } from "../hooks/usePublicProfile";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { formatTimelineDate } from "../utils/formatTimelineDate";
import { usePageTitle } from "../hooks/usePageTitle";

// Someone's public profile at /users/:username -- a read-only header (photo,
// name, handle, Following/Followers counts, a Follow button) plus a
// timeline of just their tastings. Remounted fresh on every username change
// (see the `key` on this route in App.jsx), so all of this page's state
// naturally resets when you go from one person's profile to another's.
function UserProfilePageContent({ username }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, error, toggleFollow } = usePublicProfile(username);
  usePageTitle(profile?.name || "Profile");
  const feed = useCommunityFeed({ author: username });
  // null, "following", or "followers" -- which list (if any) is open in
  // the pop-up right now.
  const [followListOpen, setFollowListOpen] = useState(null);

  const requireLogin = () => navigate("/login", { state: { from: { pathname: `/users/${username}` } } });

  const handleToggleFollow = () => {
    if (!user) {
      requireLogin();
      return;
    }
    toggleFollow();
  };

  const handleMessage = () => {
    if (!user) {
      requireLogin();
      return;
    }
    navigate(`/chat/${username}`);
  };

  const handleToggleFavorite = (tastingId, isFavorited) => {
    if (!user) {
      requireLogin();
      return;
    }
    feed.toggleFavorite(tastingId, isFavorited);
  };

  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <section className="panel profile-panel">
          {loading && <p className="feed-loading">Loading profile...</p>}
          {error && <p className="status-message error" role="alert">{error}</p>}

          {!loading && !error && profile && (
            <div className="profile-header profile-header-view">
              <Avatar url={profile.avatarUrl} name={profile.name} size="lg" />
              <div className="profile-identity">
                <h1 className="brand-highlight">{profile.name}</h1>
                <p className="profile-handle">@{profile.username}</p>
              </div>

              <div className="profile-stats">
                <button
                  type="button"
                  className="profile-stat"
                  onClick={() => setFollowListOpen("following")}
                >
                  <span className="profile-stat-num">{profile.followingCount}</span>
                  <span className="profile-stat-label">Following</span>
                </button>
                <button
                  type="button"
                  className="profile-stat"
                  onClick={() => setFollowListOpen("followers")}
                >
                  <span className="profile-stat-num">{profile.followersCount}</span>
                  <span className="profile-stat-label">Followers</span>
                </button>
              </div>

              {!profile.isOwnProfile && (
                <div className="button-row profile-edit-toggle">
                  <button
                    type="button"
                    className={`button-gold ${profile.isFollowing ? "is-following" : ""}`}
                    onClick={handleToggleFollow}
                  >
                    {profile.isFollowing ? "Following" : "Follow"}
                  </button>
                  <button type="button" className="button-gold" onClick={handleMessage}>
                    Message
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {!loading && !error && profile && (
          <section className="panel list-panel community-feed-panel">
            <div className="section-heading">
              <h2 className="brand-highlight">Tastings</h2>
            </div>

            {feed.loading && <p className="feed-loading">Loading tastings...</p>}
            {feed.error && <p className="status-message error" role="alert">{feed.error}</p>}
            {!feed.loading && !feed.error && feed.tastings.length === 0 && (
              <p className="feed-empty">No tastings yet.</p>
            )}

            {feed.tastings.length > 0 && (
              <div className="feed-timeline">
                {feed.tastings.map((tasting) => (
                  <div className="feed-entry" key={tasting._id}>
                    <span className="feed-dot" aria-hidden="true" />
                    <p className="feed-timestamp">{formatTimelineDate(tasting.createdAt)}</p>

                    <article className="tasting-card">
                      <div className="card-top">
                        <div>
                          <p className="card-vintage">
                            {tasting.wineId?.vintage || "Unknown vintage"}{" "}
                            {tasting.wineId?.country || "Unknown country"}
                          </p>
                          <h3>{tasting.wineId?.name || "Untitled wine"}</h3>
                          <p className="card-subtitle">
                            {tasting.wineId?.producer || "Unknown producer"} ·{" "}
                            {tasting.wineId?.grape || "Unknown grape"}
                          </p>
                        </div>
                        <div className="card-top-actions">
                          <button
                            type="button"
                            className={`favorite-star ${tasting.isFavorited ? "active" : ""}`}
                            onClick={() => handleToggleFavorite(tasting._id, tasting.isFavorited)}
                            aria-pressed={tasting.isFavorited}
                            aria-label={
                              tasting.isFavorited ? "Remove from favorites" : "Add to favorites"
                            }
                          >
                            {tasting.isFavorited ? "★" : "☆"}
                          </button>
                          <BottleRating rating={tasting.rating} type={tasting.wineId?.type} />
                        </div>
                      </div>

                      {tasting.imageUrl && (
                        <img
                          className="card-photo"
                          src={tasting.imageUrl}
                          alt={tasting.wineId?.name || "Wine tasting"}
                        />
                      )}
                    </article>
                  </div>
                ))}
              </div>
            )}

            {feed.hasMore && (
              <div className="button-row">
                <button type="button" className="button-secondary" onClick={feed.loadMore}>
                  Load more tastings
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {followListOpen && profile && (
        <FollowListModal
          title={followListOpen === "following" ? "Following" : "Followers"}
          users={profile[followListOpen]}
          onClose={() => setFollowListOpen(null)}
        />
      )}
    </>
  );
}

function UserProfilePage() {
  const { username } = useParams();
  return <UserProfilePageContent key={username} username={username} />;
}

export default UserProfilePage;
