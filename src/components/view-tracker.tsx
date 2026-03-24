"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  postId: string;
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    fetch(`/api/views/posts/${postId}`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Silently ignore — view tracking is non-critical
    });
  }, [postId]);

  return null;
}
