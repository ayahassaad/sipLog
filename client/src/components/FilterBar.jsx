function FilterBar({ searchTerm, favoritesOnly, onSearchTermChange, onFavoritesOnlyChange }) {
  return (
    <section className="panel filter-bar">
      <div className="section-heading">
        <h2>Search &amp; Filter</h2>
      </div>
      <div className="filter-grid">
        <label>
          Search
          <input
            type="text"
            placeholder="Search wine, grape, year, notes, moods..."
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
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
