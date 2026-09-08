import { useCallback, useEffect, useState } from "react";
import { fetchCommunityFeed } from "../services/tastingService";
import { deleteAdminTasting } from "../services/adminService";

const RECENT_LIMIT = 8;

// The "Recent Tastings" moderation list on the admin tab -- just the
// newest handful across the whole site (same feed Community itself
// reads), plus the ability for an admin to remove any of them outright.
export function useAdminTastings() {
  const [tastings, setTastings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const loadTastings = useCallback(async () => {
    try {
      const data = await fetchCommunityFeed({ page: 1, limit: RECENT_LIMIT });
      setTastings(data.tastings);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    loadTastings().finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadTastings]);

  const removeTasting = useCallback(async (tastingId) => {
    setRemovingId(tastingId);
    try {
      await deleteAdminTasting(tastingId);
      setTastings((prev) => prev.filter((tasting) => tasting._id !== tastingId));
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId("");
    }
  }, []);

  return { tastings, loading, error, removingId, removeTasting };
}
