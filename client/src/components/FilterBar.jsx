function FilterBar({ searchTerm, onSearchTermChange }) {
  return (
    <section className="panel filter-bar">
      <div className="section-heading">
        <h2>Search &amp; Filter</h2>
      </div>
      <div className="filter-grid">
        <label aria-label="Search">
          <input
            type="text"
            placeholder="Search wine, grape, year, notes, moods..."
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}

export default FilterBar;
