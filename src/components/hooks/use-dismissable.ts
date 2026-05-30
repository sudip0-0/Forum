"use client";

import { useEffect, type RefObject } from "react";

/**
 * Closes a popover/menu when the user presses Escape or clicks outside of it.
 *
 * Keyboard users can dismiss the overlay with Escape, and pointer users can
 * click away to close it, matching native menu behavior. The listeners are
 * only attached while `open` is true to avoid unnecessary global handlers.
 */
export function useDismissable(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function handlePointerDown(event: MouseEvent) {
      const container = containerRef.current;
      if (container && !container.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, onClose, containerRef]);
}
