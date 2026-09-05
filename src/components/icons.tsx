/* Inline SVG icon system — no external icon fonts. 24×24 stroke icons. */
import type { SVGProps } from "react";

const P: Record<string, React.ReactNode> = {
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.4h.01" /></>,
  arrowL: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowR: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUR: <path d="M7 17 17 7M8 7h9v9" />,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10.3 21a2 2 0 0 0 3.4 0" /></>,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></>,
  box: <><path d="m12 2 8.5 4.9v9.8L12 21.6l-8.5-4.9V6.9L12 2Z" /><path d="m3.6 7 8.4 4.8L20.4 7M12 11.8V21.5" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /></>,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /><path d="M2.5 3.5h2.6l2.3 11.5a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.7-7.1H6" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 15v3M11.5 10v8M16 12.5V18M20.5 6.5V18" /></>,
  chat: <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.5-5.6A8.5 8.5 0 1 1 21 12Z" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  chevD: <path d="m6 9.5 6 6 6-6" />,
  chevL: <path d="m14.5 6-6 6 6 6" />,
  chevR: <path d="m9.5 6 6 6-6 6" />,
  chip: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />,
  cpu: <><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></>,
  crown: <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-1.5 11h-15L3 7Z" />,
  download: <><path d="M12 3v11M7.5 10 12 14.5 16.5 10" /><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  gauge: <><path d="M12 15.5 8.5 12" /><path d="M20.5 15.5a9 9 0 1 0-17 0" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  headset: <><path d="M4 13a8 8 0 1 1 16 0" /><rect x="2.5" y="13" width="4.5" height="7" rx="2" /><rect x="17" y="13" width="4.5" height="7" rx="2" /><path d="M20 20v1a2.5 2.5 0 0 1-2.5 2.5H13" /></>,
  home: <><path d="m3.5 11 8.5-7 8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-6h4v6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6h.01" /></>,
  key: <><circle cx="7.5" cy="15.5" r="4.5" /><path d="m11 12 8.5-8.5M17 6l3 3M14.5 8.5l2.5 2.5" /></>,
  layers: <><path d="m12 2.5 9 5-9 5-9-5 9-5Z" /><path d="m3 12.5 9 5 9-5M3 17l9 5 9-5" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" /></>,
  logout: <><path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" /><path d="M17 8l4 4-4 4M21 12H9" /></>,
  mail: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  package: <><path d="m12 2 8.5 4.9v9.8L12 21.6l-8.5-4.9V6.9L12 2Z" /><path d="m3.6 7 8.4 4.8L20.4 7M12 11.8v9.7M7.5 4.5l8.6 5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  receipt: <><path d="M5 3h14v18l-2.3-1.5L14.4 21l-2.4-1.5L9.6 21l-2.3-1.5L5 21V3Z" /><path d="M9 8h6M9 12h6M9 16h3.5" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 3v6h-6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-4.5-4.5" /></>,
  send: <path d="M21.5 2.5 10.8 13.2M21.5 2.5 14.5 21.5l-3.7-8.3-8.3-3.7 19-7Z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" /></>,
  shield: <><path d="M12 2.5 4.5 5.5v6c0 4.7 3.2 8.4 7.5 10 4.3-1.6 7.5-5.3 7.5-10v-6L12 2.5Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></>,
  spark: <path d="M12 2.5c.6 4.8 2 7.6 3.4 9.1 1.5 1.4 4.3 2.8 9.1 3.4-4.8.6-7.6 2-9.1 3.4-1.4 1.5-2.8 4.3-3.4 9.1-.6-4.8-2-7.6-3.4-9.1C7.2 17 4.4 15.6 0 15c4.8-.6 7.6-2 9.1-3.4 1.4-1.5 2.8-4.3 3.4-9.1Z" transform="translate(1.5 0) scale(0.92)" />,
  star: <path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.4 1.1 6.3L12 17.2l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9L12 2.8Z" />,
  tag: <><path d="M12.6 2.6H4a1.5 1.5 0 0 0-1.5 1.5v8.6c0 .4.16.78.44 1.06l8.9 8.9a1.5 1.5 0 0 0 2.12 0l8.6-8.6a1.5 1.5 0 0 0 0-2.12l-8.9-8.9a1.5 1.5 0 0 0-1.06-.44Z" /><circle cx="8" cy="8" r="1.6" /></>,
  trash: <><path d="M4 6.5h16M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6" /><path d="M6 6.5 7 20a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 20l1-13.5M10 11v6M14 11v6" /></>,
  truck: <><path d="M1.5 5.5h13v11h-13z" /><path d="M14.5 9h4l3 3.5V16.5h-7" /><circle cx="6" cy="18.5" r="2" /><circle cx="17.5" cy="18.5" r="2" /></>,
  upload: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M21.5 20.5c0-2.8-1.8-4.9-4.5-5.7" /></>,
  wallet: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5V9" /><rect x="3" y="8" width="18" height="12" rx="2.5" /><path d="M16.5 14h.01" /></>,
  wand: <><path d="m15 4 5 5M5 19 14.5 9.5M17.5 2.5 18 4l1.5.5L18 5l-.5 1.5L17 5l-1.5-.5L17 4l.5-1.5ZM21 9l.4 1.1L22.5 10.5l-1.1.4L21 12l-.4-1.1-1.1-.4 1.1-.4L21 9ZM8 2.5 8.4 3.6 9.5 4 8.4 4.4 8 5.5 7.6 4.4 6.5 4l1.1-.4L8 2.5Z" /><path d="m3 21 6.5-6.5" /></>,
};

export function I({ name, size = 18, strokeWidth = 1.8, ...rest }: { name: string; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden {...rest}
    >
      {P[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

import logoIcon from "../assets/livotech-icon.png";
import logoFull from "../assets/livotech-logo.png";

export function Logo({ size = 30, className = "" }: { size?: number; className?: string }) {
  return <img src={logoIcon} alt="LivoTech" width={size} height={size} className={`object-contain ${className}`} />;
}

/** Full lockup (mark + wordmark + tagline) for larger brand moments — footer, auth pages. */
export function LogoFull({ width = 220, className = "" }: { width?: number; className?: string }) {
  return <img src={logoFull} alt="LivoTech — Digital products, tools & solutions" width={width} className={`object-contain ${className}`} />;
}
