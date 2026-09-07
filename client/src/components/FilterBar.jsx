function FilterBar({ searchTerm, onSearchTermChange }) {
  return (
    <div className="filter-bar">
      <label aria-label="Search">
        <input
          type="text"
          placeholder="Search wine, grape, year, notes, moods..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
      </label>
    </div>
  );
}

export default FilterBar;
