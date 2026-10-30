import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverFallback = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

/** 모바일(767px 이하)에서는 바텀시트, 그 이상은 드롭다운으로 표시 */
export const MOBILE_QUERY = "(max-width: 767px)";
