import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import BottleRating from "../components/BottleRating";
import FilterBar from "../components/FilterBar";
import { useAuth } from "../context/useAuth";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useUsers } from "../hooks/useUsers";
import { formatTimelineDate } from "../utils/formatTimelineDate";

const SEARCH_DEBOUNCE_MS = 400;

function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const feed = useCommunityFeed();
  const { search: confirmedSearch, runSearch } = feed;
  const people = useUsers();
  const [searchTerm, setSearchTerm] = useState("");

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

  // Browsing is public, but favoriting and following are personal actions --
  // send a logged-out visitor to log in instead of letting the request 401.
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
      <div className="app-shell">
        <section className="panel list-panel community-feed-panel">
          <div className="community-search">
            <FilterBar
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              placeholder="Search wines by name, producer, or grape..."
            />
          </div>

          {loading && <p className="feed-loading">Loading the community feed...</p>}
          {error && <p className="status-message error">{error}</p>}
          {!loading && !error && feed.tastings.length === 0 && feed.search && (
            <p className="status-message">
              No tastings found for &ldquo;{feed.search}&rdquo;.
            </p>
          )}
          {!loading && !error && feed.tastings.length === 0 && !feed.search && (
            <p className="feed-empty">No tastings yet.</p>
          )}

          {feed.tastings.length > 0 && (
            <div className="feed-timeline">
              {feed.tastings.map((tasting) => {
                const author = tasting.userId;
                const isFollowing = author ? followingStateById.get(author._id) : false;
                const isOwnPost = Boolean(user && author && author._id === user.id);

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
                          <BottleRating rating={tasting.rating} />
                        </div>
                      </div>

                      {tasting.imageUrl && (
                        <img
                          className="card-photo"
                          src={tasting.imageUrl}
                          alt={tasting.wineId?.name || "Wine tasting"}
                        />
                      )}

                      {author && (
                        <div className="card-author-row">
                          <span className="card-author">
                            {isOwnPost ? "Posted by you" : `Posted by @${author.username}`}
                          </span>
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
      </div>
    </>
  );
}

export default CommunityPage;
