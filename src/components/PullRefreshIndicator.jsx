import { useEffect, useRef, useState } from "react";

const MAX_PULL = 110;
const REFRESH_DISTANCE = 76;

export default function PullRefreshIndicator() {
  const startY = useRef(0);
  const pulling = useRef(false);

  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

    const onTouchStart = (event) => {
      if (!isMobile() || window.scrollY > 0 || refreshing) {
        return;
      }

      startY.current = event.touches[0].clientY;
      pulling.current = true;
      setDistance(0);
    };

    const onTouchMove = (event) => {
      if (!pulling.current || refreshing) {
        return;
      }

      const currentY = event.touches[0].clientY;
      const rawDistance = currentY - startY.current;

      if (rawDistance <= 0) {
        setDistance(0);
        return;
      }

      const resistedDistance = Math.min(rawDistance * 0.48, MAX_PULL);
      setDistance(resistedDistance);
    };

    const onTouchEnd = () => {
      if (!pulling.current || refreshing) {
        return;
      }

      pulling.current = false;

      if (distance >= REFRESH_DISTANCE) {
        setRefreshing(true);

        window.setTimeout(() => {
          window.location.reload();
        }, 420);

        return;
      }

      setDistance(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [distance, refreshing]);

  const visible = distance > 4 || refreshing;
  const rotation = Math.min((distance / REFRESH_DISTANCE) * 300, 300);

  return (
    <div
      className={[
        "pull-refresh-indicator",
        visible ? "is-visible" : "",
        refreshing ? "is-refreshing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
      style={{
        "--pull-rotation": `${rotation}deg`,
      }}
    >
      <span className="pull-refresh-cut-circle" />
    </div>
  );
}
