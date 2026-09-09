import BottleRating from "./BottleRating";

const SCORE_FIELDS = [
  { key: "sweetness", label: "Sweetness" },
  { key: "acidity", label: "Acidity" },
  { key: "body", label: "Body" },
  { key: "tannin", label: "Tannin" },
];

// The full write-up behind a Community feed card's "Read more" link --
// everything TastingForm captures that the compact card has no room for:
// the appearance note, nose/palate notes, the four structure scores,
// price and would-buy-again, mood tags, and the personal thoughts in
// full. The card only ever shows a fixed summary; all of this data is
// already sitting on the tasting object the feed handed back, so opening
// it needs no extra request.
function TastingDetailModal({ tasting, onClose }) {
  const wine = tasting.wineId || {};
  const personalThoughts = tasting.personalThoughts?.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel tasting-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={wine.name || "Tasting details"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{wine.name || "Untitled wine"}</h3>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="tasting-detail-body">
          <p className="tasting-detail-subtitle">
            {wine.producer || "Unknown producer"} &middot; {wine.grape || "Unknown grape"} &middot;{" "}
            {wine.vintage || "Unknown vintage"}
          </p>
          <p className="tasting-detail-subtitle">
            {wine.region ? `${wine.region}, ` : ""}
            {wine.country || "Unknown country"}
            {wine.type ? ` · ${wine.type}` : ""}
          </p>

          <div className="tasting-detail-rating">
            <BottleRating rating={tasting.rating} type={wine.type} />
          </div>

          <p>
            <strong>Appearance:</strong> {tasting.appearance || "Not recorded"}
          </p>

          {tasting.noseNotes?.length > 0 && (
            <p>
              <strong>Nose:</strong> {tasting.noseNotes.join(", ")}
            </p>
          )}

          {tasting.palateNotes?.length > 0 && (
            <p>
              <strong>Palate:</strong> {tasting.palateNotes.join(", ")}
            </p>
          )}

          <div className="tasting-detail-scores">
            {SCORE_FIELDS.map(({ key, label }) => (
              <span className="tasting-detail-score" key={key}>
                {label}: {tasting[key] ?? "-"}/5
              </span>
            ))}
          </div>

          {tasting.price > 0 && (
            <p>
              <strong>Price:</strong> ${Number(tasting.price).toFixed(2)}
            </p>
          )}

          <p>
            <strong>Would buy again:</strong> {tasting.wouldBuyAgain ? "Yes" : "No"}
          </p>

          {tasting.moodTags?.length > 0 && (
            <p className="tasting-detail-tags">
              {tasting.moodTags.map((tag) => (
                <span className="mood-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </p>
          )}

          {personalThoughts && (
            <div className="tasting-detail-thoughts">
              <p className="section-kicker">Personal thoughts</p>
              <p>{personalThoughts}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TastingDetailModal;
