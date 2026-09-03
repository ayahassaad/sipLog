import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import FavoritesShelf from "../components/FavoritesShelf";
import FilterBar from "../components/FilterBar";
import HeroPanel from "../components/HeroPanel";
import TastingForm from "../components/TastingForm";
import TastingTimeline from "../components/TastingTimeline";
import { initialTastingForm, initialWineForm, MOOD_TAGS } from "../constants";
import { compressImage } from "../utils/compressImage";
import { uploadImage } from "../services/uploadService";
import { fetchWines, createWine as createWineRequest } from "../services/wineService";
import {
  fetchTastings,
  createTasting as createTastingRequest,
  updateTasting as updateTastingRequest,
  deleteTasting as deleteTastingRequest,
} from "../services/tastingService";

function JournalPage() {
  const { user, logout } = useAuth();

  const [tastings, setTastings] = useState([]);
  const [wines, setWines] = useState([]);
  const [tastingForm, setTastingForm] = useState(initialTastingForm);
  const [wineForm, setWineForm] = useState(initialWineForm);
  const [createNewWine, setCreateNewWine] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [grapeFilter, setGrapeFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [saveSplash, setSaveSplash] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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
      const [tastingsData, winesData] = await Promise.all([fetchTastings(), fetchWines()]);

      const sortedTastings = [...tastingsData].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setTastings(sortedTastings);
      setWines(winesData);
      setLastUpdatedAt(new Date());
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
    loadData();
    const intervalId = window.setInterval(loadData, 30000);

    const handleWindowFocus = () => loadData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadData]);

  const flashSplash = () => {
    setSaveSplash(true);
    window.setTimeout(() => setSaveSplash(false), 1400);
  };

  const mergeTastingIntoState = useCallback((savedTasting) => {
    setTastings((prev) =>
      [savedTasting, ...prev.filter((tasting) => tasting._id !== savedTasting._id)].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
    );
  }, []);

  const handleTastingChange = (event) => {
    const { name, value, type, checked } = event.target;
    setTastingForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
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
      setUploadingPhoto(true);
      // Compress locally first (keeps the upload small and fast), then upload
      // the compressed image straight to Cloudinary - only the resulting URL
      // is ever stored, never the image bytes in MongoDB.
      const compressedImage = await compressImage(file);
      const uploadedUrl = await uploadImage(compressedImage);
      setTastingForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      let wineId = tastingForm.wineId;

      if (!editingId && createNewWine) {
        const createdWine = await createWineRequest(wineForm);
        wineId = createdWine._id;
      }

      const payload = {
        ...tastingForm,
        wineId,
        noseNotes: tastingForm.noseNotes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        palateNotes: tastingForm.palateNotes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const savedTasting = editingId
        ? await updateTastingRequest(editingId, payload)
        : await createTastingRequest(payload);

      resetForms();
      setSearchTerm("");
      setRatingFilter("all");
      setGrapeFilter("all");
      setFavoritesOnly(false);
      flashSplash();
      mergeTastingIntoState(savedTasting);
      setLastUpdatedAt(new Date());
      setSuccessMessage(
        editingId
          ? "Tasting updated successfully. It has been refreshed in the timeline."
          : "Wine and tasting saved successfully. Scroll down to see it at the top of the timeline."
      );
      window.setTimeout(() => {
        document.getElementById("timeline-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
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
      await deleteTastingRequest(tastingId);
      setTastings((prev) => prev.filter((tasting) => tasting._id !== tastingId));
      setLastUpdatedAt(new Date());
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

      const matchesRating = ratingFilter === "all" || tasting.rating >= Number(ratingFilter);
      const matchesGrape = grapeFilter === "all" || tasting.wineId?.grape === grapeFilter;
      const matchesFavorites = !favoritesOnly || tasting.wouldBuyAgain || tasting.rating >= 4;

      return matchesSearch && matchesRating && matchesGrape && matchesFavorites;
    });
  }, [favoritesOnly, grapeFilter, ratingFilter, searchTerm, tastings]);

  const favoriteTastings = useMemo(
    () => filteredTastings.filter((tasting) => tasting.wouldBuyAgain || tasting.rating >= 4),
    [filteredTastings]
  );

  const timelineGroups = useMemo(() => {
    return filteredTastings.reduce((groups, tasting) => {
      const timelineDate = tasting.createdAt || tasting.updatedAt;
      const label = new Date(timelineDate).toLocaleDateString(undefined, {
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
    ? (tastings.reduce((sum, tasting) => sum + tasting.rating, 0) / tastings.length).toFixed(1)
    : "0.0";

  return (
    <div className={`app-shell ${saveSplash ? "save-splash" : ""}`}>
      <div className="top-bar">
        <span className="user-name">Hi, {user?.name}</span>
        <button type="button" className="button-secondary" onClick={logout}>
          Log out
        </button>
      </div>

      <HeroPanel
        tastingsCount={tastings.length}
        winesCount={wines.length}
        averageRating={averageRating}
      />

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
          submitting={submitting || uploadingPhoto}
          error={error}
          successMessage={successMessage}
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
            successMessage={successMessage}
            filteredCount={filteredTastings.length}
            timelineGroups={timelineGroups}
            lastUpdatedAt={lastUpdatedAt}
            deletingId={deletingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}

export default JournalPage;
