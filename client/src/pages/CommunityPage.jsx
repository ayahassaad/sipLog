import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserHoverCard from "../components/UserHoverCard";
import SiteHeader from "../components/SiteHeader";
import Avatar from "../components/Avatar";
import BottleRating from "../components/BottleRating";
import FilterBar from "../components/FilterBar";
import CommentSection from "../components/CommentSection";
import TastingDetailModal from "../components/TastingDetailModal";
import FollowListModal from "../components/FollowListModal";
import { useAuth } from "../context/useAuth";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useUsers } from "../hooks/useUsers";
import { formatTimelineDate } from "../utils/formatTimelineDate";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchFavoritedBy } from "../services/tastingService";

const SEARCH_DEBOUNCE_MS = 400;

function CommunityPage() {
  usePageTitle("Community");
  const { user } = useAuth();
  const navigate = useNavigate();
  const feed = useCommunityFeed();
  const { search: confirmedSearch, runSearch } = feed;
  const people = useUsers();
  const [searchTerm, setSearchTerm] = useState("");

  // Per-tasting UI state -- which comment threads are expanded, the live
  // comment count for each (starts from the feed's batched commentsCount,
  // then tracks whatever CommentSection reports once opened), and which
  // pop-up (if any) is currently showing.
  const [openCommentIds, setOpenCommentIds] = useState(() => new Set());
  const [commentCounts, setCommentCounts] = useState({});
  const [favoritedByModal, setFavoritedByModal] = useState(null);
  const [detailTasting, setDetailTasting] = useState(null);

  // Debounce: wait for a pause in typing before actually querying the
  // server, and skip firing again once the feed's confirmed search term
  // already matches what's in the box (covers the initial mount, and
  // avoids re-running for a value that already resolved).
  useEffect(() => {
    if (searchTerm === confirmedSearch) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      runSearch(searchTerm);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, confirmedSearch, runSearch]);

  // Browsing is public, but favoriting, following, commenting, and the
  // following-only toggle are personal actions -- send a logged-out
  // visitor to log in instead of letting the request 401.
  const requireLogin = () => navigate("/login", { state: { from: { pathname: "/" } } });

  const handleToggleFollow = (userId, isFollowing) => {
    if (!user) {
      requireLogin();
      return;
    }
    people.toggleFollow(userId, isFollowing);
  };

  const handleToggleFavorite = (tastingId, isFavorited) => {
    if (!user) {
      requireLogin();
      return;
    }
    feed.toggleFavorite(tastingId, isFavorited);
  };

  const handleToggleFollowingOnly = () => {
    if (!user) {
      requireLogin();
      return;
    }
    feed.setFollowingOnly(!feed.followingOnly);
  };

  const toggleComments = (tastingId) => {
    setOpenCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(tastingId)) {
        next.delete(tastingId);
      } else {
        next.add(tastingId);
      }
      return next;
    });
  };

  const handleCommentsCountChange = (tastingId, count) => {
    setCommentCounts((prev) => ({ ...prev, [tastingId]: count }));
  };

  const getCommentsCount = (tasting) => commentCounts[tasting._id] ?? tasting.commentsCount ?? 0;

  const openFavoritedBy = async (tasting) => {
    const wineName = tasting.wineId?.name || "this wine";
    setFavoritedByModal({ title: `Favorited by`, wineName, users: [], loading: true, error: "" });
    try {
      const data = await fetchFavoritedBy(tasting._id);
      setFavoritedByModal({
        title: `Who favorited ${wineName}`,
        wineName,
        users: data.users,
        loading: false,
        error: "",
      });
    } catch (err) {
      setFavoritedByModal({
        title: `Couldn't load who favorited ${wineName}`,
        wineName,
        users: [],
        loading: false,
        error: err.message,
      });
    }
  };

  // Still tracked (just not shown as its own "People to Follow" list for
  // now) so the inline Follow button next to each post's author knows
  // whether you already follow them.
  const followingStateById = useMemo(() => {
    const map = new Map();
    people.users.forEach((person) => map.set(person.id, person.isFollowing));
    return map;
  }, [people.users]);

  const loading = feed.loading || people.loading;
  const error = feed.error || people.error;

  return (
    <>
      <SiteHeader />
      <main className="app-shell">
        <h1 className="sr-only">Community</h1>
        <section className="panel list-panel community-feed-panel">
          <div className="community-search">
            <FilterBar
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              placeholder="Search for a wine or a user..."
            />
            <label className="following-only-toggle">
              <input
                type="checkbox"
                checked={feed.followingOnly}
                onChange={handleToggleFollowingOnly}
              />
              Following only
            </label>
          </div>

          {loading && <p className="feed-loading">Loading the community feed...</p>}
          {error && <p className="status-message error" role="alert">{error}</p>}

          {!loading && !error && feed.search && feed.matchedUsers.length > 0 && (
            <div className="community-people">
              <p className="section-kicker">People</p>
              <div className="connection-list">
                {feed.matchedUsers.map((person) => {
                  const isFollowing = followingStateById.get(person.id) ?? person.isFollowing;
                  const isSelf = Boolean(user && person.id === user.id);

                  return (
                    <div className="connection-row" key={person.id}>
                      <UserHoverCard username={person.username} className="connection-link">
                        <Avatar url={person.avatarUrl} name={person.name} size="sm" />
                        <span className="connection-name">@{person.username}</span>
                      </UserHoverCard>
                      {!isSelf && (
                        <button
                          type="button"
                          className={`button-gold ${isFollowing ? "is-following" : ""}`}
                          onClick={() => handleToggleFollow(person.id, isFollowing)}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && !error && feed.tastings.length === 0 && feed.search && (
            <p className="status-message" role="status">
              No tastings found for &ldquo;{feed.search}&rdquo;.
            </p>
          )}
          {!loading && !error && feed.tastings.length === 0 && !feed.search && feed.followingOnly && (
            <p className="feed-empty">
              No tastings yet from people you follow -- try following someone first.
            </p>
          )}
          {!loading && !error && feed.tastings.length === 0 && !feed.search && !feed.followingOnly && (
            <p className="feed-empty">No tastings yet.</p>
          )}

          {feed.tastings.length > 0 && (
            <div className="feed-timeline">
              {feed.tastings.map((tasting) => {
                const author = tasting.userId;
                const isFollowing = author ? followingStateById.get(author._id) : false;
                const isOwnPost = Boolean(user && author && author._id === user.id);
                const favoritesCount = tasting.favoritesCount || 0;
                const commentsCount = getCommentsCount(tasting);
                const commentsOpen = openCommentIds.has(tasting._id);

                return (
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
                          <button
                            type="button"
                            className="card-read-more"
                            onClick={() => setDetailTasting(tasting)}
                          >
                            Read more
                          </button>
                        </div>
                        <div className="card-top-actions">
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

                      <div className="card-social-row">
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
                        {favoritesCount > 0 ? (
                          <button
                            type="button"
                            className="social-count-link"
                            onClick={() => openFavoritedBy(tasting)}
                          >
                            {favoritesCount} {favoritesCount === 1 ? "favorite" : "favorites"}
                          </button>
                        ) : (
                          <span className="social-count-static">Be the first to favorite</span>
                        )}

                        <button
                          type="button"
                          className="social-comments-toggle"
                          aria-expanded={commentsOpen}
                          onClick={() => toggleComments(tasting._id)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 4h16v11H9l-5 4V4Z" />
                          </svg>
                          {commentsCount > 0
                            ? `${commentsCount} comment${commentsCount === 1 ? "" : "s"}`
                            : "Comment"}
                        </button>
                      </div>

                      {commentsOpen && (
                        <CommentSection
                          tastingId={tasting._id}
                          currentUser={user}
                          onRequireLogin={requireLogin}
                          onCountChange={(count) => handleCommentsCountChange(tasting._id, count)}
                        />
                      )}

                      {author && (
                        <div className="card-author-row">
                          {isOwnPost ? (
                            <span className="card-author">Posted by you</span>
                          ) : (
                            <span className="card-author">
                              Posted by{" "}
                              <UserHoverCard username={author.username} className="card-author-link">
                                @{author.username}
                              </UserHoverCard>
                            </span>
                          )}
                          {!isOwnPost && (
                            <button
                              type="button"
                              className={`button-gold ${isFollowing ? "is-following" : ""}`}
                              onClick={() => handleToggleFollow(author._id, isFollowing)}
                            >
                              {isFollowing ? "Following" : "Follow"}
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  </div>
                );
              })}
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
      </main>

      {detailTasting && (
        <TastingDetailModal tasting={detailTasting} onClose={() => setDetailTasting(null)} />
      )}

      {favoritedByModal && (
        <FollowListModal
          title={favoritedByModal.title}
          users={favoritedByModal.users}
          onClose={() => setFavoritedByModal(null)}
        />
      )}
    </>
  );
}

export default CommunityPage;
