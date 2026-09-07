const scoreOptions = [1, 2, 3, 4, 5];
const scoreFields = ["sweetness", "acidity", "body", "tannin", "rating"];

function TastingForm({
  editingId,
  wineForm,
  tastingForm,
  submitting,
  error,
  successMessage,
  onSubmit,
  onWineChange,
  onTastingChange,
  onPhotoUpload,
  onCancelEdit,
}) {
  return (
    <section className="panel form-panel wine-form">
      {error && <p className="status-message error form-status">{error}</p>}
      {!error && successMessage && (
        <p className="status-message success form-status">{successMessage}</p>
      )}

      <form className="tasting-form ledger-form" onSubmit={onSubmit}>
        <div className="photo-upload-wrap">
          <label
            className={`photo-circle ${tastingForm.imageUrl ? "has-photo" : ""}`}
            htmlFor="wine-photo-input"
          >
            {tastingForm.imageUrl && (
              <img src={tastingForm.imageUrl} alt="Wine upload preview" />
            )}
            <span className="camera-icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 8a1 1 0 0 1 1-1h2.2l.9-1.5A1 1 0 0 1 8.96 5h6.08a1 1 0 0 1 .86.5L16.8 7H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
                <circle cx="12" cy="13" r="3.4" />
              </svg>
            </span>
          </label>
          <input
            type="file"
            id="wine-photo-input"
            accept="image/*"
            onChange={onPhotoUpload}
            disabled={submitting}
          />
          <span className="photo-caption">
            {tastingForm.imageUrl ? "Click to change photo" : "Click to add a photo"}
          </span>
        </div>

        <div className="field-grid cols-3">
          <label className="field field-full">
            <span>Name</span>
            <input
              type="text"
              name="name"
              value={wineForm.name}
              onChange={onWineChange}
              required
            />
          </label>
          <label className="field">
            <span>Producer</span>
            <input
              type="text"
              name="producer"
              value={wineForm.producer}
              onChange={onWineChange}
              required
            />
          </label>
          <label className="field">
            <span>Country</span>
            <input
              type="text"
              name="country"
              value={wineForm.country}
              onChange={onWineChange}
              required
            />
          </label>
          <label className="field">
            <span>Region</span>
            <input
              type="text"
              name="region"
              value={wineForm.region}
              onChange={onWineChange}
            />
          </label>
          <label className="field">
            <span>Grape</span>
            <input
              type="text"
              name="grape"
              value={wineForm.grape}
              onChange={onWineChange}
              required
            />
          </label>
          <label className="field">
            <span>Vintage</span>
            <input
              type="number"
              name="vintage"
              value={wineForm.vintage}
              onChange={onWineChange}
              required
            />
          </label>
          <label className="field">
            <span>Price</span>
            <input
              type="number"
              name="price"
              min="0"
              placeholder="0"
              value={tastingForm.price}
              onChange={onTastingChange}
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field field-full">
            <span>Appearance</span>
            <input
              type="text"
              name="appearance"
              value={tastingForm.appearance}
              onChange={onTastingChange}
              required
            />
          </label>

          <label className="field">
            <span>Nose Notes</span>
            <input
              type="text"
              name="noseNotes"
              value={tastingForm.noseNotes}
              onChange={onTastingChange}
              placeholder="Cherry, vanilla, cedar..."
            />
          </label>

          <label className="field">
            <span>Palate Notes</span>
            <input
              type="text"
              name="palateNotes"
              value={tastingForm.palateNotes}
              onChange={onTastingChange}
              placeholder="Red fruit, spice, plum..."
            />
          </label>

          <div className="score-row">
            {scoreFields.map((field) => (
              <label className="field" key={field}>
                <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                <select name={field} value={tastingForm[field]} onChange={onTastingChange}>
                  {scoreOptions.map((score) => (
                    <option key={score} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <label className="field field-full">
            <span>Personal Thoughts</span>
            <textarea
              name="personalThoughts"
              value={tastingForm.personalThoughts}
              onChange={onTastingChange}
              rows="2"
            />
          </label>
        </div>

        <div className="button-row form-buttons">
          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? "Saving..." : editingId ? "Save Changes" : "Save Wine"}
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
