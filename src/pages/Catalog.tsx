import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { TYPE_META } from "../lib/seed";
import { I } from "../components/icons";
import { Badge, CardSkeleton, Pagination, SearchInput, Select, useDebounced, usePageTitle, useSimLoad } from "../components/ui";
import { Reveal, Stagger, StaggerItem } from "../lib/motion";
import { ProductCard } from "../components/product";
import type { ProductType } from "../lib/types";

export type CatalogMode = "all" | "solutions" | "digital" | "ebooks";

const MODE_META: Record<CatalogMode, { title: string; eyebrow: string; sub: string }> = {
  all: {
    title: "The full catalog",
    eyebrow: "Products",
    sub: "Every product LivoTech ships — websites, systems, SaaS, templates, e-books and tools. Filter by type, search, sort, done.",
  },
  solutions: {
    title: "Solutions for how you actually work",
    eyebrow: "Solutions",
    sub: "Not sure where to start? Browse by what you need to run: a storefront, a register, a warehouse, or a download that saves you a weekend.",
  },
  digital: {
    title: "Digital products & downloads",
    eyebrow: "Instant delivery",
    sub: "Templates, UI kits and toolkits delivered to your downloads — with a how-to guide — the moment payment clears.",
  },
  ebooks: {
    title: "E-books & playbooks",
    eyebrow: "Reading material",
    sub: "Field-tested playbooks in ePub, PDF and print-ready formats. Buy once, every future edition free.",
  },
};

export default function CatalogPage({ mode }: { mode: CatalogMode }) {
  const meta = MODE_META[mode];
  usePageTitle(meta.title);
  const { state } = useStore();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const q = useDebounced(search).trim().toLowerCase();
  const [type, setType] = useState<string>(params.get("type") ?? "all");
  const [cat, setCat] = useState<string>(params.get("cat") ?? "all");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const base = useMemo(() => {
    let list = state.products.filter((p) => p.active);
    if (mode === "digital") list = list.filter((p) => p.downloadable && p.type !== "ebook");
    if (mode === "ebooks") list = list.filter((p) => p.type === "ebook");
    return list;
  }, [state.products, mode]);

  const filtered = useMemo(() => {
    let list = base;
    if (type !== "all") list = list.filter((p) => p.type === type);
    if (cat !== "all") list = list.filter((p) => p.categoryId === cat);
    if (q) list = list.filter((p) => [p.name, p.tagline, p.description, ...p.tags].join(" ").toLowerCase().includes(q));
    const price = (p: (typeof list)[number]) => (p.billing === "subscription" ? p.monthlyPrice ?? p.price : p.price);
    switch (sort) {
      case "price-asc": return [...list].sort((a, b) => price(a) - price(b));
      case "price-desc": return [...list].sort((a, b) => price(b) - price(a));
      case "rating": return [...list].sort((a, b) => b.rating - a.rating);
      default: return [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || b.reviews - a.reviews);
    }
  }, [base, type, cat, q, sort]);

  useEffect(() => setPage(1), [q, type, cat, sort, pageSize]);
  useEffect(() => {
    const next = new URLSearchParams(params);
    q ? next.set("q", q) : next.delete("q");
    type !== "all" ? next.set("type", type) : next.delete("type");
    cat !== "all" ? next.set("cat", cat) : next.delete("cat");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, cat]);

  const loading = useSimLoad([]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    base.forEach((p) => m.set(p.type, (m.get(p.type) ?? 0) + 1));
    return m;
  }, [base]);

  return (
    <div>
      <section className="relative border-b border-mist-100/8 bg-ink-900/60 py-16">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(70%_90%_at_50%_0%,black,transparent)]" />
        <div className="container-x relative">
          <Reveal>
            <p className="eyebrow mb-3 flex items-center gap-2.5"><span className="inline-block h-px w-7 bg-pulse-400/70" />{meta.eyebrow}</p>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{meta.title}</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mist-400">{meta.sub}</p>
          </Reveal>
        </div>
      </section>

      <div className="container-x py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={type === "all"} onClick={() => setType("all")} label={`All (${base.length})`} />
            {(Object.keys(TYPE_META) as ProductType[]).filter((t) => typeCounts.has(t)).map((t) => (
              <FilterChip key={t} active={type === t} onClick={() => setType(t)} label={`${TYPE_META[t].plural} (${typeCounts.get(t)})`} icon={TYPE_META[t].icon} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput value={search} onChange={setSearch} placeholder="Search products…" className="w-full sm:w-56" />
            <Select value={cat} onChange={(e) => setCat(e.target.value)} className="!w-auto" aria-label="Filter by category">
              <option value="all">All categories</option>
              {state.categories.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="!w-auto" aria-label="Sort products">
              <option value="featured">Featured first</option>
              <option value="price-asc">Price: low → high</option>
              <option value="price-desc">Price: high → low</option>
              <option value="rating">Top rated</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : paged.length === 0 ? (
          <div className="rounded-xl border border-dashed border-mist-100/20 bg-ink-800/50 px-6 py-16 text-center">
            <I name="search" size={28} className="mx-auto mb-4 text-mist-500" />
            <h3 className="font-display text-lg font-semibold">No products match those filters</h3>
            <p className="mt-1.5 text-sm text-mist-400">Try a different search term, or clear the filters below.</p>
            <button onClick={() => { setSearch(""); setType("all"); setCat("all"); }} className="mt-5 rounded-lg border border-mist-100/20 px-4 py-2 text-sm font-semibold text-mist-200 transition-colors hover:border-pulse-400/60 hover:text-pulse-300">
              Clear all filters
            </button>
          </div>
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((p, i) => (
              <StaggerItem key={p.id} className="h-full"><div className="h-full"><ProductCard product={p} index={i} /></div></StaggerItem>
            ))}
          </Stagger>
        )}

        <div className="mt-10">
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
        </div>
      </div>

      {mode === "solutions" && (
        <section className="container-x pb-10">
          <Reveal>
            <div className="card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
              <div>
                <Badge tone="pulse" className="mb-3">Need it tailored?</Badge>
                <h2 className="font-display text-2xl font-bold tracking-tight">Every product here can be adapted to your industry</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist-400">Pharmacy, restaurant, clinic, retail — the platform is industry-agnostic by design. Tell us what you run and we'll point you at the right starting block.</p>
              </div>
              <Link to="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-pulse-400 px-5 py-3 text-sm font-bold text-ink-950 transition-colors hover:bg-pulse-300">
                Talk to us <I name="arrowR" size={15} />
              </Link>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: string }) {
  return (
    <button
      onClick={onClick} aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-200 ${
        active ? "border-pulse-400/60 bg-pulse-400/12 text-pulse-300" : "border-mist-100/12 bg-ink-900 text-mist-400 hover:border-mist-100/30 hover:text-mist-200"
      }`}
    >
      {icon && <I name={icon} size={13} />} {label}
    </button>
  );
}
