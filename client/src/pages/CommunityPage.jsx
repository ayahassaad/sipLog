import { useMemo } from "react";
import SiteHeader from "../components/SiteHeader";
import BottleRating from "../components/BottleRating";
import { useCommunityFeed } from "../hooks/useCommunityFeed";
import { useUsers } from "../hooks/useUsers";

function CommunityPage() {
  const feed = useCommunityFeed();
  const people = useUsers();

  const followingStateById = useMemo(() => {
    const map = new Map();
    people.users.forEach((user) => map.set(user.id, user.isFollowing));
    return map;
  }, [people.users]);

  const loading = feed.loading || people.loading;
  const error = feed.error || people.error;

  return (
    <>
      <SiteHeader />
      <div className="app-shell">
        <section className="panel">
        <div className="section-heading">
          <h2>People to Follow</h2>
        </div>

        {people.loading && <p className="status-message">Loading people...</p>}
        {!people.loading && people.users.length === 0 && (
          <p className="status-message">
            No other tasters have joined yet - check back soon!
          </p>
        )}

        <div className="people-row">
          {people.users.map((user) => (
            <article className="person-card" key={user.id}>
              <span className="person-name">{user.name}</span>
              <button
                type="button"
                className={user.isFollowing ? "button-secondary" : "button-primary"}
                onClick={() => people.toggleFollow(user.id, user.isFollowing)}
              >
                {user.isFollowing ? "Following" : "Follow"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel list-panel">
        <div className="section-heading timeline-heading">
          <h2>Community Feed</h2>
        </div>

        {loading && <p className="status-message">Loading the community feed...</p>}
        {error && <p className="status-message error">{error}</p>}
        {!loading && !error && feed.tastings.length === 0 && (
          <p className="status-message">
            No tastings from other users yet - once people you know join in, their
            tastings will show up here.
          </p>
        )}

        <div className="card-stack">
          {feed.tastings.map((tasting) => {
            const author = tasting.userId;
            const isFollowing = author ? followingStateById.get(author._id) : false;

            return (
              <article className="tasting-card" key={tasting._id}>
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
                  <BottleRating rating={tasting.rating} />
                </div>

                {tasting.imageUrl && (
                  <img
                    className="card-photo"
                    src={tasting.imageUrl}
                    alt={tasting.wineId?.name || "Wine tasting"}
                  />
                )}

                <div className="mood-row">
                  {(tasting.moodTags || []).map((tag) => (
                    <span className="mood-chip" key={`${tasting._id}-${tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="thoughts-block">
                  {tasting.personalThoughts || "No written thoughts yet."}
                </p>

                {author && (
                  <div className="card-author-row">
                    <span className="card-author">Tasted by {author.name}</span>
                    <button
                      type="button"
                      className={isFollowing ? "button-secondary" : "button-primary"}
                      onClick={() => people.toggleFollow(author._id, isFollowing)}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

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
