import { useCallback, useEffect, useState } from "react";
import {
  fetchUsers,
  followUser as followUserRequest,
  unfollowUser as unfollowUserRequest,
} from "../services/userService";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    loadUsers().finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadUsers]);

  // Optimistic toggle: flip the button instantly, roll back if the request fails.
  const toggleFollow = useCallback(async (userId, currentlyFollowing) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing: !currentlyFollowing } : user
      )
    );

    try {
      if (currentlyFollowing) {
        await unfollowUserRequest(userId);
      } else {
        await followUserRequest(userId);
      }
    } catch (err) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isFollowing: currentlyFollowing } : user
        )
      );
      setError(err.message);
    }
  }, []);

  return { users, loading, error, refresh: loadUsers, toggleFollow };
}
