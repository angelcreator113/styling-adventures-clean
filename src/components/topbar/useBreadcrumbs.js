import { useMemo } from "react";

export function useBreadcrumbs(pathname) {
  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const isHome = segments.length === 0 || segments[0] === "home";
    if (isHome) return { items: null, hasItems: false };

    let path = "";
    const items = segments.map((seg, i) => {
      path += `/${seg}`;
      const label = seg.replace(/-/g, " ");
      const text = label.charAt(0).toUpperCase() + label.slice(1);
      const isLast = i === segments.length - 1;
      return { path, text, isLast };
    });
    return { items, hasItems: true };
  }, [pathname]);
}
