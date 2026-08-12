import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { hasSupabase, supabase } from "../lib/supabase";

const VISITOR_ID_KEY = "jeannette_portfolio_visitor_id";
const SESSION_VISIT_KEY = "jeannette_portfolio_visit_recorded";

function createUuid() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // Valid UUID v4 fallback for older browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    }
  );
}

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = createUuid();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}

export default function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!hasSupabase || !supabase) return;

    const currentPath = location.pathname || "/";

    // Never count visits to private admin pages.
    if (
      currentPath.startsWith("/admin") ||
      currentPath.startsWith("/crud")
    ) {
      return;
    }

    // Count one visit during the current browser-tab session.
    if (sessionStorage.getItem(SESSION_VISIT_KEY)) return;

    // Set this before the request to prevent React StrictMode
    // from inserting the same visit twice during development.
    sessionStorage.setItem(SESSION_VISIT_KEY, "true");

    let cancelled = false;

    async function recordVisit() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-visit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              visitorId: getVisitorId(),
              path: currentPath.slice(0, 300),
            }),
          }
        );

        if (response.status >= 500 && !cancelled) {
          console.error("Could not record website visit.");
          sessionStorage.removeItem(SESSION_VISIT_KEY);
        }
      } catch {
        if (!cancelled) {
          console.error("Could not record website visit.");
          sessionStorage.removeItem(SESSION_VISIT_KEY);
        }
      }
    }

    recordVisit();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  return null;
}
