import { useEffect, useState } from "react";
import UserHoverCard from "./UserHoverCard";
import BottleRating from "./BottleRating";
import FilterBar from "./FilterBar";

// Small circular photo spot for the wine - shows the uploaded photo if there
// is one, otherwise a plain wine-glass outline so every card still has a
// consistent little medallion up top.
function WineThumb({ tasting }) {
  const name = tasting.wineId?.name || "Wine";
  return (
    <div className="wine-thumb">
      {tasting.imageUrl ? (
        <img src={tasting.imageUrl} alt={name} />
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 2h8" />
          <path d="M9 2c0 4.5-1.5 6-1.5 9a4.5 4.5 0 0 0 9 0c0-3-1.5-4.5-1.5-9" />
          <path d="M12 15.5V21" />
          <path d="M8.5 21h7" />
        </svg>
      )}
    </div>
  );
}

function TastingTimeline({
  loading,
  error,
  successMessage,
  filteredCount,
  tastings,
  deletingId,
  onEdit,
  onDelete,
  onToggleFavorite,
  showAuthor = false,
  heading = "My Wines",
  searchTerm,
  onSearchTermChange,
  onCreateFirst,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = tastings.length;

  // Switching tabs or typing a new search should land back on the first card.
  useEffect(() => {
    setActiveIndex(0);
  }, [heading, searchTerm]);

  // If the centered card gets deleted (or the list otherwise shrinks), don't
  // leave the index pointing past the end of the array.
  useEffect(() => {
    if (activeIndex >= count && count > 0) {
      setActiveIndex(0);
    }
  }, [count, activeIndex]);

  const goTo = (index) => {
    if (count === 0) return;
    setActiveIndex(((index % count) + count) % count);
  };

  return (
    <>
      <div className="section-heading timeline-heading" id="timeline-section">
        {onSearchTermChange && (
          <FilterBar searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />
        )}
      </div>

      {loading && <p className="feed-loading">Loading tastings...</p>}
      {error && <p className="status-message error">{error}</p>}
      {!loading && !error && successMessage && (
        <p className="status-message success">{successMessage}</p>
      )}
      {!loading && !error && filteredCount === 0 && (
        onCreateFirst && !searchTerm ? (
          <button type="button" className="empty-state-cta" onClick={onCreateFirst}>
            <span className="empty-state-label">Create your first entry</span>
            <svg className="empty-state-arrow" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5c4 2 7 5 7 7s-3 5-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <p className="feed-empty">No entries match your current filters.</p>
        )
      )}

      {count > 0 && (
        <div className="carousel">
          {count > 1 && (
            <button
              type="button"
              className="carousel-arrow left"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous wine"
            >
              <svg viewBox="0 0 24 24">
                <path d="M15 5c-4 2-7 5-7 7s3 5 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          <div className="carousel-track">
            {tastings.map((tasting, index) => {
              let offset = index - activeIndex;
              if (offset > count / 2) offset -= count;
              if (offset < -count / 2) offset += count;
              const abs = Math.abs(offset);
              const isActive = offset === 0;

              const scale = isActive ? 1.06 : abs === 1 ? 0.86 : 0.72;
              const opacity = abs > 2 ? 0 : isActive ? 1 : abs === 1 ? 0.6 : 0.3;
              const x = offset * 260;

              return (
                <article
                  className={`tasting-card carousel-card ${isActive ? "is-active" : ""}`}
                  key={tasting._id}
                  style={{
                    transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                    opacity,
                    zIndex: 10 - abs,
                    pointerEvents: abs > 2 ? "none" : "auto",
                  }}
                  onClick={() => !isActive && goTo(index)}
                >
                  <div className="card-top">
                    <div className="card-heading-row">
                      <WineThumb tasting={tasting} />
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
                    </div>
                    <div className="card-top-actions">
                      <button
                        type="button"
                        className={`favorite-star ${tasting.isFavorited ? "active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleFavorite(tasting._id, tasting.isFavorited);
                        }}
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

                  <dl className="detail-grid">
                    <div>
                      <dt>Appearance</dt>
                      <dd>{tasting.appearance}</dd>
                    </div>
                    <div>
                      <dt>Nose</dt>
                      <dd>{tasting.noseNotes?.join(", ") || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt>Palate</dt>
                      <dd>{tasting.palateNotes?.join(", ") || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt>Structure</dt>
                      <dd>
                        S {tasting.sweetness} · A {tasting.acidity} · B {tasting.body} · T{" "}
                        {tasting.tannin}
                      </dd>
                    </div>
                  </dl>

                  {showAuthor && tasting.userId && (
                    <p className="card-author">
                      Tasted by:{" "}
                      <UserHoverCard
                        username={tasting.userId.username}
                        className="card-author-link"
                        onClick={(event) => event.stopPropagation()}
                      >
                        @{tasting.userId.username}
                      </UserHoverCard>
                    </p>
                  )}

                  {(onEdit || onDelete) && (
                    <div className="button-row">
                      {onEdit && (
                        <button
                          type="button"
                          className="card-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(tasting);
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="card-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(tasting._id);
                          }}
                          disabled={deletingId === tasting._id}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                          </svg>
                          {deletingId === tasting._id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {count > 1 && (
            <button
              type="button"
              className="carousel-arrow right"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next wine"
            >
              <svg viewBox="0 0 24 24">
                <path d="M9 5c4 2 7 5 7 7s-3 5-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      {count > 1 && (
        <div className="carousel-dots">
          {tastings.map((tasting, index) => (
            <button
              key={tasting._id}
              type="button"
              className={`carousel-dot ${index === activeIndex ? "is-active" : ""}`}
              onClick={() => goTo(index)}
              aria-label={`Go to ${tasting.wineId?.name || "wine"}`}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default TastingTimeline;
