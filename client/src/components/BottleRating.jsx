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

  return (
    <div
      className={`bottle-rating bottle-rating--${normalizedType}`}
      aria-label={`${typeLabel} wine rating ${rating} out of 5`}
    >
      <div className="bottle-neck" />
      <div className="bottle-body">
        <div className="bottle-fill" style={{ height }} />
      </div>
      <span>{rating}/5</span>
    </div>
  );
}

export default BottleRating;
