import { useEffect, useState } from "react";
import { fetchUnreadNotificationCount } from "../api/campusApi";

const REFRESH_INTERVAL_MS = 5000;

export function useUnreadNotificationsCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadUnreadCount() {
      try {
        const response = await fetchUnreadNotificationCount();
        if (!active) return;
        setUnreadCount(response.count ?? 0);
      } catch {
        if (!active) return;
        setUnreadCount(0);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadUnreadCount();
      }
    }

    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", loadUnreadCount);
    window.addEventListener("notifications:changed", loadUnreadCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadUnreadCount);
      window.removeEventListener("notifications:changed", loadUnreadCount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return unreadCount;
}
