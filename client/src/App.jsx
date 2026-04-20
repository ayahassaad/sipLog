import { useEffect, useMemo, useState } from "react";
import "./App.css";

const TASTINGS_API_URL = "http://localhost:5001/api/tastings";
const WINES_API_URL = "http://localhost:5001/api/wines";

const MOOD_TAGS = [
  "Date night",
  "Cozy night",
  "Dinner party",
  "Girls night",
  "Celebration",
  "Gift-worthy",
  "Weeknight",
  "Summer patio",
];

const initialWineForm = {
  name: "",
  producer: "",
  country: "",
  region: "",
  grape: "",
  vintage: 2020,
};

const initialTastingForm = {
  userId: "69e681b2b977676391c086f2",
  wineId: "",
  appearance: "",
  noseNotes: "",
  palateNotes: "",
  sweetness: 1,
  acidity: 1,
  body: 1,
  tannin: 1,
  rating: 1,
  price: 0,
  wouldBuyAgain: false,
  moodTags: [],
  personalThoughts: "",
  imageUrl: "",
};

const scoreOptions = [1, 2, 3, 4, 5];

function RoseGlassLogo() {
  return (
    <div className="logo-badge" aria-hidden="true">
      <svg viewBox="0 0 220 220" className="logo-svg" role="img">
        <circle cx="110" cy="110" r="102" className="logo-bg" />
        <path
          d="M62 52h96c0 31-15 57-38 70v24h28c0 17-14 31-31 31h-14c-17 0-31-14-31-31h28v-24C77 109 62 83 62 52Z"
          className="logo-glass"
        />
        <path
          d="M74 60h72c0 18-8 34-20 45-10 8-22 13-35 13s-25-5-35-13c-12-11-20-27-20-45Z"
          className="logo-wine"
        />
        <path d="M110 124v38" className="logo-stem" />
        <path d="M86 162h48" className="logo-stem" />
        <path d="M96 84c6 8 16 10 24 12 10 2 20 6 24 15" className="logo-swirl" />
      </svg>
    </div>
  );
}

function BottleRating({ rating }) {
  const height = `${Math.max(8, rating * 18)}%`;

  return (
    <div className="bottle-rating" aria-label={`Rating ${rating} out of 5`}>
      <div className="bottle-neck" />
      <div className="bottle-body">
        <div className="bottle-fill" style={{ height }} />
      </div>
      <span>{rating}/5</span>
    </div>
  );
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not process image"));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      image.onerror = () => reject(new Error("Could not read image"));
      image.src = typeof reader.result === "string" ? reader.result : "";
    };

    reader.onerror = () => reject(new Error("Could not load file"));
    reader.readAsDataURL(file);
  });
}

function App() {
  const [tastings, setTastings] = useState([]);
  const [hiddenBrokenTastings, setHiddenBrokenTastings] = useState([]);
  const [wines, setWines] = useState([]);
  const [tastingForm, setTastingForm] = useState(initialTastingForm);
  const [wineForm, setWineForm] = useState(initialWineForm);
  const [createNewWine, setCreateNewWine] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [grapeFilter, setGrapeFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [saveSplash, setSaveSplash] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tastingsRes, winesRes] = await Promise.all([
        fetch(TASTINGS_API_URL),
        fetch(WINES_API_URL),
      ]);

      if (!tastingsRes.ok || !winesRes.ok) {
        throw new Error("Failed to load app data");
      }

      const [tastingsData, winesData] = await Promise.all([
        tastingsRes.json(),
        winesRes.json(),
      ]);

      const validTastings = tastingsData
        .filter((tasting) => tasting.wineId && tasting.wineId.name)
        .sort((a, b) => new Date(b.tastedAt) - new Date(a.tastedAt));
      const brokenTastings = tastingsData.filter(
        (tasting) => !tasting.wineId || !tasting.wineId.name
      );

      setTastings(validTastings);
      setHiddenBrokenTastings(brokenTastings);
      setWines(winesData);

      if (!createNewWine && winesData.length > 0 && !tastingForm.wineId) {
        setTastingForm((prev) => ({ ...prev, wineId: winesData[0]._id }));
      }

      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForms = () => {
    setEditingId("");
    setCreateNewWine(true);
    setWineForm(initialWineForm);
    setTastingForm(initialTastingForm);
    setError("");
  };

  const flashSplash = () => {
    setSaveSplash(true);
    window.setTimeout(() => setSaveSplash(false), 1400);
  };

  const handleTastingChange = (event) => {
    const { name, value, type, checked } = event.target;
    setTastingForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleWineChange = (event) => {
    const { name, value, type } = event.target;
    setWineForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleWineModeChange = (useNewWine) => {
    setCreateNewWine(useNewWine);
    if (!useNewWine && wines.length > 0) {
      setTastingForm((prev) => ({ ...prev, wineId: wines[0]._id }));
    }
    if (useNewWine) {
      setTastingForm((prev) => ({ ...prev, wineId: "" }));
    }
  };

  const toggleMoodTag = (tag) => {
    setTastingForm((prev) => ({
      ...prev,
      moodTags: prev.moodTags.includes(tag)
        ? prev.moodTags.filter((item) => item !== tag)
        : [...prev.moodTags, tag],
    }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const compressedImage = await compressImage(file);
      setTastingForm((prev) => ({
        ...prev,
        imageUrl: compressedImage,
      }));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const createWine = async () => {
    const res = await fetch(WINES_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wineForm),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to create wine");
    }

    return res.json();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let wineId = tastingForm.wineId;

      if (!editingId && createNewWine) {
        const savedWine = await createWine();
        wineId = savedWine._id;
      }

      const payload = {
        ...tastingForm,
        wineId,
        moodTags: tastingForm.moodTags,
        noseNotes: tastingForm.noseNotes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        palateNotes: tastingForm.palateNotes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const tastingRes = await fetch(
        editingId ? `${TASTINGS_API_URL}/${editingId}` : TASTINGS_API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!tastingRes.ok) {
        const data = await tastingRes.json();
        throw new Error(
          data.message ||
            (editingId ? "Failed to update tasting" : "Failed to create tasting")
        );
      }

      resetForms();
      flashSplash();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tastingId) => {
    if (!window.confirm("Delete this tasting note? This cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(tastingId);
      setError("");
      const res = await fetch(`${TASTINGS_API_URL}/${tastingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete tasting");
      }
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  };

  const handleEdit = (tasting) => {
    setEditingId(tasting._id);
    setCreateNewWine(false);
    setError("");
    setTastingForm({
      userId: tasting.userId?._id || initialTastingForm.userId,
      wineId: tasting.wineId?._id || "",
      appearance: tasting.appearance || "",
      noseNotes: tasting.noseNotes?.join(", ") || "",
      palateNotes: tasting.palateNotes?.join(", ") || "",
      sweetness: tasting.sweetness || 1,
      acidity: tasting.acidity || 1,
      body: tasting.body || 1,
      tannin: tasting.tannin || 1,
      rating: tasting.rating || 1,
      price: tasting.price || 0,
      wouldBuyAgain: tasting.wouldBuyAgain || false,
      moodTags: tasting.moodTags || [],
      personalThoughts: tasting.personalThoughts || "",
      imageUrl: tasting.imageUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCleanupBrokenTastings = async () => {
    if (hiddenBrokenTastings.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Delete ${hiddenBrokenTastings.length} hidden broken tasting entries?`
      )
    ) {
      return;
    }

    try {
      setCleaning(true);
      setError("");
      await Promise.all(
        hiddenBrokenTastings.map((tasting) =>
          fetch(`${TASTINGS_API_URL}/${tasting._id}`, { method: "DELETE" })
        )
      );
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCleaning(false);
    }
  };

  const grapes = useMemo(
    () => [...new Set(tastings.map((tasting) => tasting.wineId?.grape).filter(Boolean))],
    [tastings]
  );

  const filteredTastings = useMemo(() => {
    return tastings.filter((tasting) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        [
          tasting.wineId?.name,
          tasting.wineId?.producer,
          tasting.wineId?.grape,
          tasting.appearance,
          tasting.personalThoughts,
          ...(tasting.noseNotes || []),
          ...(tasting.palateNotes || []),
          ...(tasting.moodTags || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesRating =
        ratingFilter === "all" || tasting.rating >= Number(ratingFilter);
      const matchesGrape =
        grapeFilter === "all" || tasting.wineId?.grape === grapeFilter;
      const matchesFavorites =
        !favoritesOnly || tasting.wouldBuyAgain || tasting.rating >= 4;

      return matchesSearch && matchesRating && matchesGrape && matchesFavorites;
    });
  }, [tastings, searchTerm, ratingFilter, grapeFilter, favoritesOnly]);

  const favoriteTastings = useMemo(
    () => filteredTastings.filter((tasting) => tasting.wouldBuyAgain || tasting.rating >= 4),
    [filteredTastings]
  );

  const timelineGroups = useMemo(() => {
    return filteredTastings.reduce((groups, tasting) => {
      const label = new Date(tasting.tastedAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      groups[label] ??= [];
      groups[label].push(tasting);
      return groups;
    }, {});
  }, [filteredTastings]);

  const averageRating = tastings.length
    ? (
        tastings.reduce((sum, tasting) => sum + tasting.rating, 0) / tastings.length
      ).toFixed(1)
    : "0.0";

  return (
    <div className={`app-shell ${saveSplash ? "save-splash" : ""}`}>
      <header className="hero-panel">
        <div className="hero-copy">
          <RoseGlassLogo />
          <p className="eyebrow">Digital Wine Journal</p>
          <h1>SipLog</h1>
          <p className="hero-text">
            Build your own tasting timeline, collect bottles you loved, and make
            every sip feel like part of your story.
          </p>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Saved Tastings</span>
            <strong>{tastings.length}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Wine Entries</span>
            <strong>{wines.length}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Average Rating</span>
            <strong>{averageRating}</strong>
          </article>
        </div>
      </header>

      {hiddenBrokenTastings.length > 0 && (
        <section className="notice-card">
          <div>
            <p className="notice-title">Cleanup available</p>
            <p className="notice-text">
              {hiddenBrokenTastings.length} older test tasting
              {hiddenBrokenTastings.length > 1 ? "s are" : " is"} hidden because the
              linked wine data is incomplete.
            </p>
          </div>
          <button
            type="button"
            className="button-secondary"
            onClick={handleCleanupBrokenTastings}
            disabled={cleaning}
          >
            {cleaning ? "Cleaning..." : "Remove Hidden Test Data"}
          </button>
        </section>
      )}

      <section className="panel filter-bar">
        <div className="section-heading">
          <p className="section-kicker">Explore</p>
          <h2>Search & Filter</h2>
        </div>
        <div className="filter-grid">
          <label>
            Search
            <input
              type="text"
              placeholder="Search wine, notes, moods..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <label>
            Minimum Rating
            <select
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value)}
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
              onChange={(event) => setGrapeFilter(event.target.value)}
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
              onChange={(event) => setFavoritesOnly(event.target.checked)}
            />
            Favorites only
          </label>
        </div>
      </section>

      <main className="content-grid">
        <section className="panel form-panel">
          <div className="section-heading">
            <p className="section-kicker">
              {editingId ? "Update entry" : "New entry"}
            </p>
            <h2>{editingId ? "Edit Tasting" : "Add a Tasting"}</h2>
          </div>

          {!editingId && (
            <div className="mode-toggle">
              <label className={`toggle-chip ${createNewWine ? "active" : ""}`}>
                <input
                  type="radio"
                  checked={createNewWine}
                  onChange={() => handleWineModeChange(true)}
                />
                New wine
              </label>
              <label className={`toggle-chip ${!createNewWine ? "active" : ""}`}>
                <input
                  type="radio"
                  checked={!createNewWine}
                  onChange={() => handleWineModeChange(false)}
                />
                Existing wine
              </label>
            </div>
          )}

          <form className="tasting-form" onSubmit={handleSubmit}>
            {!editingId && createNewWine ? (
              <div className="subpanel">
                <h3>Wine Details</h3>
                <div className="form-grid">
                  <label>
                    Wine Name
                    <input type="text" name="name" value={wineForm.name} onChange={handleWineChange} required />
                  </label>
                  <label>
                    Producer
                    <input type="text" name="producer" value={wineForm.producer} onChange={handleWineChange} required />
                  </label>
                  <label>
                    Country
                    <input type="text" name="country" value={wineForm.country} onChange={handleWineChange} required />
                  </label>
                  <label>
                    Region
                    <input type="text" name="region" value={wineForm.region} onChange={handleWineChange} />
                  </label>
                  <label>
                    Grape
                    <input type="text" name="grape" value={wineForm.grape} onChange={handleWineChange} required />
                  </label>
                  <label>
                    Vintage
                    <input type="number" name="vintage" value={wineForm.vintage} onChange={handleWineChange} required />
                  </label>
                </div>
              </div>
            ) : (
              <label>
                {editingId ? "Wine" : "Choose a Wine"}
                <select name="wineId" value={tastingForm.wineId} onChange={handleTastingChange} required>
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
                    onChange={handleTastingChange}
                    required
                  />
                </label>

                <label className="full-width">
                  Nose Notes
                  <input
                    type="text"
                    name="noseNotes"
                    value={tastingForm.noseNotes}
                    onChange={handleTastingChange}
                    placeholder="Cherry, vanilla, cedar..."
                  />
                </label>

                <label className="full-width">
                  Palate Notes
                  <input
                    type="text"
                    name="palateNotes"
                    value={tastingForm.palateNotes}
                    onChange={handleTastingChange}
                    placeholder="Red fruit, spice, plum..."
                  />
                </label>

                <label>
                  Sweetness
                  <select name="sweetness" value={tastingForm.sweetness} onChange={handleTastingChange}>
                    {scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}
                  </select>
                </label>
                <label>
                  Acidity
                  <select name="acidity" value={tastingForm.acidity} onChange={handleTastingChange}>
                    {scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}
                  </select>
                </label>
                <label>
                  Body
                  <select name="body" value={tastingForm.body} onChange={handleTastingChange}>
                    {scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}
                  </select>
                </label>
                <label>
                  Tannin
                  <select name="tannin" value={tastingForm.tannin} onChange={handleTastingChange}>
                    {scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}
                  </select>
                </label>
                <label>
                  Rating
                  <select name="rating" value={tastingForm.rating} onChange={handleTastingChange}>
                    {scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}
                  </select>
                </label>
                <label>
                  Price
                  <input type="number" name="price" min="0" value={tastingForm.price} onChange={handleTastingChange} />
                </label>
                <label className="full-width">
                  Photo Upload
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                </label>
                <label className="full-width">
                  Personal Thoughts
                  <textarea
                    name="personalThoughts"
                    value={tastingForm.personalThoughts}
                    onChange={handleTastingChange}
                    rows="4"
                  />
                </label>
              </div>

              {tastingForm.imageUrl && (
                <div className="photo-preview-wrap">
                  <img src={tastingForm.imageUrl} alt="Wine upload preview" className="photo-preview" />
                </div>
              )}

              <div className="tag-section">
                <span className="mini-heading">Wine mood tags</span>
                <div className="tag-cloud">
                  {MOOD_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-pill ${tastingForm.moodTags.includes(tag) ? "selected" : ""}`}
                      onClick={() => toggleMoodTag(tag)}
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
                  onChange={handleTastingChange}
                />
                Would buy again
              </label>
            </div>

            <div className="button-row">
              <button type="submit" className="button-primary" disabled={submitting}>
                {submitting ? "Saving..." : editingId ? "Save Changes" : "Save Wine + Tasting"}
              </button>
              {editingId && (
                <button type="button" className="button-secondary" onClick={resetForms}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel list-panel">
          <div className="section-heading">
            <p className="section-kicker">Top Shelf</p>
            <h2>Favorites Shelf</h2>
          </div>

          <div className="favorites-shelf">
            {favoriteTastings.slice(0, 3).map((tasting) => (
              <article className="favorite-card" key={`favorite-${tasting._id}`}>
                <BottleRating rating={tasting.rating} />
                <div>
                  <h3>{tasting.wineId.name}</h3>
                  <p>{tasting.wineId.producer}</p>
                  <div className="mood-row">
                    {(tasting.moodTags || []).slice(0, 3).map((tag) => (
                      <span className="mood-chip" key={`${tasting._id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
            {favoriteTastings.length === 0 && (
              <p className="status-message">No favorites yet. Rate some bottles highly or mark them buy again.</p>
            )}
          </div>

          <div className="section-heading timeline-heading">
            <p className="section-kicker">Journal View</p>
            <h2>Tasting Timeline</h2>
          </div>

          {loading && <p className="status-message">Loading tastings...</p>}
          {error && <p className="status-message error">{error}</p>}
          {!loading && !error && filteredTastings.length === 0 && (
            <p className="status-message">No entries match your current filters.</p>
          )}

          <div className="timeline">
            {Object.entries(timelineGroups).map(([dateLabel, items]) => (
              <div className="timeline-group" key={dateLabel}>
                <div className="timeline-date">{dateLabel}</div>
                <div className="card-stack">
                  {items.map((tasting) => (
                    <article className="tasting-card" key={tasting._id}>
                      <div className="card-top">
                        <div>
                          <p className="card-vintage">
                            {tasting.wineId.vintage} {tasting.wineId.country}
                          </p>
                          <h3>{tasting.wineId.name}</h3>
                          <p className="card-subtitle">
                            {tasting.wineId.producer} · {tasting.wineId.grape}
                          </p>
                        </div>
                        <BottleRating rating={tasting.rating} />
                      </div>

                      {tasting.imageUrl && (
                        <img className="card-photo" src={tasting.imageUrl} alt={tasting.wineId.name} />
                      )}

                      <div className="mood-row">
                        {(tasting.moodTags || []).map((tag) => (
                          <span className="mood-chip" key={`${tasting._id}-${tag}`}>{tag}</span>
                        ))}
                      </div>

                      <dl className="detail-grid">
                        <div>
                          <dt>Appearance</dt>
                          <dd>{tasting.appearance}</dd>
                        </div>
                        <div>
                          <dt>Nose</dt>
                          <dd>{tasting.noseNotes?.join(", ") || "Not recorded"}</dd>
                        </div>
                        <div>
                          <dt>Palate</dt>
                          <dd>{tasting.palateNotes?.join(", ") || "Not recorded"}</dd>
                        </div>
                        <div>
                          <dt>Structure</dt>
                          <dd>
                            S {tasting.sweetness} · A {tasting.acidity} · B {tasting.body} · T {tasting.tannin}
                          </dd>
                        </div>
                      </dl>

                      <p className="thoughts-block">{tasting.personalThoughts || "No written thoughts yet."}</p>

                      <div className="button-row">
                        <button type="button" className="button-secondary" onClick={() => handleEdit(tasting)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button-danger"
                          onClick={() => handleDelete(tasting._id)}
                          disabled={deletingId === tasting._id}
                        >
                          {deletingId === tasting._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
