import { Link } from "react-router-dom";
import type { Addon, Product } from "../lib/types";
import { TYPE_META } from "../lib/seed";
import { I } from "./icons";
import { Badge, money } from "./ui";
import { Reveal } from "../lib/motion";

/* ------------------------------- type badge ------------------------------- */

export function TypeBadge({ type, className = "" }: { type: Product["type"]; className?: string }) {
  const m = TYPE_META[type];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-mist-100/12 bg-ink-900/95 px-2 py-1 text-[11px] font-semibold tracking-wide text-mist-300 ${className}`}>
      <I name={m.icon} size={12.5} className="text-pulse-400" />
      {m.label}
    </span>
  );
}

export function Stars({ rating, reviews, size = 13 }: { rating: number; reviews?: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${rating} out of 5`}>
      <span className="relative inline-flex">
        <span className="flex gap-0.5 text-mist-100/15">
          {[...Array(5)].map((_, i) => <I key={i} name="star" size={size} className="fill-current" strokeWidth={0} />)}
        </span>
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <span className="flex gap-0.5 text-solar-400">
            {[...Array(5)].map((_, i) => <I key={i} name="star" size={size} className="fill-current" strokeWidth={0} />)}
          </span>
        </span>
      </span>
      <span className="num text-xs text-mist-300">{rating.toFixed(1)}</span>
      {reviews !== undefined && <span className="text-xs text-mist-500">({reviews})</span>}
    </span>
  );
}

/* ------------------------------- price tag ------------------------------- */

export function PriceTag({ product, size = "md" }: { product: Product; size?: "md" | "lg" }) {
  const recurring = product.billing === "subscription";
  const price = recurring ? product.monthlyPrice ?? product.price : product.price;
  const big = size === "lg";
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {product.compareAt && (
        <span className={`num text-mist-500 line-through ${big ? "text-lg" : "text-[13px]"}`}>{money(product.compareAt, product.currency)}</span>
      )}
      <span className={`num font-bold text-mist-100 ${big ? "text-4xl" : "text-xl"}`}>{money(price, product.currency)}</span>
      {recurring && <span className="text-[13px] font-medium text-mist-400">/month</span>}
      {product.compareAt && (
        <Badge tone="solar" className="translate-y-[-1px]">−{Math.round((1 - price / product.compareAt) * 100)}%</Badge>
      )}
    </div>
  );
}

/* ------------------------------- product card ------------------------------- */

export function ProductCard({ product, index = 0, badge }: { product: Product; index?: number; badge?: string }) {
  const isNew = Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 30;
  return (
    <Reveal delay={Math.min(index * 0.06, 0.3)} className="h-full">
      <Link
        to={`/products/${product.slug}`}
        className="group card card-hover sheen relative flex h-full flex-col overflow-hidden"
      >
        <div className="relative aspect-[3/2] overflow-hidden border-b border-mist-100/8">
          <img
            src={product.image} alt={`${product.name} preview`} loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent opacity-60" />
          {/* quick-view overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/0 opacity-0 transition-all duration-300 group-hover:bg-ink-950/35 group-hover:opacity-100">
            <span className="translate-y-2 rounded-full bg-ink-900/95 px-4 py-2 text-[12.5px] font-semibold text-mist-100 shadow-lg transition-transform duration-300 group-hover:translate-y-0">
              <I name="eye" size={13} className="mr-1.5 inline -translate-y-px" /> معاينة سريعة
            </span>
          </div>
          <div className="absolute left-3 top-3 flex gap-1.5">
            {badge && <Badge tone="pulse">{badge}</Badge>}
            {isNew && <Badge tone="wave">جديد</Badge>}
            {product.featured && <Badge tone="solar">Featured</Badge>}
            {product.downloadable && <Badge tone="wave">Instant download</Badge>}
          </div>
          <div className="absolute bottom-3 left-3"><TypeBadge type={product.type} /></div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-[17px] font-semibold tracking-tight text-mist-100 transition-colors group-hover:text-pulse-300">
              {product.name}
            </h3>
            <Stars rating={product.rating} size={11.5} />
          </div>
          <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-mist-400">{product.tagline}</p>
          <div className="mt-auto flex items-center justify-between pt-5">
            <PriceTag product={product} />
            <span className="grid size-9 place-items-center rounded-full border border-mist-100/15 text-mist-400 transition-all duration-300 group-hover:border-pulse-400/60 group-hover:bg-pulse-400 group-hover:text-ink-950 group-hover:translate-x-0.5">
              <I name="arrowR" size={16} />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

/* -------------------------------- addon card -------------------------------- */

export function AddonCard({ addon, selected, onSelect }: { addon: Addon; selected?: boolean; onSelect?: (id: string) => void }) {
  const selectable = !!onSelect;
  const Comp = selectable ? "button" : "div";
  return (
    <Comp
      {...(selectable ? { type: "button" as const, onClick: () => onSelect!(addon.id), "aria-pressed": selected } : {})}
      className={`card card-hover relative flex h-full w-full flex-col p-5 text-left transition-all ${selected ? "!border-pulse-400/60 bg-pulse-400/[0.06]" : ""}`}
    >
      {selectable && (
        <span className={`absolute right-4 top-4 grid size-6 place-items-center rounded-full border transition-all ${selected ? "border-pulse-400 bg-pulse-400 text-ink-950" : "border-mist-100/25 text-transparent"}`}>
          <I name="check" size={13} strokeWidth={2.4} />
        </span>
      )}
      <span className={`mb-4 grid size-11 place-items-center rounded-xl border ${selected ? "border-pulse-400/40 bg-pulse-400/12 text-pulse-300" : "border-mist-100/12 bg-ink-800 text-solar-300"}`}>
        <I name={addon.icon} size={20} strokeWidth={1.6} />
      </span>
      <h3 className="font-display text-[15.5px] font-semibold tracking-tight text-mist-100">{addon.name}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-mist-400">{addon.description}</p>
      <ul className="mt-3.5 space-y-1.5">
        {addon.features.slice(0, 3).map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-mist-300">
            <I name="check" size={11} className="shrink-0 text-pulse-400" strokeWidth={2.4} />{f}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="num text-[15px] font-bold text-mist-100">
          {money(addon.price)}<span className="text-xs font-medium text-mist-500">{addon.interval === "monthly" ? " /mo" : " once"}</span>
        </span>
        <span className="text-[11px] font-medium text-mist-500">
          {addon.productIds.length > 0 ? `${addon.productIds.length} linked product${addon.productIds.length > 1 ? "s" : ""}` : addon.compat.map((c) => TYPE_META[c].plural).join(" · ")}
        </span>
      </div>
    </Comp>
  );
}

/* ------------------------------ browser frame ------------------------------ */

export function BrowserFrame({ src, alt, url = "livo.site", className = "" }: { src: string; alt: string; url?: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-mist-100/12 bg-ink-900 shadow-[0_36px_90px_-42px_rgba(22,32,43,0.45)] ${className}`}>
      <div className="flex items-center gap-2.5 border-b border-mist-100/10 bg-ink-800 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-flare-400/80" />
          <span className="size-2.5 rounded-full bg-solar-400/80" />
          <span className="size-2.5 rounded-full bg-pulse-400/80" />
        </span>
        <span className="num flex-1 truncate rounded-md border border-mist-100/10 bg-ink-900 px-3 py-1 text-[11px] text-mist-400">https://{url}</span>
        <I name="lock" size={12} className="text-pulse-400" />
      </div>
      <img src={src} alt={alt} loading="lazy" className="aspect-[16/10] w-full object-cover object-top" />
    </div>
  );
}
