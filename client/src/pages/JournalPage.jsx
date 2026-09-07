import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { useTastings } from "../hooks/useTastings";
import { useFavoriteTastings } from "../hooks/useFavoriteTastings";
import { useWines } from "../hooks/useWines";
import FilterBar from "../components/FilterBar";
import TastingForm from "../components/TastingForm";
import TastingTimeline from "../components/TastingTimeline";
import { initialTastingForm, initialWineForm } from "../constants";
import { compressImage } from "../utils/compressImage";
import { uploadImage } from "../services/uploadService";
import {
  favoriteTasting as favoriteTastingRequest,
  unfavoriteTasting as unfavoriteTastingRequest,
} from "../services/tastingService";

const AUTO_REFRESH_MS = 30000;

function JournalPage() {
  const tastings = useTastings();
  const favorites = useFavoriteTastings();
  const wines = useWines();
  const [view, setView] = useState("mine");

  const [tastingForm, setTastingForm] = useState(initialTastingForm);
  const [wineForm, setWineForm] = useState(initialWineForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [saveSplash, setSaveSplash] = useState(false);

  const activeTastingsSource = view === "mine" ? tastings : favorites;
  const loading = activeTastingsSource.loading || wines.loading;
  const error = formError || activeTastingsSource.error || wines.error;

  // Default the "existing wine" picker to the first wine once wines load.
  // Derived during render instead of an effect, so there's no extra setState render.
  const effectiveWineId = useMemo(() => {
    if (!editingId) return tastingForm.wineId;
    return tastingForm.wineId || wines.wines[0]?._id || "";
  }, [editingId, tastingForm.wineId, wines.wines]);

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

      if (!editingId) {
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

  // My Wines and My Favorites are two separate lists holding overlapping
  // data, so a favorite/unfavorite here has to update both of them locally
  // (not just whichever one is currently showing) or switching tabs shows
  // stale state.
  const handleToggleFavorite = async (tastingId, currentlyFavorited) => {
    tastings.setFavoriteFlag(tastingId, !currentlyFavorited);
    favorites.setFavoriteFlag(tastingId, !currentlyFavorited);

    try {
      if (currentlyFavorited) {
        await unfavoriteTastingRequest(tastingId);
      } else {
        await favoriteTastingRequest(tastingId);
        // Newly favorited tastings aren't in favorites' local state yet --
        // refetch so "My Favorites" has it next time it's viewed.
        favorites.refresh();
      }
    } catch (err) {
      tastings.setFavoriteFlag(tastingId, currentlyFavorited);
      favorites.refresh();
      setFormError(err.message);
    }
  };

  const filteredTastings = useMemo(() => {
    return activeTastingsSource.tastings.filter((tasting) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        [
          tasting.wineId?.name,
          tasting.wineId?.producer,
          tasting.wineId?.grape,
          tasting.wineId?.country,
          tasting.wineId?.vintage,
          tasting.appearance,
          tasting.personalThoughts,
          ...(tasting.noseNotes || []),
          ...(tasting.palateNotes || []),
          ...(tasting.moodTags || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [searchTerm, activeTastingsSource.tastings]);

  return (
    <>
      <SiteHeader />
        <div className={`app-shell ${saveSplash ? "save-splash" : ""}`}>
        <FilterBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />

        <main className="content-grid">
          <TastingForm
            editingId={editingId}
            wines={wines.wines}
            wineForm={wineForm}
            tastingForm={{ ...tastingForm, wineId: effectiveWineId }}
            submitting={submitting || uploadingPhoto}
            error={error}
            successMessage={successMessage}
            onSubmit={handleSubmit}
            onWineChange={handleWineChange}
            onTastingChange={handleTastingChange}
            onPhotoUpload={handlePhotoUpload}
            onCancelEdit={resetForms}
          />

          <section className="panel list-panel">
            <div className="mode-toggle">
              <label className={`toggle-chip ${view === "mine" ? "active" : ""}`}>
                <input
                  type="radio"
                  checked={view === "mine"}
                  onChange={() => setView("mine")}
                />
                My Wines
              </label>
              <label className={`toggle-chip ${view === "favorites" ? "active" : ""}`}>
                <input
                  type="radio"
                  checked={view === "favorites"}
                  onChange={() => setView("favorites")}
                />
                My Favorites
              </label>
            </div>

            <TastingTimeline
              loading={loading}
              error={error}
              successMessage={successMessage}
              filteredCount={filteredTastings.length}
              tastings={filteredTastings}
              deletingId={deletingId}
              onEdit={view === "mine" ? handleEdit : undefined}
              onDelete={view === "mine" ? handleDelete : undefined}
              onToggleFavorite={handleToggleFavorite}
              showAuthor={view === "favorites"}
              heading={view === "mine" ? "My Wines" : "My Favorites"}
            />
            {activeTastingsSource.hasMore && (
              <div className="button-row">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={activeTastingsSource.loadMore}
                >
                  Load more tastings
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

export default JournalPage;
