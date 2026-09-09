const WINE_TYPE_LABELS = {
  red: "Red",
  white: "White",
  rose: "Rose",
  sparkling: "Sparkling",
  sweet: "Sweet",
};

function BottleRating({ rating, type = "red" }) {
  const height = `${Math.max(8, rating * 18)}%`;
  const normalizedType = WINE_TYPE_LABELS[type] ? type : "red";
  const typeLabel = WINE_TYPE_LABELS[normalizedType];
  const isSparkling = normalizedType === "sparkling";

  return (
    <div
      className={`bottle-rating bottle-rating--${normalizedType}`}
      aria-label={`${typeLabel} wine rating ${rating} out of 5`}
    >
      {isSparkling ? (
        // Champagne-style silhouette: a single clipped shape (thin neck
        // swooping out to a fat base) instead of the neck/body boxes the
        // other wine types use, so it can curve instead of stepping.
        <div className="bottle-shape bottle-shape--sparkling">
          <div className="bottle-fill" style={{ height }} />
        </div>
      ) : (
        <>
          <div className="bottle-neck" />
          <div className="bottle-body">
            <div className="bottle-fill" style={{ height }} />
          </div>
        </>
      )}
      <span>{rating}/5</span>
    </div>
  );
}

export default BottleRating;
