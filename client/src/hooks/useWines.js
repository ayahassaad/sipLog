import { useCallback, useEffect, useState } from "react";
import {
  createWine as createWineRequest,
  fetchWines,
  updateWine as updateWineRequest,
} from "../services/wineService";

export function useWines() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWines = useCallback(async () => {
    try {
      const data = await fetchWines();
      setWines(data);
      setError("");
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    loadWines().finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadWines]);

  const addWine = useCallback(async (payload) => {
    const wine = await createWineRequest(payload);
    setWines((prev) => [...prev, wine]);
    return wine;
  }, []);

  const updateWine = useCallback(async (id, payload) => {
    const wine = await updateWineRequest(id, payload);
    setWines((prev) => prev.map((existing) => (existing._id === id ? wine : existing)));
    return wine;
  }, []);

  return { wines, loading, error, loadWines, addWine, updateWine };
}
