const scoreOptions = [1, 2, 3, 4, 5];

function TastingForm({
  editingId,
  wines,
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
      <div className="section-heading">
        <h2>{editingId ? "Edit Wine" : "Add a Wine"}</h2>
      </div>

      {error && <p className="status-message error form-status">{error}</p>}
      {!error && successMessage && (
        <p className="status-message success form-status">{successMessage}</p>
      )}

      <form className="tasting-form ledger-form" onSubmit={onSubmit}>
        {!editingId ? (
          <>
            <label className="ledger-row">
              <span>Wine Name</span>
              <input
                type="text"
                name="name"
                value={wineForm.name}
                onChange={onWineChange}
                required
              />
            </label>
            <label className="ledger-row">
              <span>Producer</span>
              <input
                type="text"
                name="producer"
                value={wineForm.producer}
                onChange={onWineChange}
                required
              />
            </label>
            <label className="ledger-row">
              <span>Country</span>
              <input
                type="text"
                name="country"
                value={wineForm.country}
                onChange={onWineChange}
                required
              />
            </label>
            <label className="ledger-row">
              <span>Region</span>
              <input
                type="text"
                name="region"
                value={wineForm.region}
                onChange={onWineChange}
              />
            </label>
            <label className="ledger-row">
              <span>Grape</span>
              <input
                type="text"
                name="grape"
                value={wineForm.grape}
                onChange={onWineChange}
                required
              />
            </label>
            <label className="ledger-row">
              <span>Vintage</span>
              <input
                type="number"
                name="vintage"
                value={wineForm.vintage}
                onChange={onWineChange}
                required
              />
            </label>
          </>
        ) : (
          <label className="ledger-row">
            <span>Wine</span>
            <select name="wineId" value={tastingForm.wineId} onChange={onTastingChange} required>
              <option value="">Select a wine</option>
              {wines.map((wine) => (
                <option key={wine._id} value={wine._id}>
                  {wine.name} - {wine.producer} ({wine.vintage})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="ledger-row">
          <span>Appearance</span>
          <input
            type="text"
            name="appearance"
            value={tastingForm.appearance}
            onChange={onTastingChange}
            required
          />
        </label>

        <label className="ledger-row">
          <span>Nose Notes</span>
          <input
            type="text"
            name="noseNotes"
            value={tastingForm.noseNotes}
            onChange={onTastingChange}
            placeholder="Cherry, vanilla, cedar..."
          />
        </label>

        <label className="ledger-row">
          <span>Palate Notes</span>
          <input
            type="text"
            name="palateNotes"
            value={tastingForm.palateNotes}
            onChange={onTastingChange}
            placeholder="Red fruit, spice, plum..."
          />
        </label>

        {["sweetness", "acidity", "body", "tannin", "rating"].map((field) => (
          <label className="ledger-row" key={field}>
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

        <label className="ledger-row">
          <span>Price</span>
          <input
            type="number"
            name="price"
            min="0"
            value={tastingForm.price}
            onChange={onTastingChange}
          />
        </label>

        <label className="ledger-row">
          <span>Photo Upload</span>
          <input type="file" accept="image/*" onChange={onPhotoUpload} />
        </label>

        <label className="ledger-row">
          <span>Personal Thoughts</span>
          <textarea
            name="personalThoughts"
            value={tastingForm.personalThoughts}
            onChange={onTastingChange}
            rows="2"
          />
        </label>

        {tastingForm.imageUrl && (
          <div className="photo-preview-wrap">
            <img
              src={tastingForm.imageUrl}
              alt="Wine upload preview"
              className="photo-preview"
            />
          </div>
        )}

        <div className="button-row">
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
