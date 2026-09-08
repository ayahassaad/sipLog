import { useCallback, useEffect, useState } from "react";
import {
  fetchMyProfile,
  followUser as followUserRequest,
  unfollowUser as unfollowUserRequest,
  updateMyEmail as updateMyEmailRequest,
  updateMyPassword as updateMyPasswordRequest,
  updateMyProfile as updateMyProfileRequest,
} from "../services/userService";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchMyProfile();
      setProfile(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    loadProfile().finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadProfile]);

  // Name/avatar updates apply straight to the loaded profile (the response
  // already has the new values, no need to refetch everything).
  const updateProfile = useCallback(async (updates) => {
    const updated = await updateMyProfileRequest(updates);
    setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    return updated;
  }, []);

  const updateEmail = useCallback(async (payload) => {
    const updated = await updateMyEmailRequest(payload);
    setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    return updated;
  }, []);

  const updatePassword = useCallback(async (payload) => updateMyPasswordRequest(payload), []);

  // Follow/unfollow from the Following/Followers lists on your own profile.
  // A flipped flag alone can't move someone between the two lists (following
  // someone new should add them to "Following"), so re-fetch after the
  // request settles rather than trying to patch both lists by hand.
  const toggleFollow = useCallback(
    async (userId, currentlyFollowing) => {
      try {
        if (currentlyFollowing) {
          await unfollowUserRequest(userId);
        } else {
          await followUserRequest(userId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        await loadProfile();
      }
    },
    [loadProfile]
  );

  return {
    profile,
    loading,
    error,
    refresh: loadProfile,
    updateProfile,
    updateEmail,
    updatePassword,
    toggleFollow,
  };
}
