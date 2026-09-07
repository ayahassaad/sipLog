import { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { useTastings } from "../hooks/useTastings";
import { useWines } from "../hooks/useWines";
import FavoritesShelf from "../components/FavoritesShelf";
import FilterBar from "../components/FilterBar";
import HeroPanel from "../components/HeroPanel";
import TastingForm from "../components/TastingForm";
import TastingTimeline from "../components/TastingTimeline";
import { initialTastingForm, initialWineForm, MOOD_TAGS } from "../constants";
import { compressImage } from "../utils/compressImage";
import { uploadImage } from "../services/uploadService";

const AUTO_REFRESH_MS = 30000;

function JournalPage() {
  const tastings = useTastings();
  const wines = useWines();

  const [tastingForm, setTastingForm] = useState(initialTastingForm);
  const [wineForm, setWineForm] = useState(initialWineForm);
  const [createNewWine, setCreateNewWine] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [grapeFilter, setGrapeFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [saveSplash, setSaveSplash] = useState(false);

  const loading = tastings.loading || wines.loading;
  const error = formError || tastings.error || wines.error;

  // Default the "existing wine" picker to the first wine once wines load.
  // Derived during render instead of an effect, so there's no extra setState render.
  const effectiveWineId = useMemo(() => {
    if (createNewWine) return tastingForm.wineId;
    return tastingForm.wineId || wines.wines[0]?._id || "";
  }, [createNewWine, tastingForm.wineId, wines.wines]);

  // Keep the journal reasonably fresh if it's left open in a background tab.
  useEffect(() => {
    const refreshAll = () => {
      tastings.refresh();
      wines.loadWines();
    };

    const intervalId = window.setInterval(refreshAll, AUTO_REFRESH_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAll();
      }
    };

    window.addEventListener("focus", refreshAll);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshAll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForms = () => {
    setEditingId("");
    setCreateNewWine(true);
    setWineForm(initialWineForm);
    setTastingForm(initialTastingForm);
    setFormError("");
  };

  const flashSplash = () => {
    setSaveSplash(true);
    window.setTimeout(() => setSaveSplash(false), 1400);
  };

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
    if (!useNewWine && wines.wines.length > 0) {
      setTastingForm((prev) => ({ ...prev, wineId: wines.wines[0]._id }));
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
      setFormError("");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      let wineId = effectiveWineId;

      if (!editingId && createNewWine) {
        const createdWine = await wines.addWine(wineForm);
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

      if (editingId) {
        await tastings.update(editingId, payload);
        setSuccessMessage("Tasting updated successfully. It has been refreshed in the timeline.");
      } else {
        await tastings.create(payload);
        setSuccessMessage(
          "Wine and tasting saved successfully. Scroll down to see it at the top of the timeline."
        );
      }

      resetForms();
      setSearchTerm("");
      setRatingFilter("all");
      setGrapeFilter("all");
      setFavoritesOnly(false);
      flashSplash();
      window.setTimeout(() => {
        document.getElementById("timeline-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (err) {
      setFormError(err.message);
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
      setFormError("");
      await tastings.remove(tastingId);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setDeletingId("");
    }
  };

  const handleEdit = (tasting) => {
    setEditingId(tasting._id);
    setCreateNewWine(false);
    setFormError("");
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
    () => [...new Set(tastings.tastings.map((tasting) => tasting.wineId?.grape).filter(Boolean))],
    [tastings.tastings]
  );

  const filteredTastings = useMemo(() => {
    return tastings.tastings.filter((tasting) => {
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
  }, [favoritesOnly, grapeFilter, ratingFilter, searchTerm, tastings.tastings]);

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

  return (
    <div className={`app-shell ${saveSplash ? "save-splash" : ""}`}>
      <NavBar />

      <HeroPanel />

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
          wines={wines.wines}
          wineForm={wineForm}
          tastingForm={{ ...tastingForm, wineId: effectiveWineId }}
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
            lastUpdatedAt={tastings.lastUpdatedAt}
            deletingId={deletingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {tastings.hasMore && (
            <div className="button-row">
              <button type="button" className="button-secondary" onClick={tastings.loadMore}>
                Load more tastings
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default JournalPage;
