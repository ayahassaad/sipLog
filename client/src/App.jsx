import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import FavoritesShelf from "./components/FavoritesShelf";
import FilterBar from "./components/FilterBar";
import HeroPanel from "./components/HeroPanel";
import TastingForm from "./components/TastingForm";
import TastingTimeline from "./components/TastingTimeline";
import {
  initialTastingForm,
  initialWineForm,
  MOOD_TAGS,
  TASTINGS_API_URL,
  WINES_API_URL,
} from "./constants";
import { compressImage } from "./utils/compressImage";

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

  const resetForms = useCallback(() => {
    setEditingId("");
    setCreateNewWine(true);
    setWineForm(initialWineForm);
    setTastingForm(initialTastingForm);
    setError("");
  }, []);

  const loadData = useCallback(async () => {
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
      setError("");

      setTastingForm((prev) => {
        if (!createNewWine && winesData.length > 0 && !prev.wineId) {
          return { ...prev, wineId: winesData[0]._id };
        }
        return prev;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [createNewWine]);

  useEffect(() => {
    const loadInitialData = async () => {
      await loadData();
    };

    loadInitialData();
    const intervalId = window.setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadData]);

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
      const res = await fetch(`${TASTINGS_API_URL}/${tastingId}`, {
        method: "DELETE",
      });
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
  }, [favoritesOnly, grapeFilter, ratingFilter, searchTerm, tastings]);

  const favoriteTastings = useMemo(
    () =>
      filteredTastings.filter(
        (tasting) => tasting.wouldBuyAgain || tasting.rating >= 4
      ),
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
      <HeroPanel
        tastingsCount={tastings.length}
        winesCount={wines.length}
        averageRating={averageRating}
      />

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

      <FilterBar
        grapes={grapes}
        searchTerm={searchTerm}
        ratingFilter={ratingFilter}
        grapeFilter={grapeFilter}
        favoritesOnly={favoritesOnly}
        onSearchTermChange={setSearchTerm}
        onRatingFilterChange={setRatingFilter}
        onGrapeFilterChange={setGrapeFilter}
        onFavoritesOnlyChange={setFavoritesOnly}
      />

      <main className="content-grid">
        <TastingForm
          editingId={editingId}
          createNewWine={createNewWine}
          wines={wines}
          wineForm={wineForm}
          tastingForm={tastingForm}
          moodTags={MOOD_TAGS}
          submitting={submitting}
          onSubmit={handleSubmit}
          onWineModeChange={handleWineModeChange}
          onWineChange={handleWineChange}
          onTastingChange={handleTastingChange}
          onPhotoUpload={handlePhotoUpload}
          onToggleMoodTag={toggleMoodTag}
          onCancelEdit={resetForms}
        />

        <section className="panel list-panel">
          <FavoritesShelf tastings={favoriteTastings} />
          <TastingTimeline
            loading={loading}
            error={error}
            filteredCount={filteredTastings.length}
            timelineGroups={timelineGroups}
            deletingId={deletingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
