import { useCallback, useEffect, useState } from "react";
import {
  fetchUserProfile,
  followUser as followUserRequest,
  unfollowUser as unfollowUserRequest,
} from "../services/userService";

// Someone else's (or your own, viewed publicly) profile by username --
// separate from useProfile, which is always "my own profile" and includes
// editable fields like email that have no place on a public view.
export function usePublicProfile(username) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchUserProfile(username);
      setProfile(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [username]);

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

  // Optimistic toggle: flip the button and the followers count instantly,
  // roll both back if the request fails.
  const toggleFollow = useCallback(async () => {
    if (!profile) {
      return;
    }

    const wasFollowing = profile.isFollowing;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !wasFollowing,
            followersCount: prev.followersCount + (wasFollowing ? -1 : 1),
          }
        : prev
    );

    try {
      if (wasFollowing) {
        await unfollowUserRequest(profile.id);
      } else {
        await followUserRequest(profile.id);
      }
    } catch (err) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: wasFollowing,
              followersCount: prev.followersCount + (wasFollowing ? 1 : -1),
            }
          : prev
      );
      setError(err.message);
    }
  }, [profile]);

  return { profile, loading, error, toggleFollow };
}
