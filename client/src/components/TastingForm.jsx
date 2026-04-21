const scoreOptions = [1, 2, 3, 4, 5];

function TastingForm({
  editingId,
  createNewWine,
  wines,
  wineForm,
  tastingForm,
  moodTags,
  submitting,
  onSubmit,
  onWineModeChange,
  onWineChange,
  onTastingChange,
  onPhotoUpload,
  onToggleMoodTag,
  onCancelEdit,
}) {
  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <p className="section-kicker">{editingId ? "Update entry" : "New entry"}</p>
        <h2>{editingId ? "Edit Tasting" : "Add a Tasting"}</h2>
      </div>

      {!editingId && (
        <div className="mode-toggle">
          <label className={`toggle-chip ${createNewWine ? "active" : ""}`}>
            <input
              type="radio"
              checked={createNewWine}
              onChange={() => onWineModeChange(true)}
            />
            New wine
          </label>
          <label className={`toggle-chip ${!createNewWine ? "active" : ""}`}>
            <input
              type="radio"
              checked={!createNewWine}
              onChange={() => onWineModeChange(false)}
            />
            Existing wine
          </label>
        </div>
      )}

      <form className="tasting-form" onSubmit={onSubmit}>
        {!editingId && createNewWine ? (
          <div className="subpanel">
            <h3>Wine Details</h3>
            <div className="form-grid">
              <label>
                Wine Name
                <input
                  type="text"
                  name="name"
                  value={wineForm.name}
                  onChange={onWineChange}
                  required
                />
              </label>
              <label>
                Producer
                <input
                  type="text"
                  name="producer"
                  value={wineForm.producer}
                  onChange={onWineChange}
                  required
                />
              </label>
              <label>
                Country
                <input
                  type="text"
                  name="country"
                  value={wineForm.country}
                  onChange={onWineChange}
                  required
                />
              </label>
              <label>
                Region
                <input
                  type="text"
                  name="region"
                  value={wineForm.region}
                  onChange={onWineChange}
                />
              </label>
              <label>
                Grape
                <input
                  type="text"
                  name="grape"
                  value={wineForm.grape}
                  onChange={onWineChange}
                  required
                />
              </label>
              <label>
                Vintage
                <input
                  type="number"
                  name="vintage"
                  value={wineForm.vintage}
                  onChange={onWineChange}
                  required
                />
              </label>
            </div>
          </div>
        ) : (
          <label>
            {editingId ? "Wine" : "Choose a Wine"}
            <select
              name="wineId"
              value={tastingForm.wineId}
              onChange={onTastingChange}
              required
            >
              <option value="">Select a wine</option>
              {wines.map((wine) => (
                <option key={wine._id} value={wine._id}>
                  {wine.name} - {wine.producer} ({wine.vintage})
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="subpanel">
          <h3>Tasting Notes</h3>
          <div className="form-grid">
            <label className="full-width">
              Appearance
              <input
                type="text"
                name="appearance"
                value={tastingForm.appearance}
                onChange={onTastingChange}
                required
              />
            </label>

            <label className="full-width">
              Nose Notes
              <input
                type="text"
                name="noseNotes"
                value={tastingForm.noseNotes}
                onChange={onTastingChange}
                placeholder="Cherry, vanilla, cedar..."
              />
            </label>

            <label className="full-width">
              Palate Notes
              <input
                type="text"
                name="palateNotes"
                value={tastingForm.palateNotes}
                onChange={onTastingChange}
                placeholder="Red fruit, spice, plum..."
              />
            </label>

            {["sweetness", "acidity", "body", "tannin", "rating"].map((field) => (
              <label key={field}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
                <select
                  name={field}
                  value={tastingForm[field]}
                  onChange={onTastingChange}
                >
                  {scoreOptions.map((score) => (
                    <option key={score} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            <label>
              Price
              <input
                type="number"
                name="price"
                min="0"
                value={tastingForm.price}
                onChange={onTastingChange}
              />
            </label>

            <label className="full-width">
              Photo Upload
              <input type="file" accept="image/*" onChange={onPhotoUpload} />
            </label>

            <label className="full-width">
              Personal Thoughts
              <textarea
                name="personalThoughts"
                value={tastingForm.personalThoughts}
                onChange={onTastingChange}
                rows="4"
              />
            </label>
          </div>

          {tastingForm.imageUrl && (
            <div className="photo-preview-wrap">
              <img
                src={tastingForm.imageUrl}
                alt="Wine upload preview"
                className="photo-preview"
              />
            </div>
          )}

          <div className="tag-section">
            <span className="mini-heading">Wine mood tags</span>
            <div className="tag-cloud">
              {moodTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-pill ${tastingForm.moodTags.includes(tag) ? "selected" : ""}`}
                  onClick={() => onToggleMoodTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="wouldBuyAgain"
              checked={tastingForm.wouldBuyAgain}
              onChange={onTastingChange}
            />
            Would buy again
          </label>
        </div>

        <div className="button-row">
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Save Changes" : "Save Wine + Tasting"}
          </button>
          {editingId && (
            <button type="button" className="button-secondary" onClick={onCancelEdit}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default TastingForm;
