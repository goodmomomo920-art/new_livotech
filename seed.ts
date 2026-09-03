/* ------------------------------------------------------------------
   Demo dataset for LivoTech — clearly marked seed data, NOT production.
   Images are self-contained SVG "product shots" so nothing depends on
   the network. Mirrors the normalized production schema.
------------------------------------------------------------------- */
import type { Addon, Product, ProductType, StoreState } from "./types";

export const SEED_V = 3;

/* ------------------------- embedded product shots ------------------------- */

const enc = (s: string) => `data:image/svg+xml,${encodeURIComponent(s)}`;
const rct = (x: number, y: number, w: number, h: number, fill: string, r = 7) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
const ln = (x: number, y: number, w: number, h = 10, o = 0.9) =>
  rct(x, y, w, h, `rgba(236,244,250,${o})`, h / 2);
const mt = (x: number, y: number, w: number, h = 8, o = 0.32) =>
  rct(x, y, w, h, `rgba(148,175,200,${o})`, h / 2);

const FRAME = (inner: string, c1: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}" stop-opacity="0.22"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></linearGradient></defs><rect width="960" height="600" fill="#0c141f"/><rect width="960" height="600" fill="url(#g)"/><rect y="0" width="960" height="46" fill="#121d2b"/><circle cx="26" cy="23" r="5" fill="#f4587a"/><circle cx="44" cy="23" r="5" fill="#f0a83c"/><circle cx="62" cy="23" r="5" fill="#39d99a"/><rect x="300" y="14" width="360" height="18" rx="9" fill="#0c141f" stroke="rgba(148,175,200,0.25)"/>${inner}</svg>`;

function shotSite(c1: string, c2: string): string {
  let s = "";
  s += rct(40, 76, 26, 26, c1, 8) + mt(78, 84, 90, 10, 0.7);
  s += mt(700, 84, 50, 10) + mt(764, 84, 50, 10) + rct(830, 74, 90, 30, c1, 15);
  s += ln(40, 170, 330, 26) + ln(40, 208, 250, 26, 0.55);
  s += mt(40, 258, 300, 9) + mt(40, 276, 260, 9);
  s += rct(40, 310, 130, 42, c1, 10) + rct(184, 310, 130, 42, "rgba(148,175,200,0.16)", 10);
  s += `<rect x="520" y="140" width="400" height="250" rx="14" fill="${c2}" opacity="0.28"/><rect x="540" y="160" width="360" height="170" rx="10" fill="${c2}" opacity="0.5"/><circle cx="720" cy="245" r="34" fill="#0c141f" opacity="0.55"/><path d="M708 245 l10 10 22-24" stroke="#eaf4fa" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s += rct(520, 356, 122, 34, "rgba(236,244,250,0.12)", 17);
  for (let i = 0; i < 3; i++) {
    const x = 40 + i * 300;
    s += rct(x, 430, 280, 120, "rgba(236,244,250,0.06)", 12);
    s += rct(x + 20, 452, 34, 34, i === 1 ? c2 : c1, 9);
    s += mt(x + 20, 502, 150, 9, 0.6) + mt(x + 20, 520, 110, 8);
  }
  return enc(FRAME(s, c1));
}

function shotDash(c1: string, c2: string): string {
  let s = rct(0, 46, 210, 554, "#101a27", 0);
  s += rct(22, 74, 30, 30, c1, 9) + mt(64, 84, 90, 10, 0.7);
  for (let i = 0; i < 6; i++) s += (i === 1 ? rct(16, 140 + i * 46, 178, 34, "rgba(57,217,154,0.14)", 9) : "") + mt(34, 152 + i * 46, 110, 9, i === 1 ? 0.8 : 0.3);
  s += mt(246, 80, 150, 13, 0.85);
  const kpis: [string, string][] = [[c1, "24%"], [c2, "8.2k"], ["#5cb8f2", "129"]];
  kpis.forEach(([c], i) => {
    const x = 246 + i * 232;
    s += rct(x, 112, 212, 96, "rgba(236,244,250,0.06)", 12);
    s += rct(x + 18, 132, 30, 30, c, 8) + ln(x + 18, 178, 70, 11) + mt(x + 120, 180, 60, 8);
  });
  s += rct(246, 232, 450, 210, "rgba(236,244,250,0.05)", 12);
  const hs = [60, 95, 70, 130, 105, 150, 88];
  hs.forEach((h, i) => s += rct(276 + i * 56, 400 - h, 32, h, i === 5 ? c1 : "rgba(148,175,200,0.35)", 5));
  s += rct(716, 232, 204, 210, "rgba(236,244,250,0.05)", 12);
  s += `<circle cx="818" cy="330" r="62" fill="none" stroke="rgba(148,175,200,0.25)" stroke-width="16"/><circle cx="818" cy="330" r="62" fill="none" stroke="${c2}" stroke-width="16" stroke-dasharray="260 400" stroke-linecap="round" transform="rotate(-90 818 330)"/>`;
  s += rct(246, 462, 674, 100, "rgba(236,244,250,0.05)", 12);
  for (let i = 0; i < 3; i++) { s += mt(270, 486 + i * 26, 130, 8, 0.5); s += mt(560, 486 + i * 26, 90, 8, 0.3); s += rct(820, 480 + i * 26, 70, 20, i === 0 ? "rgba(57,217,154,0.2)" : "rgba(148,175,200,0.14)", 10); }
  return enc(FRAME(s, c1));
}

function shotPos(c1: string, c2: string): string {
  let s = "";
  s += rct(30, 70, 380, 40, "#121d2b", 10) + mt(48, 86, 140, 9, 0.5);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++) {
      const x = 30 + c * 148, y = 130 + r * 132;
      s += rct(x, y, 134, 116, "rgba(236,244,250,0.06)", 11);
      s += rct(x + 14, y + 14, 106, 52, (r + c) % 3 === 0 ? c2 : "rgba(148,175,200,0.22)", 8);
      s += mt(x + 14, y + 78, 80, 8, 0.55) + ln(x + 14, y + 94, 44, 9);
    }
  s += rct(640, 70, 290, 470, "#121d2b", 14);
  s += ln(664, 96, 110, 11) + rct(860, 88, 46, 26, c1, 13);
  for (let i = 0; i < 5; i++) {
    const y = 140 + i * 52;
    s += rct(664, y, 30, 30, i % 2 ? c2 : "rgba(148,175,200,0.3)", 8);
    s += mt(706, y + 4, 110, 9, 0.55) + mt(706, y + 19, 60, 7);
    s += ln(872, y + 8, 36, 9);
  }
  s += mt(664, 412, 240, 2, 0.25) + mt(664, 430, 90, 9, 0.6) + ln(840, 428, 66, 12);
  s += rct(664, 468, 242, 48, c1, 12) + rct(750, 486, 70, 12, "#0c141f", 6);
  return enc(FRAME(s, c1));
}

function shotDoc(c1: string, c2: string): string {
  let s = "";
  s += rct(300, 90, 360, 440, "#121d2b", 16);
  s += rct(300, 90, 360, 130, c1, 16) + rct(300, 180, 360, 40, c1);
  s += `<text x="330" y="160" font-family="monospace" font-size="34" font-weight="700" fill="#0c141f">LIVO</text>`;
  s += ln(330, 260, 240, 16) + ln(330, 288, 180, 16, 0.5);
  for (let i = 0; i < 6; i++) s += mt(330, 340 + i * 22, i % 2 ? 230 : 270, 8, 0.4);
  s += rct(330, 480, 90, 26, c2, 13);
  s += `<circle cx="170" cy="180" r="70" fill="${c2}" opacity="0.2"/><circle cx="800" cy="430" r="90" fill="${c1}" opacity="0.14"/><circle cx="770" cy="150" r="8" fill="${c2}"/><circle cx="180" cy="430" r="10" fill="${c1}"/><circle cx="140" cy="470" r="5" fill="${c2}"/>`;
  return enc(FRAME(s, c1));
}

const shots = { site: shotSite, dash: shotDash, pos: shotPos, doc: shotDoc };
type ShotKind = keyof typeof shots;
const galleryOf = (kinds: ShotKind[], c1: string, c2: string) => kinds.map((k) => shots[k](c1, c2));

/* ------------------------------ shared meta ------------------------------ */

export const TYPE_META: Record<ProductType, { label: string; plural: string; icon: string }> = {
  website: { label: "Website", plural: "Websites", icon: "globe" },
  system: { label: "Business System", plural: "Systems", icon: "cpu" },
  saas: { label: "SaaS", plural: "SaaS", icon: "layers" },
  digital: { label: "Digital Product", plural: "Digital Products", icon: "package" },
  ebook: { label: "E-book", plural: "E-books", icon: "book" },
  other: { label: "Other", plural: "Other", icon: "box" },
};

/**
 * Compatibility rule — admin-controlled:
 * if the add-on has explicit product links, ONLY those products match.
 * Otherwise it falls back to product-type compatibility.
 */
export function isAddonCompatible(addon: Addon, product: Product): boolean {
  if (addon.productIds.length > 0) return addon.productIds.includes(product.id);
  return addon.compat.includes(product.type);
}

export const DEMO_ACCOUNTS = [
  { label: "Customer", email: "customer@livo.demo", password: "demo1234" },
  { label: "Admin", email: "admin@livo.demo", password: "demo1234" },
  { label: "Super Admin", email: "root@livo.demo", password: "demo1234" },
];

/* -------------------------------- helpers -------------------------------- */

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 864e5).toISOString();

const P = (p: Omit<Product, "createdAt" | "updatedAt" | "reviews"> & { reviews?: number }): Product => ({
  reviews: 0, createdAt: daysAgo(60), updatedAt: daysAgo(3), ...p,
});

/* --------------------------------- seed --------------------------------- */

export function seedState(): StoreState {
  /* categories */
  const categories = [
    { id: "c-web", slug: "websites", name: "Websites", description: "Production-ready sites tuned per industry — ordering, booking and delivery wired in.", active: true, order: 1 },
    { id: "c-sys", slug: "business-systems", name: "Business Systems", description: "POS, inventory and operations software that runs the back room.", active: true, order: 2 },
    { id: "c-saas", slug: "saas", name: "SaaS", description: "Hosted platforms with monthly plans, updates and support included.", active: true, order: 3 },
    { id: "c-dig", slug: "digital-products", name: "Digital Products", description: "UI kits, toolkits and resources delivered the moment you pay.", active: true, order: 4 },
    { id: "c-tpl", slug: "templates", name: "Templates", description: "Figma, Notion and code templates you can ship the same day.", active: true, order: 5 },
    { id: "c-ebk", slug: "ebooks", name: "E-books", description: "Playbooks and guides — buy once, every future edition free.", active: true, order: 6 },
    { id: "c-tool", slug: "tools", name: "Tools", description: "Calculators, planners and utilities that save you a weekend.", active: true, order: 7 },
  ];

  /* products */
  const products: Product[] = [
    P({
      id: "p1", slug: "novapharm-pharmacy-website", name: "NovaPharm — Pharmacy Website", type: "website", categoryId: "c-web",
      tagline: "A pharmacy storefront with prescriptions, delivery slots and a loyalty-ready checkout.",
      description: "NovaPharm is a complete pharmacy storefront: medicine catalog with dosage filters, prescription upload, delivery-slot booking and pharmacist-approved content blocks.\n\nEvery section is editable from a lightweight CMS. Orders land in a clean admin inbox, and the checkout supports coupons, flash deals and delivery zones out of the box.\n\nYou own the license forever — hosting on a free .livo.site subdomain is included, or point any custom domain at it.",
      image: shots.site("#3fe6a6", "#2bb3a3"), gallery: galleryOf(["site", "dash", "doc"], "#3fe6a6", "#2bb3a3"),
      price: 899, compareAt: 1199, billing: "once", rating: 4.8, reviews: 124, version: "2.4.1",
      features: ["Prescription upload flow", "Delivery-slot booking", "Medicine search with dosage filters", "Coupon & flash-deal ready", "Pharmacist content blocks", "Free .livo.site subdomain", "CMS for every section", "14-day refund window"],
      tags: ["pharmacy", "storefront", "delivery", "health"],
      faqs: [
        { q: "Do I get the source code?", a: "Yes — full source plus a perpetual license for one business. Multi-branch licensing is available via support." },
        { q: "Can it take online payments?", a: "The checkout is payment-provider agnostic. Card and wallet gateways (including Egyptian providers) plug in through one config file." },
        { q: "How fast can I launch?", a: "Swap in your catalog and branding and you can go live the same week. Deployment is handled by our team at no extra cost." },
      ],
      files: [], downloadable: false, active: true, featured: true,
    }),
    P({
      id: "p2", slug: "cravehouse-restaurant-website", name: "CraveHouse — Restaurant Website", type: "website", categoryId: "c-web",
      tagline: "Menus, table reservations and delivery orders in one hungry little site.",
      description: "CraveHouse turns your menu into an ordering machine: live menu with modifiers, table reservations with capacity rules, and delivery orders with zone pricing.\n\nThe kitchen gets a simple order board; you get daily summaries. Seasonal menus switch in one click, and the design follows your brand palette automatically.",
      image: shots.site("#ffb454", "#ff7a59"), gallery: galleryOf(["site", "pos", "doc"], "#ffb454", "#ff7a59"),
      price: 949, billing: "once", rating: 4.9, reviews: 98, version: "3.1.0",
      features: ["Live menu with modifiers", "Table reservation engine", "Delivery zone pricing", "Kitchen order board", "Seasonal menu switching", "Brand-palette theming"],
      tags: ["restaurant", "menu", "reservations", "delivery"],
      faqs: [
        { q: "Does it handle multiple branches?", a: "Yes — each branch gets its own menu, zones and reservation calendar under one admin." },
        { q: "Can customers pay at the counter?", a: "Orders support pay-on-pickup and pay-on-delivery alongside online payment." },
      ],
      files: [], downloadable: false, active: true, featured: true,
    }),
    P({
      id: "p3", slug: "brightsmile-dental-website", name: "BrightSmile — Dental Website", type: "website", categoryId: "c-web",
      tagline: "A calm, trust-first clinic site with an appointment engine patients actually use.",
      description: "BrightSmile pairs a reassuring design with a real appointment engine: doctor profiles, treatment pages with pricing bands, and bookings that respect each dentist's calendar.\n\nReminders go out automatically, and no-shows drop because the flow asks for commitment at the right moment.",
      image: shots.site("#5cb8f2", "#3fe6a6"), gallery: galleryOf(["site", "dash", "doc"], "#5cb8f2", "#3fe6a6"),
      price: 879, billing: "once", rating: 4.7, reviews: 61, version: "1.9.2",
      features: ["Multi-doctor calendars", "Treatment pricing bands", "Automated reminders", "Patient intake forms", "Before/after galleries"],
      tags: ["dental", "clinic", "booking", "health"],
      faqs: [{ q: "Can I list treatments without prices?", a: "Yes — pricing bands are optional per treatment, so you can show 'from' prices or hide them entirely." }],
      files: [], downloadable: false, active: true, featured: false,
    }),
    P({
      id: "p4", slug: "swiftpos", name: "SwiftPOS — Point of Sale", type: "system", categoryId: "c-sys",
      tagline: "A barcode-first register that works offline and reconciles every shift.",
      description: "SwiftPOS is built for counters that can't wait: barcode scanning, quick-tile layouts, split payments and shift reports that reconcile to the penny.\n\nIt keeps selling when the internet drops and syncs silently when it returns. Hardware-agnostic — runs on any tablet or desktop.",
      image: shots.pos("#3fe6a6", "#ffb454"), gallery: galleryOf(["pos", "dash", "site"], "#3fe6a6", "#ffb454"),
      price: 890, monthlyPrice: 89, yearlyPrice: 890, billing: "subscription", rating: 4.9, reviews: 210, version: "5.2.0",
      features: ["Offline-first checkout", "Barcode & quick-tile input", "Split payments & tips", "Shift reconciliation", "Receipt printer support", "Multi-branch rollups"],
      tags: ["pos", "retail", "offline", "register"],
      faqs: [
        { q: "What hardware do I need?", a: "Any tablet or desktop with a browser. USB barcode scanners and receipt printers work out of the box." },
        { q: "What happens to my data if I cancel?", a: "Export everything to CSV any time. Your data is yours — we just keep it safe while you subscribe." },
      ],
      files: [], downloadable: false, active: true, featured: true,
    }),
    P({
      id: "p5", slug: "stockpilot-inventory", name: "StockPilot — Inventory System", type: "system", categoryId: "c-sys",
      tagline: "Reorder points, batch expiry and movement logs across every location.",
      description: "StockPilot watches your stock so you don't have to: reorder points that alert before the shelf empties, batch and expiry tracking for perishables, and movement logs that answer 'where did it go?'.\n\nDashboards roll up across branches; purchase orders generate from low-stock alerts in one click.",
      image: shots.dash("#38d6e0", "#3fe6a6"), gallery: galleryOf(["dash", "pos", "site"], "#38d6e0", "#3fe6a6"),
      price: 690, monthlyPrice: 69, yearlyPrice: 690, billing: "subscription", rating: 4.7, reviews: 143, version: "4.0.3",
      features: ["Reorder-point alerts", "Batch & expiry tracking", "Movement audit logs", "Multi-location rollups", "One-click purchase orders", "CSV/Excel import"],
      tags: ["inventory", "stock", "warehouse", "alerts"],
      faqs: [{ q: "Can I import from spreadsheets?", a: "Yes — a guided importer maps your columns once and remembers the mapping for next time." }],
      files: [], downloadable: false, active: true, featured: true,
    }),
    P({
      id: "p6", slug: "livocart-storefront", name: "LivoCart — Storefront Builder", type: "saas", categoryId: "c-saas",
      tagline: "Launch a branded online store in an afternoon — no code, no plugins roulette.",
      description: "LivoCart is a hosted storefront builder: drag sections, set shipping zones, connect a payment provider and sell the same day.\n\nAbandoned-cart reports, coupons and flash deals are native — not plugins. Every plan includes SSL, CDN and automatic backups.",
      image: shots.site("#ff7a59", "#ffb454"), gallery: galleryOf(["site", "dash", "doc"], "#ff7a59", "#ffb454"),
      price: 390, monthlyPrice: 39, yearlyPrice: 390, billing: "subscription", rating: 4.6, reviews: 187, version: "6.1.4",
      features: ["Drag-and-drop sections", "Shipping zone rules", "Native coupons & flash deals", "Abandoned-cart reports", "SSL + CDN included", "Automatic backups"],
      tags: ["ecommerce", "storefront", "saas", "builder"],
      faqs: [{ q: "Is there a transaction fee?", a: "No extra fee beyond your payment provider's. Flat monthly pricing, unlimited orders." }],
      files: [], downloadable: false, active: true, featured: false,
    }),
    P({
      id: "p7", slug: "pulseboard-analytics", name: "PulseBoard — Analytics SaaS", type: "saas", categoryId: "c-saas",
      tagline: "One calm dashboard for sales, stock and staff — the numbers that matter daily.",
      description: "PulseBoard pulls your daily numbers into one calm dashboard: sales by hour, stock health, staff performance and cash position.\n\nIt's built for owners who check numbers on their phone with a coffee, not analysts who live in spreadsheets.",
      image: shots.dash("#5cb8f2", "#ff7a59"), gallery: galleryOf(["dash", "site", "doc"], "#5cb8f2", "#ff7a59"),
      price: 290, monthlyPrice: 29, yearlyPrice: 290, billing: "subscription", rating: 4.5, reviews: 76, version: "2.3.0",
      features: ["Daily owner digest", "Sales by hour/branch", "Stock health scores", "Staff performance boards", "Mobile-first dashboards"],
      tags: ["analytics", "dashboard", "reports", "saas"],
      faqs: [], files: [], downloadable: false, active: true, featured: false,
    }),
    P({
      id: "p8", slug: "momentum-ui-kit", name: "Momentum UI Kit", type: "digital", categoryId: "c-tpl",
      tagline: "240 production screens for dashboards and storefronts — Figma, fully tokenized.",
      description: "Momentum is a tokenized Figma UI kit: 240 screens covering dashboards, storefronts, onboarding and settings patterns.\n\nEvery component uses variables for color, radius and spacing — retheme the whole kit in minutes. Includes a dark and a light foundation.",
      image: shots.doc("#ffb454", "#ff7a59"), gallery: galleryOf(["doc", "dash", "site"], "#ffb454", "#ff7a59"),
      price: 49, compareAt: 69, billing: "once", rating: 4.8, reviews: 312, version: "3.0.0",
      features: ["240 screens", "Full design-token system", "Dark + light foundations", "Auto-layout everywhere", "Commercial license", "Free lifetime updates"],
      tags: ["figma", "ui-kit", "design", "tokens"],
      faqs: [
        { q: "Does it work with older Figma files?", a: "The kit uses modern variables — Figma from 2023 onward handles it natively." },
        { q: "Can I use it in client work?", a: "Yes — the commercial license covers unlimited client projects. Reselling the kit itself is not allowed." },
      ],
      files: [
        { id: "f8a", name: "momentum-ui-kit-v3.fig", size: "48.2 MB", type: "Figma", version: "3.0.0" },
        { id: "f8b", name: "momentum-tokens.json", size: "112 KB", type: "JSON", version: "3.0.0" },
        { id: "f8c", name: "momentum-license.pdf", size: "180 KB", type: "PDF", version: "3.0.0" },
      ],
      downloadNote: "Open the .fig file in Figma, then enable the Momentum library under Assets → Libraries. Tokens import via the Variables panel — the included JSON maps 1:1.",
      downloadable: true, active: true, featured: true,
    }),
    P({
      id: "p9", slug: "local-launch-playbook", name: "The Local Launch Playbook", type: "ebook", categoryId: "c-ebk",
      tagline: "A 120-page playbook for taking a local business online in 30 days.",
      description: "Written from 40+ real launches: what to sell online first, how to price delivery, which photos convert, and the exact 30-day checklist we run for every client.\n\nePub + PDF + print-ready. Buy once, every future edition lands in your downloads free.",
      image: shots.doc("#3fe6a6", "#5cb8f2"), gallery: galleryOf(["doc", "site", "dash"], "#3fe6a6", "#5cb8f2"),
      price: 19, billing: "once", rating: 4.9, reviews: 428, version: "2.1.0",
      features: ["120 pages, zero fluff", "30-day launch checklist", "Pricing & delivery worksheets", "ePub + PDF + print-ready", "Free future editions"],
      tags: ["ebook", "playbook", "launch", "small-business"],
      faqs: [{ q: "What format is it?", a: "ePub, PDF and a print-ready PDF — all three in one download." }],
      files: [
        { id: "f9a", name: "local-launch-playbook.epub", size: "6.4 MB", type: "ePub", version: "2.1.0" },
        { id: "f9b", name: "local-launch-playbook.pdf", size: "11.8 MB", type: "PDF", version: "2.1.0" },
        { id: "f9c", name: "launch-checklist-30d.pdf", size: "420 KB", type: "PDF", version: "2.1.0" },
      ],
      downloadNote: "Start with the 30-day checklist — it references the chapters you need each week. The ePub is reflowable and works on any e-reader.",
      downloadable: true, active: true, featured: false,
    }),
    P({
      id: "p10", slug: "ledgerlite-finance-template", name: "LedgerLite — Finance Template", type: "digital", categoryId: "c-tool",
      tagline: "A Notion finance OS: cash flow, invoices and a runway calculator in one page.",
      description: "LedgerLite is a Notion template that keeps small-business money honest: cash-flow view, invoice tracker with reminders, and a runway calculator that updates itself.\n\nDuplicate it into your workspace and start entering today's numbers — the dashboards build themselves.",
      image: shots.dash("#5cb8f2", "#3fe6a6"), gallery: galleryOf(["dash", "doc", "site"], "#5cb8f2", "#3fe6a6"),
      price: 29, billing: "once", rating: 4.6, reviews: 154, version: "1.4.0",
      features: ["Cash-flow dashboard", "Invoice tracker + reminders", "Runway calculator", "Duplicate-and-go setup", "Video walkthrough included"],
      tags: ["notion", "finance", "template", "cashflow"],
      faqs: [{ q: "Do I need Notion Pro?", a: "No — the free Notion plan runs everything in the template." }],
      files: [
        { id: "f10a", name: "ledgerlite-template.link", size: "2 KB", type: "Notion link", version: "1.4.0" },
        { id: "f10b", name: "ledgerlite-walkthrough.mp4", size: "84.5 MB", type: "Video", version: "1.4.0" },
      ],
      downloadNote: "Open the .link file and click 'Duplicate' — the template copies into your Notion workspace. Watch the 6-minute walkthrough before entering data.",
      downloadable: true, active: true, featured: false,
    }),
  ];

  /* add-ons — linked to exact products (admin-managed) */
  const addons: Addon[] = [
    { id: "a1", slug: "loyalty-points", name: "Loyalty Points", description: "Customers earn points on every order and redeem them at checkout.", price: 9, interval: "monthly", icon: "star", active: true, features: ["Points per currency", "Redemption at checkout", "Birthday bonuses"], compat: ["website", "system"], productIds: ["p1", "p2", "p4"] },
    { id: "a2", slug: "coupons", name: "Coupons", description: "Percentage and fixed coupons with windows, caps and per-customer limits.", price: 6, interval: "monthly", icon: "tag", active: true, features: ["Percent & fixed", "Usage windows", "Per-customer caps"], compat: ["website", "saas"], productIds: ["p1", "p2", "p6"] },
    { id: "a3", slug: "flash-deals", name: "Flash Deals", description: "Time-boxed deals with countdown timers and stock limits.", price: 8, interval: "monthly", icon: "bolt", active: true, features: ["Countdown timers", "Stock limits", "Schedule ahead"], compat: ["website", "saas"], productIds: ["p2", "p6"] },
    { id: "a4", slug: "vip-customers", name: "VIP Customers", description: "Tiered VIP lists with private pricing and early access.", price: 12, interval: "monthly", icon: "crown", active: true, features: ["Auto tier upgrades", "Private price lists", "Early-access windows"], compat: ["website"], productIds: ["p1", "p3"] },
    { id: "a5", slug: "delivery", name: "Delivery", description: "Delivery zones, fees, slots and driver assignment.", price: 15, interval: "monthly", icon: "truck", active: true, features: ["Zone pricing", "Time slots", "Driver board"], compat: ["website"], productIds: ["p1", "p2"] },
    { id: "a6", slug: "doctors", name: "Doctors", description: "Multi-doctor profiles with individual calendars and bios.", price: 14, interval: "monthly", icon: "users", active: true, features: ["Per-doctor calendars", "Specialty pages", "Rating display"], compat: ["website"], productIds: ["p3"] },
    { id: "a7", slug: "product-reviews", name: "Product Reviews", description: "Verified-purchase reviews with photos and moderation.", price: 6, interval: "monthly", icon: "chat", active: true, features: ["Verified badges", "Photo reviews", "Moderation queue"], compat: ["website", "saas", "digital"], productIds: ["p1", "p2", "p6", "p8"] },
    { id: "a8", slug: "staff-permissions", name: "Advanced Staff Permissions", description: "Role-based access down to the individual screen.", price: 10, interval: "monthly", icon: "shield", active: true, features: ["Screen-level control", "Audit trail", "Shift-scoped access"], compat: ["system"], productIds: ["p4", "p5"] },
    { id: "a9", slug: "abandoned-cart", name: "Abandoned Cart Reports", description: "See who left, what they left, and recover it automatically.", price: 7, interval: "monthly", icon: "chart", active: true, features: ["Recovery emails", "Exit-intent capture", "Lost-revenue report"], compat: ["saas"], productIds: ["p6"] },
    { id: "a10", slug: "homepage-banners", name: "Homepage Banners", description: "Rotating promo banners with scheduling and A/B slots.", price: 5, interval: "monthly", icon: "wand", active: true, features: ["Scheduling", "A/B slots", "Mobile variants"], compat: ["website"], productIds: ["p1", "p2", "p3"] },
    { id: "a11", slug: "push-notifications", name: "Push Notifications", description: "Web push for order updates, restocks and offers.", price: 8, interval: "monthly", icon: "bell", active: true, features: ["Order updates", "Restock alerts", "Segmented sends"], compat: ["website", "saas", "system"], productIds: ["p1", "p2", "p4", "p6"] },
    { id: "a12", slug: "wishlist", name: "Wishlist", description: "Saved-for-later lists with price-drop alerts.", price: 6, interval: "monthly", icon: "spark", active: true, features: ["Price-drop alerts", "Share lists", "Back-in-stock pings"], compat: ["website", "saas", "digital"], productIds: ["p2", "p6", "p8"] },
    { id: "a13", slug: "popup-ads", name: "Popup Ads", description: "Tasteful, timed popups with smart exit rules.", price: 5, interval: "monthly", icon: "tag", active: true, features: ["Exit-intent timing", "Frequency capping", "Coupon handoff"], compat: ["website"], productIds: ["p1", "p2"] },
  ];

  /* users */
  const users = [
    { id: "u-root", name: "Rania Mostafa", email: "root@livo.demo", password: "demo1234", role: "superadmin" as const, status: "active" as const, company: "LivoTech", createdAt: daysAgo(400) },
    { id: "u-admin", name: "Karim Fathy", email: "admin@livo.demo", password: "demo1234", role: "admin" as const, status: "active" as const, company: "LivoTech", createdAt: daysAgo(300) },
    { id: "u-c1", name: "Salma Adel", email: "customer@livo.demo", password: "demo1234", role: "customer" as const, status: "active" as const, company: "Adel Pharma", createdAt: daysAgo(90) },
    { id: "u-c2", name: "Omar Sherif", email: "omar@cravehouse.demo", password: "demo1234", role: "customer" as const, status: "active" as const, company: "CraveHouse", createdAt: daysAgo(60) },
    { id: "u-c3", name: "Lina Haddad", email: "lina@studiolh.demo", password: "demo1234", role: "customer" as const, status: "active" as const, company: "Studio LH", createdAt: daysAgo(45) },
    { id: "u-c4", name: "Youssef Kamal", email: "youssef@demo.mail", password: "demo1234", role: "customer" as const, status: "suspended" as const, createdAt: daysAgo(30) },
  ];

  /* orders — spread across 8 weeks for the revenue chart */
  const orders = [
    { id: "o9", number: "LVO-1042", customerId: "u-c2", items: [{ productId: "p5", name: "StockPilot — Inventory System", type: "system", qty: 1, unitPrice: 69, interval: "monthly" as const, total: 69 }], subtotal: 69, discount: 0, total: 69, currency: "USD", status: "completed" as const, paymentStatus: "paid" as const, paymentMethod: "Card", createdAt: daysAgo(2) },
    { id: "o8", number: "LVO-1041", customerId: "u-c1", items: [{ productId: "a1", name: "Loyalty Points · NovaPharm — Pharmacy Website", type: "addon", qty: 1, unitPrice: 9, interval: "monthly" as const, total: 9 }], subtotal: 9, discount: 0, total: 9, currency: "USD", status: "completed" as const, paymentStatus: "paid" as const, paymentMethod: "Wallet", createdAt: daysAgo(5) },
    { id: "o7", number: "LVO-1040", customerId: "u-c3", items: [{ productId: "p8", name: "Momentum UI Kit", type: "digital", qty: 1, unitPrice: 49, interval: "once" as const, total: 49 }], subtotal: 49, discount: 0, total: 49, currency: "USD", status: "completed" as const, paymentStatus: "paid" as const, paymentMethod: "Card", createdAt: daysAgo(9) },
    { id: "o6", number: "LVO-1039", customerId: "u-c1", items: [{ productId: "p4", name: "SwiftPOS — Point of Sale", type: "system", qty: 1, unitPrice: 89, interval: "monthly" as const, total: 89 }], subtotal: 89, discount: 0, total: 89, currency: "USD", status: "completed" as const, paymentStatus: "paid" as const, paymentMethod: "Card", createdAt: daysAgo(13) },
    { id: "o5", number: "LVO-1038", customerId: "u-c2", items: [{ productId: "p2", name: "CraveHouse — Restaurant Website", type: "website", qty: 1, unitPrice: 949, interval: "once" as const, total: 949 }, { productId: "a5", name: "Delivery · CraveHouse — Restaurant Website", type: "addon", qty: 1, unitPrice: 15, interval: "monthly" as const, total: 15 }], subtotal: 964, discount: 0, total: 964, currency: "USD", status: "completed" as const, paymentStatus: "paid" as const, paymentMethod: "Card", createdAt: daysAgo(20) },
    { id: "o4", number: "LVO-1037", customerId: "u-c4", items: [{ productId: "p10", name: "LedgerLite — Finance Template", type: "digital", qty: 1, unitPrice: 29, interval: "once" as const, total: 29 }], subtotal: 29, discount: 0, total: 29, currency: "USD", status: "pending" as const, paymentStatus: "failed" as const, paymentMethod: "Card", createdAt: daysAgo(27) },
    { id: "o3", number: "LVO-1036", customerId: "u-c1", items: [{ productId: "p1", name: "NovaPharm — Pharmacy Website", type: "website", qty: 1, unitPrice: 899, interval: "once" as const, total: 899 }], subtotal: 899, discount: 89.9, couponCode: "WELCOME10", total: 809.1, currency: "USD", status: "completed" as const, paymentStatus: "paid" as const, paymentMethod: "Card", createdAt: daysAgo(34) },
    { id: "o2", number: "LVO-1035", customerId: "u-c3", items: [{ productId: "p9", name: "The Local Launch Playbook", type: "ebook", qty: 1, unitPrice: 19, interval: "once" as const, total: 19 }], subtotal: 19, discount: 0, total: 19, currency: "USD", status: "completed" as const, paymentStatus: "paid" as const, paymentMethod: "Wallet", createdAt: daysAgo(41) },
    { id: "o1", number: "LVO-1034", customerId: "u-c2", items: [{ productId: "p6", name: "LivoCart — Storefront Builder", type: "saas", qty: 1, unitPrice: 39, interval: "monthly" as const, total: 39 }], subtotal: 39, discount: 0, total: 39, currency: "USD", status: "completed" as const, paymentStatus: "paid" as const, paymentMethod: "Card", createdAt: daysAgo(48) },
  ];

  /* ownership, subs, addon attachments, websites */
  const ownerships = [
    { id: "own1", customerId: "u-c1", productId: "p1", orderId: "o3", status: "active" as const, purchasedAt: daysAgo(34), activatedAt: daysAgo(34) },
    { id: "own2", customerId: "u-c1", productId: "p4", orderId: "o6", status: "active" as const, purchasedAt: daysAgo(13), activatedAt: daysAgo(13), subscriptionId: "sub1", expiresAt: daysFromNow(17) },
    { id: "own3", customerId: "u-c2", productId: "p2", orderId: "o5", status: "active" as const, purchasedAt: daysAgo(20), activatedAt: daysAgo(20) },
    { id: "own4", customerId: "u-c2", productId: "p6", orderId: "o1", status: "active" as const, purchasedAt: daysAgo(48), activatedAt: daysAgo(48), subscriptionId: "sub3", expiresAt: daysFromNow(12) },
    { id: "own5", customerId: "u-c2", productId: "p5", orderId: "o9", status: "active" as const, purchasedAt: daysAgo(2), activatedAt: daysAgo(2), subscriptionId: "sub2", expiresAt: daysAgo(3) },
    { id: "own6", customerId: "u-c3", productId: "p8", orderId: "o7", status: "active" as const, purchasedAt: daysAgo(9), activatedAt: daysAgo(9) },
    { id: "own7", customerId: "u-c3", productId: "p9", orderId: "o2", status: "active" as const, purchasedAt: daysAgo(41), activatedAt: daysAgo(41) },
  ];

  const subscriptions = [
    { id: "sub1", customerId: "u-c1", productId: "p4", orderId: "o6", plan: "SwiftPOS — Point of Sale Monthly", price: 89, interval: "monthly" as const, status: "active" as const, startDate: daysAgo(13), nextBillingAt: daysFromNow(17) },
    { id: "sub2", customerId: "u-c2", productId: "p5", orderId: "o9", plan: "StockPilot — Inventory System Monthly", price: 69, interval: "monthly" as const, status: "past_due" as const, startDate: daysAgo(33), nextBillingAt: daysAgo(3) },
    { id: "sub3", customerId: "u-c2", productId: "p6", orderId: "o1", plan: "LivoCart — Storefront Builder Monthly", price: 39, interval: "monthly" as const, status: "active" as const, startDate: daysAgo(48), nextBillingAt: daysFromNow(12) },
    { id: "sub4", customerId: "u-c1", productId: "a1", orderId: "o8", plan: "Loyalty Points", price: 9, interval: "monthly" as const, status: "active" as const, startDate: daysAgo(5), nextBillingAt: daysFromNow(25) },
    { id: "sub5", customerId: "u-c2", productId: "a5", orderId: "o5", plan: "Delivery", price: 15, interval: "monthly" as const, status: "active" as const, startDate: daysAgo(20), nextBillingAt: daysFromNow(10) },
  ];

  const customerAddons = [
    { id: "ca1", customerId: "u-c1", addonId: "a1", attachedProductId: "p1", attachedProductName: "NovaPharm — Pharmacy Website", orderId: "o8", interval: "monthly" as const, price: 9, status: "active" as const, startedAt: daysAgo(5), renewsAt: daysFromNow(25) },
    { id: "ca2", customerId: "u-c2", addonId: "a5", attachedProductId: "p2", attachedProductName: "CraveHouse — Restaurant Website", orderId: "o5", interval: "monthly" as const, price: 15, status: "active" as const, startedAt: daysAgo(20), renewsAt: daysFromNow(10) },
  ];

  const websites = [
    { id: "w1", name: "CraveHouse — Omar Sherif", productId: "p2", customerId: "u-c2", domain: "cravehouse.livo.site", url: "https://cravehouse.livo.site", plan: "Owned license", status: "active" as const, createdAt: daysAgo(20) },
    { id: "w2", name: "NovaPharm — Adel Pharma", productId: "p1", customerId: "u-c1", domain: "novapharm-salma.livo.site", url: "https://novapharm-salma.livo.site", plan: "Owned license", status: "pending" as const, createdAt: daysAgo(34) },
  ];

  const downloads = [
    { id: "d1", userId: "u-c3", productId: "p8", fileId: "f8a", fileName: "momentum-ui-kit-v3.fig", at: daysAgo(9) },
    { id: "d2", userId: "u-c3", productId: "p8", fileId: "f8b", fileName: "momentum-tokens.json", at: daysAgo(9) },
    { id: "d3", userId: "u-c3", productId: "p9", fileId: "f9a", fileName: "local-launch-playbook.epub", at: daysAgo(40) },
    { id: "d4", userId: "u-c3", productId: "p8", fileId: "f8c", fileName: "momentum-license.pdf", at: daysAgo(8) },
  ];

  const tickets = [
    {
      id: "t1", number: "TKT-1045", customerId: "u-c1", subject: "Connecting my own domain to NovaPharm", category: "Websites", priority: "normal" as const, status: "open" as const, createdAt: daysAgo(1),
      messages: [
        { id: "m1", author: "customer" as const, authorName: "Salma Adel", body: "Hi! I bought the pharmacy website last month — how do I point adelpharma.com at it? I have the DNS access.", at: daysAgo(1) },
        { id: "m2", author: "support" as const, authorName: "Karim Fathy", body: "Hey Salma — add an A record to 185.199.108.153 and a CNAME for www. Propagation takes up to an hour. I'll watch it on our side.", at: daysAgo(0.8) },
      ],
    },
    {
      id: "t2", number: "TKT-1044", customerId: "u-c2", subject: "StockPilot past due — card was updated", category: "Billing", priority: "high" as const, status: "waiting" as const, createdAt: daysAgo(3),
      messages: [
        { id: "m3", author: "customer" as const, authorName: "Omar Sherif", body: "My card failed on the 12th and StockPilot shows past due. I've updated the card — can you retry the charge?", at: daysAgo(3) },
        { id: "m4", author: "support" as const, authorName: "Rania Mostafa", body: "Retried and queued — the charge should clear within a few hours. You'll get a notification the moment it does.", at: daysAgo(2.6) },
      ],
    },
    {
      id: "t3", number: "TKT-1043", customerId: "u-c3", subject: "Invoice for order LVO-1040?", category: "Billing", priority: "low" as const, status: "resolved" as const, createdAt: daysAgo(7),
      messages: [
        { id: "m5", author: "customer" as const, authorName: "Lina Haddad", body: "Can I get a proper invoice for the Momentum kit? My accountant needs it.", at: daysAgo(7) },
        { id: "m6", author: "support" as const, authorName: "Karim Fathy", body: "Done — it's under Dashboard → Billing → Invoice next to the order. Let us know if you need a company name on it.", at: daysAgo(6.8) },
      ],
    },
  ];

  const notifications = [
    { id: "n1", userId: "u-c1", title: "Loyalty Points is live", body: "The add-on was attached to NovaPharm and activated.", kind: "purchase" as const, read: false, href: "/dashboard/addons", at: daysAgo(5) },
    { id: "n2", userId: "u-c1", title: "Renewal upcoming", body: "SwiftPOS renews in 17 days — $89.", kind: "renewal" as const, read: false, href: "/dashboard/subscriptions", at: daysAgo(1) },
    { id: "n3", userId: "u-c1", title: "NovaPharm v2.4.1", body: "Faster prescription search and a new delivery-slot picker.", kind: "update" as const, read: true, href: "/dashboard/products", at: daysAgo(10) },
    { id: "n4", userId: "u-c3", title: "Files unlocked", body: "3 files for Momentum UI Kit are ready in your downloads.", kind: "download" as const, read: false, href: "/dashboard/downloads", at: daysAgo(9) },
    { id: "n5", userId: "admin", title: "New order LVO-1042", body: "Omar Sherif purchased StockPilot — $69/mo.", kind: "purchase" as const, read: false, href: "/admin/orders", at: daysAgo(2) },
    { id: "n6", userId: "admin", title: "Payment failed LVO-1037", body: "Youssef Kamal — card declined. No ownership was activated.", kind: "payment" as const, read: false, href: "/admin/payments", at: daysAgo(27) },
    { id: "n7", userId: "admin", title: "New ticket TKT-1045", body: "Salma Adel: Connecting my own domain to NovaPharm", kind: "support" as const, read: false, href: "/admin/support", at: daysAgo(1) },
    { id: "n8", userId: "admin", title: "Subscription past due", body: "Omar Sherif — StockPilot Monthly.", kind: "system" as const, read: true, href: "/admin/subscriptions", at: daysAgo(3) },
  ];

  const audit = [
    { id: "au1", actorId: "u-root", actorName: "Rania Mostafa", action: "product.update", resource: "product", resourceId: "p8", meta: "Momentum UI Kit — price 69 → 49", at: daysAgo(12) },
    { id: "au2", actorId: "u-admin", actorName: "Karim Fathy", action: "addon.save", resource: "addon", resourceId: "a8", meta: "Advanced Staff Permissions — linked to 2 product(s)", at: daysAgo(9) },
    { id: "au3", actorId: "u-root", actorName: "Rania Mostafa", action: "customer.suspend", resource: "user", resourceId: "u-c4", meta: "Youssef Kamal", at: daysAgo(26) },
    { id: "au4", actorId: "u-root", actorName: "Rania Mostafa", action: "staff.invite", resource: "user", resourceId: "u-admin", meta: "Karim Fathy — admin", at: daysAgo(300) },
    { id: "au5", actorId: "u-admin", actorName: "Karim Fathy", action: "order.status", resource: "order", resourceId: "o5", meta: "→ completed", at: daysAgo(19) },
    { id: "au6", actorId: "u-root", actorName: "Rania Mostafa", action: "settings.update", resource: "settings", resourceId: "platform", meta: "LivoTech", at: daysAgo(15) },
  ];

  const coupons = [
    { code: "WELCOME10", kind: "percent" as const, value: 10, minOrder: 50, maxDiscount: 100, startsAt: daysAgo(90), expiresAt: daysFromNow(365), usageLimit: 100, used: 1, perCustomer: 1, active: true },
    { code: "RAMADAN25", kind: "fixed" as const, value: 25, minOrder: 200, startsAt: daysAgo(30), expiresAt: daysFromNow(20), usageLimit: 50, used: 3, perCustomer: 1, active: true },
    { code: "FLASH50", kind: "percent" as const, value: 50, minOrder: 500, maxDiscount: 200, startsAt: daysAgo(2), expiresAt: daysFromNow(5), usageLimit: 20, used: 0, perCustomer: 1, active: true },
    { code: "OLDCODE", kind: "percent" as const, value: 15, minOrder: 0, startsAt: daysAgo(400), expiresAt: daysAgo(30), usageLimit: 100, used: 84, perCustomer: 2, active: false },
  ];

  const contacts = [
    { id: "ct1", name: "Hany Mansour", email: "hany@opticsplus.demo", subject: "POS + inventory bundle for 3 branches?", body: "We run three optics shops. Can SwiftPOS and StockPilot share one product catalog across branches, and what would a bundle look like?", at: daysAgo(2) },
    { id: "ct2", name: "Dina Farouk", email: "dina@bloomcafe.demo", subject: "Restaurant website with a brunch pre-order", body: "Love CraveHouse. We need weekend brunch pre-orders with time slots — is that the reservation engine or a custom job?", at: daysAgo(6) },
  ];

  const rolePerms: StoreState["rolePerms"] = {
    customer: [],
    admin: ["products", "categories", "addons", "orders", "subscriptions", "payments", "customers", "support", "content", "downloads", "coupons", "websites", "notifications", "audit"],
    superadmin: ["products", "categories", "addons", "orders", "subscriptions", "payments", "customers", "support", "content", "downloads", "coupons", "websites", "notifications", "staff", "roles", "settings", "audit"],
  };

  return {
    v: SEED_V,
    sessionUserId: null,
    users, rolePerms, categories, products, addons,
    ownerships, customerAddons, websites,
    orders, subscriptions, downloads, tickets, notifications, audit, coupons,
    settings: {
      brand: "LivoTech", tagline: "Digital products, tools & solutions.",
      announcement: "Momentum UI Kit v3 is live · add-ons from $5/mo · use WELCOME10 for 10% off your first order.",
      currency: "USD", contactEmail: "hello@livotech.io", supportEmail: "support@livotech.io",
      twitter: "@livotech", github: "livotech", linkedin: "company/livotech",
      maintenance: false,
    },
    contacts,
    cart: null,
  };
}
