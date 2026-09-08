function FilterBar({
  searchTerm,
  onSearchTermChange,
  placeholder = "Search wine, grape, year, notes, etc.",
}) {
  return (
    <div className="filter-bar">
      <label aria-label="Search">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
      </label>
    </div>
  );
}

export default FilterBar;
