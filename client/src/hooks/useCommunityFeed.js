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
  const [followingOnly, setFollowingOnlyState] = useState(false);
  const loadingMoreRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    try {
      const data = await fetchCommunityFeed({ page: 1, limit: PAGE_SIZE, author, followingOnly });
      setTastings(data.tastings);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setError("");
    } catch (err) {
      setError(err.message);
    }
    // followingOnly is intentionally left out here -- toggling it goes
    // through setFollowingOnly below (which does its own fetch), not this
    // mount-time loader, so it shouldn't also fire this effect again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const data = await fetchCommunityFeed({
        page: nextPage,
        limit: PAGE_SIZE,
        search,
        author,
        followingOnly,
      });
      setTastings((prev) => [...prev, ...data.tastings]);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [page, totalPages, search, author, followingOnly]);

  // Runs (or clears, when term is empty) a wine search against the feed.
  // A plain event-triggered action rather than an effect, so the caller
  // decides when it fires (e.g. debounced as the user types).
  const runSearch = useCallback(async (term) => {
    const trimmed = term.trim();
    setSearching(true);
    setError("");
    try {
      const data = await fetchCommunityFeed({
        page: 1,
        limit: PAGE_SIZE,
        search: trimmed,
        author,
        followingOnly,
      });
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
  }, [author, followingOnly]);

  // Flips the "just the people I follow" toggle and re-fetches the first
  // page under it -- keeps whatever search term is already active, the
  // same way runSearch keeps the toggle active.
  const setFollowingOnly = useCallback(async (value) => {
    setSearching(true);
    setError("");
    try {
      const data = await fetchCommunityFeed({
        page: 1,
        limit: PAGE_SIZE,
        search,
        author,
        followingOnly: value,
      });
      setFollowingOnlyState(value);
      setTastings(data.tastings);
      setMatchedUsers(data.matchedUsers || []);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }, [search, author]);

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
    followingOnly,
    setFollowingOnly,
  };
}
