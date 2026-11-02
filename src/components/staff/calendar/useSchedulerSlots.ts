import { RefObject, useEffect, useState } from "react";

/**
 * calendarkit-pro renders its own header and sidebar and exposes no slots for custom content.
 * This finds the two spots we extend and hands back elements to portal into:
 *  - `headerSlot`: the (empty, because the view switcher is hidden) right-hand group of the header
 *  - `sidebarSlot`: the body of the left sidebar, under the mini calendar
 *
 * It uses a MutationObserver instead of polling and only updates state when an element actually changes.
 */
export function useSchedulerSlots(containerRef: RefObject<HTMLElement>) {
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const [sidebarSlot, setSidebarSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let panel: HTMLElement | null = null;
    let raf = 0;

    const locate = () => {
      raf = 0;

      // Header: the right-hand group is the last child of the header row (the one that stacks below md)
      const heading = root.querySelector("h2");
      const row = heading?.closest<HTMLElement>("div.md\\:flex-row");
      const right = row?.lastElementChild as HTMLElement | null;
      setHeaderSlot((prev) => (prev === right ? prev : right));

      // Sidebar: the flex-1 block that holds the "Calendars" accordion
      const host = root.querySelector<HTMLElement>("div.flex-1.px-4.space-y-5.mt-5");
      if (host) {
        host.setAttribute("data-vaw-host", "");
        host.parentElement?.setAttribute("data-vaw-sidebar", "");
        if (!panel || panel.parentElement !== host) {
          panel = document.createElement("div");
          panel.setAttribute("data-vaw-panel", "");
          host.appendChild(panel);
        }
        setSidebarSlot((prev) => (prev === panel ? prev : panel));
      } else {
        panel = null;
        setSidebarSlot((prev) => (prev === null ? prev : null));
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(locate);
    };

    locate();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      panel?.remove();
    };
  }, [containerRef]);

  return { headerSlot, sidebarSlot };
}
