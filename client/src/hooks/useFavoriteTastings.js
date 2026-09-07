import { useCallback, useEffect, useRef, useState } from "react";
import {
  favoriteTasting as favoriteTastingRequest,
  fetchFavoriteTastings,
  unfavoriteTasting as unfavoriteTastingRequest,
} from "../services/tastingService";

const PAGE_SIZE = 20;

export function useFavoriteTastings() {
  const [tastings, setTastings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const loadingMoreRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    try {
      const data = await fetchFavoriteTastings({ page: 1, limit: PAGE_SIZE });
      setTastings(data.tastings);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    loadFirstPage().finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || page >= totalPages) {
      return;
    }

    loadingMoreRef.current = true;
    try {
      const nextPage = page + 1;
      const data = await fetchFavoriteTastings({ page: nextPage, limit: PAGE_SIZE });
      setTastings((prev) => [...prev, ...data.tastings]);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [page, totalPages]);

  // Unfavoriting here removes the wine from this list entirely -- this view
  // is exactly "everything you've favorited". Rolls back to what the list
  // looked like before if the request fails.
  const toggleFavorite = useCallback(
    async (tastingId, currentlyFavorited) => {
      const previousTastings = tastings;

      if (currentlyFavorited) {
        setTastings((prev) => prev.filter((tasting) => tasting._id !== tastingId));
      }

      try {
        if (currentlyFavorited) {
          await unfavoriteTastingRequest(tastingId);
        } else {
          await favoriteTastingRequest(tastingId);
          loadFirstPage();
        }
      } catch (err) {
        setTastings(previousTastings);
        setError(err.message);
      }
    },
    [tastings, loadFirstPage]
  );

  return {
    tastings,
    loading,
    error,
    hasMore: page < totalPages,
    refresh: loadFirstPage,
    loadMore,
    toggleFavorite,
  };
}
