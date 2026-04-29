import BottleRating from "./BottleRating";

function TastingTimeline({
  loading,
  error,
  successMessage,
  filteredCount,
  timelineGroups,
  lastUpdatedAt,
  deletingId,
  onEdit,
  onDelete,
}) {
  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(lastUpdatedAt)
    : "Waiting for first sync";

  return (
    <>
      <div className="section-heading timeline-heading" id="timeline-section">
        <p className="section-kicker">Journal View</p>
        <h2>Tasting Timeline</h2>
        <p className="timeline-refresh-note">
          Auto-refreshes every 30 seconds. Last updated: {lastUpdatedLabel}
        </p>
      </div>

      {loading && <p className="status-message">Loading tastings...</p>}
      {error && <p className="status-message error">{error}</p>}
      {!loading && !error && successMessage && (
        <p className="status-message success">{successMessage}</p>
      )}
      {!loading && !error && filteredCount === 0 && (
        <p className="status-message">No entries match your current filters.</p>
      )}

      <div className="timeline">
        {Object.entries(timelineGroups).map(([dateLabel, items]) => (
          <div className="timeline-group" key={dateLabel}>
            <div className="timeline-date">{dateLabel}</div>
            <div className="card-stack">
              {items.map((tasting) => (
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

                  <p className="thoughts-block">
                    {tasting.personalThoughts || "No written thoughts yet."}
                  </p>

                  <div className="button-row">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => onEdit(tasting)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => onDelete(tasting._id)}
                      disabled={deletingId === tasting._id}
                    >
                      {deletingId === tasting._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default TastingTimeline;
