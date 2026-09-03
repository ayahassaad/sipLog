import { useCallback, useEffect, useState } from "react";
import { createWine as createWineRequest, fetchWines } from "../services/wineService";

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
    setLoading(true);
    loadWines().finally(() => setLoading(false));
  }, [loadWines]);

  const addWine = useCallback(async (payload) => {
    const wine = await createWineRequest(payload);
    setWines((prev) => [...prev, wine]);
    return wine;
  }, []);

  return { wines, loading, error, loadWines, addWine };
}
