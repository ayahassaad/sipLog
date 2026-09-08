import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdminUsers, setUserAdminStatus } from "../services/adminService";

const PAGE_SIZE = 25;

// The user directory shown on the admin tab -- paginated, with an optional
// name/username search, and an optimistic admin-status toggle (only ever
// actually called by the super admin; the button itself is hidden from
// everyone else in AdminPage).
export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const loadingMoreRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    try {
      const data = await fetchAdminUsers({ page: 1, limit: PAGE_SIZE });
      setUsers(data.users);
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
    if (loadingMoreRef.current || page >= totalPages) return;
    loadingMoreRef.current = true;
    try {
      const nextPage = page + 1;
      const data = await fetchAdminUsers({ page: nextPage, limit: PAGE_SIZE, search });
      setUsers((prev) => [...prev, ...data.users]);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [page, totalPages, search]);

  // Runs (or clears, when term is empty) a name/username search -- a plain
  // event-triggered action rather than an effect, same pattern as
  // useCommunityFeed's runSearch.
  const runSearch = useCallback(async (term) => {
    const trimmed = term.trim();
    setSearching(true);
    setError("");
    try {
      const data = await fetchAdminUsers({ page: 1, limit: PAGE_SIZE, search: trimmed });
      setSearch(trimmed);
      setUsers(data.users);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }, []);

  // Optimistic toggle: flip the badge instantly, roll back if the request fails.
  const toggleAdmin = useCallback(async (userId, currentlyAdmin) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, isAdmin: !currentlyAdmin } : user))
    );

    try {
      await setUserAdminStatus(userId, !currentlyAdmin);
    } catch (err) {
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, isAdmin: currentlyAdmin } : user))
      );
      setError(err.message);
    }
  }, []);

  return {
    users,
    loading,
    searching,
    error,
    search,
    hasMore: page < totalPages,
    loadMore,
    runSearch,
    toggleAdmin,
  };
}
