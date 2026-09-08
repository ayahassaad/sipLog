import { useCallback, useEffect, useRef, useState } from "react";
import {
  favoriteTasting as favoriteTastingRequest,
  fetchCommunityFeed,
  unfavoriteTasting as unfavoriteTastingRequest,
} from "../services/tastingService";

const PAGE_SIZE = 20;

export function useCommunityFeed({ author = "" } = {}) {
  const [tastings, setTastings] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const loadingMoreRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    try {
      const data = await fetchCommunityFeed({ page: 1, limit: PAGE_SIZE, author });
      setTastings(data.tastings);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [author]);

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
      const data = await fetchCommunityFeed({ page: nextPage, limit: PAGE_SIZE, search, author });
      setTastings((prev) => [...prev, ...data.tastings]);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [page, totalPages, search, author]);

  // Runs (or clears, when term is empty) a wine search against the feed.
  // A plain event-triggered action rather than an effect, so the caller
  // decides when it fires (e.g. debounced as the user types).
  const runSearch = useCallback(async (term) => {
    const trimmed = term.trim();
    setSearching(true);
    setError("");
    try {
      const data = await fetchCommunityFeed({ page: 1, limit: PAGE_SIZE, search: trimmed, author });
      setSearch(trimmed);
      setTastings(data.tastings);
      setMatchedUsers(data.matchedUsers || []);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }, [author]);

  // Optimistic toggle: flip the star instantly, roll back if the request fails.
  const toggleFavorite = useCallback(async (tastingId, currentlyFavorited) => {
    setTastings((prev) =>
      prev.map((tasting) =>
        tasting._id === tastingId ? { ...tasting, isFavorited: !currentlyFavorited } : tasting
      )
    );

    try {
      if (currentlyFavorited) {
        await unfavoriteTastingRequest(tastingId);
      } else {
        await favoriteTastingRequest(tastingId);
      }
    } catch (err) {
      setTastings((prev) =>
        prev.map((tasting) =>
          tasting._id === tastingId ? { ...tasting, isFavorited: currentlyFavorited } : tasting
        )
      );
      setError(err.message);
    }
  }, []);

  return {
    tastings,
    matchedUsers,
    loading,
    searching,
    error,
    hasMore: page < totalPages,
    refresh: loadFirstPage,
    loadMore,
    toggleFavorite,
    search,
    runSearch,
  };
}
