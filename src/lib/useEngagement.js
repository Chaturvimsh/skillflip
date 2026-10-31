import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * The signed-in visitor's likes and saves, with optimistic toggles.
 * Public counts come from the server; this hook only tracks "mine" and the local
 * delta so the UI reacts instantly.
 */
export function useEngagement() {
  const { user } = useAuth();
  const [liked, setLiked] = useState(() => new Set());
  const [saved, setSaved] = useState(() => new Set());
  const [deltas, setDeltas] = useState({});

  useEffect(() => {
    if (!user?.id) {
      setLiked(new Set());
      setSaved(new Set());
      return undefined;
    }
    let alive = true;
    Promise.all([base44.entities.PostLike.list(), base44.entities.SavedPost.list()])
      .then(([likes, saves]) => {
        if (!alive) return;
        const likeRows = Array.isArray(likes) ? likes : likes?.items ?? [];
        const saveRows = Array.isArray(saves) ? saves : saves?.items ?? [];
        setLiked(new Set(likeRows.map((row) => row.post_id)));
        setSaved(new Set(saveRows.map((row) => row.post_id)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const bump = (postId, key, amount) =>
    setDeltas((prev) => ({
      ...prev,
      [postId]: { ...(prev[postId] ?? {}), [key]: (prev[postId]?.[key] ?? 0) + amount },
    }));

  const toggle = useCallback(
    async (postId, collection, setState, key) => {
      if (!user?.id) return false;
      const isOn = key === "like" ? liked.has(postId) : saved.has(postId);
      const next = new Set(key === "like" ? liked : saved);
      if (isOn) next.delete(postId);
      else next.add(postId);
      setState(next);
      bump(postId, key, isOn ? -1 : 1);
      try {
        if (isOn) {
          const result = await base44.entities[collection].filter({ post_id: postId });
          const rows = Array.isArray(result) ? result : result?.items ?? [];
          await Promise.all(rows.map((row) => base44.entities[collection].delete(row.id)));
        } else {
          await base44.entities[collection].create({ post_id: postId });
        }
        return true;
      } catch {
        const revert = new Set(key === "like" ? liked : saved);
        if (isOn) revert.add(postId);
        else revert.delete(postId);
        setState(revert);
        bump(postId, key, isOn ? 1 : -1);
        return false;
      }
    },
    [liked, saved, user?.id],
  );

  const toggleLike = useCallback((postId) => toggle(postId, "PostLike", setLiked, "like"), [toggle]);
  const toggleSave = useCallback((postId) => toggle(postId, "SavedPost", setSaved, "save"), [toggle]);

  return { liked, saved, deltas, toggleLike, toggleSave };
}