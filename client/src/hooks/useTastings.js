import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTasting as createTastingRequest,
  deleteTasting as deleteTastingRequest,
  fetchTastings,
  updateTasting as updateTastingRequest,
} from "../services/tastingService";

const PAGE_SIZE = 50;

function sortByCreatedAtDesc(list) {
  return [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function useTastings() {
  const [tastings, setTastings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const loadingMoreRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    try {
      const data = await fetchTastings({ page: 1, limit: PAGE_SIZE });
      setTastings(sortByCreatedAtDesc(data.tastings));
      setPage(data.page);
      setTotalPages(data.totalPages);
      setLastUpdatedAt(new Date());
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
      const data = await fetchTastings({ page: nextPage, limit: PAGE_SIZE });
      setTastings((prev) => sortByCreatedAtDesc([...prev, ...data.tastings]));
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [page, totalPages]);

  const mergeTasting = useCallback((savedTasting) => {
    setTastings((prev) =>
      sortByCreatedAtDesc([
        savedTasting,
        ...prev.filter((tasting) => tasting._id !== savedTasting._id),
      ])
    );
  }, []);

  const create = useCallback(
    async (payload) => {
      const saved = await createTastingRequest(payload);
      mergeTasting(saved);
      setLastUpdatedAt(new Date());
      return saved;
    },
    [mergeTasting]
  );

  const update = useCallback(
    async (id, payload) => {
      const saved = await updateTastingRequest(id, payload);
      mergeTasting(saved);
      setLastUpdatedAt(new Date());
      return saved;
    },
    [mergeTasting]
  );

  const remove = useCallback(async (id) => {
    await deleteTastingRequest(id);
    setTastings((prev) => prev.filter((tasting) => tasting._id !== id));
    setLastUpdatedAt(new Date());
  }, []);

  // Pure local update, no network call -- My Wines and My Favorites share
  // the same underlying tastings, so the actual favorite/unfavorite request
  // and cross-list sync are orchestrated one level up, in JournalPage.
  const setFavoriteFlag = useCallback((tastingId, isFavorited) => {
    setTastings((prev) =>
      prev.map((tasting) =>
        tasting._id === tastingId ? { ...tasting, isFavorited } : tasting
      )
    );
  }, []);

  return {
    tastings,
    loading,
    error,
    lastUpdatedAt,
    hasMore: page < totalPages,
    refresh: loadFirstPage,
    loadMore,
    create,
    update,
    remove,
    setFavoriteFlag,
  };
}
