import { VISIBILITY_OPTIONS, WINE_TYPES } from "../constants";

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
      {error && <p className="status-message error form-status" role="alert">{error}</p>}
      {!error && successMessage && (
        <p className="status-message success form-status" role="status">{successMessage}</p>
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
          <label className="field">
            <span>Type</span>
            <select name="type" value={wineForm.type} onChange={onWineChange}>
              {WINE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
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
            <div className="score-scale-legend">
              <span>Least</span>
              <span>Most</span>
            </div>
            {scoreFields.map((field) => (
              <div className="field" key={field}>
                <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                <div className="drop-row" role="radiogroup" aria-label={field}>
                  {scoreOptions.map((score) => (
                    <button
                      key={score}
                      type="button"
                      className={`drop-btn drop-${score} ${
                        tastingForm[field] >= score ? "filled" : ""
                      }`}
                      aria-pressed={tastingForm[field] === score}
                      aria-label={`${score}`}
                      onClick={() =>
                        onTastingChange({
                          target: { name: field, value: score, type: "number" },
                        })
                      }
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3c3.5 4.5 6 8 6 11.2A6 6 0 0 1 6 14.2C6 11 8.5 7.5 12 3Z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
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

          <div className="field field-full">
            <span>Who can see this</span>
            <div className="visibility-toggle" role="radiogroup" aria-label="Who can see this entry">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`visibility-option ${
                    tastingForm.visibility === option.value ? "active" : ""
                  }`}
                  aria-pressed={tastingForm.visibility === option.value}
                  onClick={() =>
                    onTastingChange({
                      target: { name: "visibility", value: option.value, type: "text" },
                    })
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="visibility-hint">
              {VISIBILITY_OPTIONS.find((option) => option.value === tastingForm.visibility)?.hint}
            </p>
          </div>
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
