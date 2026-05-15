"use client";

import { useEffect, useRef } from "react";

interface ThreadViewTrackerProps {
  threadId: string;
}

export function ThreadViewTracker({ threadId }: ThreadViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    const key = `viewed-thread:${threadId}`;
    if (sessionStorage.getItem(key)) return;
    tracked.current = true;

    fetch("/api/trpc/thread.incrementView", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { id: threadId } }),
    })
      .then((response) => {
        if (response.ok) sessionStorage.setItem(key, "1");
      })
      .catch(() => {});
  }, [threadId]);

  return null;
}
