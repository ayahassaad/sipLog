function BottleRating({ rating }) {
  const height = `${Math.max(8, rating * 18)}%`;

  return (
    <div className="bottle-rating" aria-label={`Rating ${rating} out of 5`}>
      <div className="bottle-neck" />
      <div className="bottle-body">
        <div className="bottle-fill" style={{ height }} />
      </div>
      <span>{rating}/5</span>
    </div>
  );
}

export default BottleRating;
