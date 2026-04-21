function FilterBar({
  grapes,
  searchTerm,
  ratingFilter,
  grapeFilter,
  favoritesOnly,
  onSearchTermChange,
  onRatingFilterChange,
  onGrapeFilterChange,
  onFavoritesOnlyChange,
}) {
  return (
    <section className="panel filter-bar">
      <div className="section-heading">
        <p className="section-kicker">Explore</p>
        <h2>Search &amp; Filter</h2>
      </div>
      <div className="filter-grid">
        <label>
          Search
          <input
            type="text"
            placeholder="Search wine, notes, moods..."
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </label>
        <label>
          Minimum Rating
          <select
            value={ratingFilter}
            onChange={(event) => onRatingFilterChange(event.target.value)}
          >
            <option value="all">All ratings</option>
            <option value="5">5 only</option>
            <option value="4">4 and up</option>
            <option value="3">3 and up</option>
          </select>
        </label>
        <label>
          Grape
          <select
            value={grapeFilter}
            onChange={(event) => onGrapeFilterChange(event.target.value)}
          >
            <option value="all">All grapes</option>
            {grapes.map((grape) => (
              <option key={grape} value={grape}>
                {grape}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-row favorites-only">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(event) => onFavoritesOnlyChange(event.target.checked)}
          />
          Favorites only
        </label>
      </div>
    </section>
  );
}

export default FilterBar;
