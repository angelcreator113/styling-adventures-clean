// src/components/Icon.jsx
import React from "react";

const paths = {
  menu:    "M3 6h18M3 12h18M3 18h18",
  search:  "M11 19a8 8 0 1 1 5.657-2.343L21 21",
  bell:    "M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  sun:     "M12 4v2m0 12v2m8-8h-2M6 12H4m12.95 6.95-1.41-1.41M6.46 6.46 5.05 5.05m12.9 0-1.41 1.41M6.46 17.54 5.05 18.95M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8",
  moon:    "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  "sun-moon": "M12 3v2m0 14v2m9-9h-2M5 12H3m12.95 6.95-1.41-1.41M6.46 6.46 5.05 5.05M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z",
};

export default function Icon({ name, size = 18, stroke = "currentColor", ...rest }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke={stroke}
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
