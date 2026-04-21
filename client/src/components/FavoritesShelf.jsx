import BottleRating from "./BottleRating";

function FavoritesShelf({ tastings }) {
  return (
    <>
      <div className="section-heading">
        <p className="section-kicker">Top Shelf</p>
        <h2>Favorites Shelf</h2>
      </div>

      <div className="favorites-shelf">
        {tastings.slice(0, 3).map((tasting) => (
          <article className="favorite-card" key={`favorite-${tasting._id}`}>
            <BottleRating rating={tasting.rating} />
            <div>
              <h3>{tasting.wineId.name}</h3>
              <p>{tasting.wineId.producer}</p>
              <div className="mood-row">
                {(tasting.moodTags || []).slice(0, 3).map((tag) => (
                  <span className="mood-chip" key={`${tasting._id}-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
        {tastings.length === 0 && (
          <p className="status-message">
            No favorites yet. Rate some bottles highly or mark them buy again.
          </p>
        )}
      </div>
    </>
  );
}

export default FavoritesShelf;
