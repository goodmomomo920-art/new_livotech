import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { TYPE_META } from "../lib/seed";
import { FAQS } from "../lib/faqs";
import { I } from "../components/icons";
import { Badge, money, SectionHead, usePageTitle } from "../components/ui";
import { Counter, Float, Magnetic, Marquee, Reveal, Stagger, StaggerItem, Tilt, usePrefersReducedMotion } from "../lib/motion";
import { AddonCard, ProductCard, TypeBadge } from "../components/product";
import { HeroMotionBg, LiveLaunchBadge, SavingsCalculator, TrustBar } from "../components/growth";

/* ------------------------------ scramble text ------------------------------ */

function Scramble({ text, className = "" }: { text: string; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [out, setOut] = useState(reduced ? text : "");
  useEffect(() => {
    if (reduced) { setOut(text); return; }
    const chars = "▪▫◇/\\|=+*";
    let frame = 0;
    const total = 26;
    const id = window.setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      setOut(text.split("").map((c, i) => (i < reveal ? c : chars[Math.floor(Math.random() * chars.length)])).join(""));
      if (frame >= total) { setOut(text); window.clearInterval(id); }
    }, 34);
    return () => window.clearInterval(id);
  }, [text, reduced]);
  return <span className={className} aria-label={text}>{out || "\u00A0"}</span>;
}

/* ------------------------------- hero mockup ------------------------------- */

function HeroMock() {
  const { state } = useStore();
  const reduced = usePrefersReducedMotion();
  const showcase = useMemo(() => {
    const slugs = ["novapharm-pharmacy-website", "swiftpos", "stockpilot-inventory"];
    const found = slugs.map((s) => state.products.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => !!p);
    return found.length ? found : state.products.slice(0, 3);
  }, [state.products]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reduced || showcase.length < 2) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % showcase.length), 4200);
    return () => window.clearInterval(id);
  }, [reduced, showcase.length]);
  const p = showcase[idx] ?? state.products[0];
  if (!p) return null;

  const chips = [
    { icon: "cart", text: "New order · $86.40", cls: "left-[-26px] top-[16%] anim-floaty", tone: "text-pulse-300 border-pulse-400/40" },
    { icon: "alert", text: "Low stock · 4 SKUs", cls: "right-[-30px] top-[42%] anim-floaty-slow", tone: "text-solar-300 border-solar-400/40" },
    { icon: "refresh", text: "Subscription renewed", cls: "left-[8%] bottom-[-18px] anim-floaty-slow", tone: "text-wave-300 border-wave-400/40" },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(5,150,105,0.14),transparent_70%)]" />
      <div className="anim-spin-slow absolute -right-14 -top-14 -z-10 size-52 rounded-full border border-dashed border-pulse-400/30">
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-solar-400" />
      </div>
      <Tilt max={6}>
        <div className="relative overflow-hidden rounded-2xl border border-mist-100/15 bg-ink-900 shadow-[0_44px_100px_-42px_rgba(22,32,43,0.45)] glow-mint">
          <div className="flex items-center gap-2.5 border-b border-mist-100/10 bg-ink-800 px-4 py-3">
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-flare-400/80" /><span className="size-2.5 rounded-full bg-solar-400/80" /><span className="size-2.5 rounded-full bg-pulse-400/80" />
            </span>
            <span className="num flex-1 truncate rounded-md border border-mist-100/10 bg-ink-900 px-3 py-1 text-[11px] text-mist-400">https://{p.slug.split("-")[0]}.livo.site</span>
            <span className="flex gap-1">{showcase.map((_, i) => <button key={i} onClick={() => setIdx(i)} aria-label={`Show screen ${i + 1}`} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-5 bg-pulse-400" : "w-1.5 bg-mist-100/25 hover:bg-mist-100/50"}`} />)}</span>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden">
            {showcase.map((sp, i) => (
              <img
                key={sp.id} src={sp.image} alt={i === idx ? `${sp.name} interface preview` : ""}
                className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink-950/90 to-transparent px-5 pb-4 pt-10">
              <span className="font-display text-sm font-semibold text-mist-100">{p.name}</span>
              <TypeBadge type={p.type} />
            </div>
          </div>
        </div>
      </Tilt>
      {chips.map((c) => (
        <div key={c.text} className={`absolute z-10 hidden items-center gap-2 rounded-lg border bg-ink-900/97 px-3 py-2 text-[11.5px] font-semibold shadow-[0_16px_40px_-16px_rgba(22,32,43,0.45)] sm:flex ${c.cls} ${c.tone}`}>
          <I name={c.icon} size={13} /> {c.text}
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- sticky showcase ----------------------------- */

const STEPS = [
  { slug: "novapharm-pharmacy-website", icon: "globe", title: "Launch a website that actually sells", body: "Industry-tuned storefronts — pharmacy, restaurant, clinic — with ordering, booking and delivery wired in from day one. You own the license; we handle the plumbing." },
  { slug: "swiftpos", icon: "cpu", title: "Run the counter with SwiftPOS", body: "Barcode-first checkout, offline sync, shift reports. The register stops being the slow part of your business." },
  { slug: "stockpilot-inventory", icon: "layers", title: "Keep stock honest with StockPilot", body: "Reorder points, batch expiry and movement logs across every location. Alerts fire before the shelf goes empty." },
  { slug: "momentum-ui-kit", icon: "box", title: "Sell digital while you sleep", body: "Templates, UI kits and playbooks delivered the second payment clears — files, license and a download guide included." },
];

function StickyShowcase() {
  const { state } = useStore();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }),
      { rootMargin: "-42% 0px -42% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const step = STEPS[active];
  const product = state.products.find((p) => p.slug === step.slug) ?? state.products[0];

  return (
    <section className="container-x grid gap-12 py-24 lg:grid-cols-2 lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Reveal>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-[radial-gradient(closest-side,rgba(5,150,105,0.12),transparent_72%)] transition-all duration-700" />
            <div key={step.slug} className="pop-in overflow-hidden rounded-2xl border border-mist-100/15 bg-ink-900 shadow-[0_36px_90px_-42px_rgba(22,32,43,0.4)]">
              <div className="flex items-center justify-between border-b border-mist-100/10 bg-ink-800 px-4 py-2.5">
                <span className="num text-[11px] text-mist-400">{product ? product.slug : "preview"}.livo.site</span>
                <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-pulse-300"><span className="size-1.5 animate-pulse rounded-full bg-pulse-400" /> LIVE PREVIEW</span>
              </div>
              <div className="aspect-[3/2] overflow-hidden">
                {product && <img src={product.image} alt={`${product.name} preview`} className="h-full w-full object-cover object-top" />}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <div>
        <SectionHead eyebrow="One ecosystem" title={<>Every product plays <span className="text-pulse-400">nicely</span> with the next</>} sub="Websites, systems, SaaS and downloads share one account, one checkout and one dashboard. Start anywhere — expand without migrating." />
        <div className="relative space-y-4">
          <span className="absolute bottom-6 left-[22px] top-6 w-px bg-gradient-to-b from-pulse-400/60 via-mist-100/15 to-transparent" />
          {STEPS.map((s, i) => (
            <div
              key={s.slug} data-i={i} ref={(el) => { refs.current[i] = el; }}
              className={`relative flex gap-5 rounded-xl border p-5 transition-all duration-500 ${active === i ? "border-pulse-400/45 bg-pulse-400/[0.06]" : "border-transparent opacity-55 hover:opacity-80"}`}
            >
              <span className={`z-10 grid size-11 shrink-0 place-items-center rounded-xl border transition-all duration-500 ${active === i ? "border-pulse-400/50 bg-ink-900 text-pulse-300 shadow-[0_0_24px_-4px_rgba(5,150,105,0.45)]" : "border-mist-100/15 bg-ink-900 text-mist-400"}`}>
                <I name={s.icon} size={19} />
              </span>
              <div>
                <p className="num mb-1 text-[10.5px] font-semibold tracking-[0.22em] text-mist-500">STEP 0{i + 1}</p>
                <h3 className="font-display text-lg font-semibold tracking-tight text-mist-100">{s.title}</h3>
                <p className={`mt-1.5 text-[13.5px] leading-relaxed text-mist-400 transition-all duration-500 ${active === i ? "" : "line-clamp-2"}`}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- FAQ --------------------------------- */

function FaqItem({ f, open, onToggle }: { f: { q: string; a: string }; open: boolean; onToggle: () => void }) {
  return (
    <div className={`card overflow-hidden transition-colors duration-300 ${open ? "border-pulse-400/40" : ""}`}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-display text-[15px] font-semibold tracking-tight text-mist-100">{f.q}</span>
        <span className={`grid size-7 shrink-0 place-items-center rounded-full border border-mist-100/15 text-mist-400 transition-transform duration-300 ${open ? "rotate-180 border-pulse-400/50 text-pulse-300" : ""}`}>
          <I name="chevD" size={14} />
        </span>
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-mist-400">{f.a}</p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function Home() {
  usePageTitle("");
  const { state } = useStore();
  const [faqOpen, setFaqOpen] = useState(0);
  const [yearly, setYearly] = useState(false);

  const active = state.products.filter((p) => p.active);
  const featured = active.filter((p) => p.featured).slice(0, 4);
  const completedOrders = state.orders.filter((o) => o.paymentStatus === "paid");
  const customerCount = state.users.filter((u) => u.role === "customer").length;
  const bestSellerId = useMemo(() => {
    const counts = new Map<string, number>();
    state.ownerships.forEach((o) => { if (o.status === "active") counts.set(o.productId, (counts.get(o.productId) ?? 0) + 1); });
    let top: string | null = null, max = 0;
    counts.forEach((n, id) => { if (n > max) { max = n; top = id; } });
    return max > 0 ? top : null;
  }, [state.ownerships]);
  const minWebsite = Math.min(...active.filter((p) => p.type === "website").map((p) => p.price));
  const pos = active.find((p) => p.slug === "swiftpos");
  const minDigital = Math.min(...active.filter((p) => p.downloadable).map((p) => p.price));
  const minAddon = Math.min(...state.addons.filter((a) => a.active).map((a) => a.price));

  return (
    <div className="overflow-x-clip">
      {/* ============ HERO ============ */}
      <section className="relative">
        <HeroMotionBg />
        <div className="bg-grid anim-grid-drift absolute inset-0 -z-20 [mask-image:radial-gradient(75%_65%_at_50%_35%,black,transparent)]" />
        <div className="absolute -top-32 left-1/2 -z-10 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(5,150,105,0.12),transparent_70%)]" />
        <div className="hero-blob hero-blob-a -left-24 top-[-60px] -z-10 h-72 w-72 bg-pulse-400/18" />
        <div className="hero-blob hero-blob-b right-[-40px] top-24 -z-10 h-80 w-80 bg-wave-400/14" />
        <div className="hero-blob hero-blob-c left-1/3 top-96 -z-10 h-56 w-56 bg-pulse-500/12" />
        <div className="absolute right-[6%] top-40 -z-10 hidden lg:block"><Float delay={1}><I name="chip" size={34} className="text-mist-100/15" /></Float></div>
        <div className="absolute left-[4%] top-72 -z-10 hidden lg:block"><Float delay={2.4}><I name="bolt" size={28} className="text-solar-400/40" /></Float></div>

        <div className="container-x grid items-center gap-14 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-3">
              <Scramble text="DIGITAL PRODUCTS · TOOLS · SOLUTIONS" />
            </p>
            <h1 className="font-display text-[clamp(2.5rem,5.6vw,4.4rem)] font-bold leading-[1.02] tracking-[-0.02em]">
              <span className="line-mask"><span>Own the stack</span></span>
              <span className="line-mask"><span style={{ animationDelay: "0.12s" }}>your business</span></span>
              <span className="line-mask"><span style={{ animationDelay: "0.24s" }}>runs on<span className="text-pulse-400">.</span></span></span>
            </h1>
            <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-mist-400">
              Websites, POS & inventory systems, SaaS, templates and e-books — discovered, purchased and managed in one ecosystem.
              Buy once or subscribe, then <span className="text-mist-200">stack add-ons</span> as you grow.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Magnetic>
                <Link to="/products" className="cta-pulse group inline-flex items-center gap-2.5 rounded-xl bg-pulse-400 px-7 py-4 text-[15.5px] font-bold text-ink-950 shadow-[0_16px_40px_-12px_rgba(5,150,105,0.65)] transition-all hover:bg-pulse-300">
                  Browse products
                  <I name="arrowR" size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Magnetic>
              <Link to="/solutions" className="link-line group inline-flex items-center gap-1.5 text-[14px] font-semibold text-mist-300 transition-colors hover:text-pulse-300">
                Explore solutions <I name="arrowUR" size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
            <div className="mt-6"><LiveLaunchBadge /></div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-mist-100/10 pt-6 text-[13px] text-mist-400">
              <span className="flex items-center gap-2"><I name="check" size={14} className="text-pulse-400" /> Own it forever or subscribe</span>
              <span className="flex items-center gap-2"><I name="check" size={14} className="text-pulse-400" /> Instant downloads with a guide</span>
              <span className="flex items-center gap-2"><I name="check" size={14} className="text-pulse-400" /> Add-ons from {money(Number.isFinite(minAddon) ? minAddon : 0)}/mo</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              <div><Counter to={active.length} className="num text-2xl font-bold text-mist-100" /><p className="mt-0.5 text-[11.5px] text-mist-500">Live products</p></div>
              <div><Counter to={customerCount} className="num text-2xl font-bold text-mist-100" /><p className="mt-0.5 text-[11.5px] text-mist-500">Customers</p></div>
              <div><Counter to={completedOrders.length} className="num text-2xl font-bold text-mist-100" /><p className="mt-0.5 text-[11.5px] text-mist-500">Orders delivered</p></div>
            </div>
          </div>
          <HeroMock />
        </div>

        {/* ticker */}
        <div className="border-y border-mist-100/10 bg-ink-900/80 py-3.5">
          <Marquee className="text-mist-500">
            {["Websites", "Point of Sale", "Inventory", "SaaS", "Templates", "UI Kits", "E-books", "Add-ons", "Subscriptions", "Downloads"].map((t) => (
              <span key={t} className="mx-5 flex items-center gap-5 font-display text-[13.5px] font-semibold uppercase tracking-[0.18em]">
                {t} <I name="spark" size={13} className="text-pulse-400/80" />
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      <TrustBar />

      {/* ============ ECOSYSTEM BENTO ============ */}
      <section className="container-x py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <SectionHead eyebrow="The ecosystem" title={<>Six kinds of product. <span className="text-pulse-400">One</span> platform.</>} sub="Categories are data-driven — new product types ship without rebuilding anything." />
          <Link to="/products" className="link-line mb-1 hidden items-center gap-2 text-sm font-semibold text-pulse-300 sm:flex">View all products <I name="arrowR" size={15} /></Link>
        </div>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.categories.filter((c) => c.active).sort((a, b) => a.order - b.order).map((c, i) => {
            const count = active.filter((p) => p.categoryId === c.id).length;
            const typeKey = (Object.entries(TYPE_META).find(([, m]) => m.plural === c.name)?.[0] ?? "other") as keyof typeof TYPE_META;
            return (
              <StaggerItem key={c.id} className={i === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}>
                <Link to={`/products?cat=${c.id}`} className={`group card card-hover sheen relative flex h-full flex-col justify-between overflow-hidden p-6 ${i === 0 ? "min-h-[260px]" : "min-h-[150px]"}`}>
                  <div className="absolute -right-8 -top-8 size-32 rounded-full bg-pulse-400/[0.06] blur-2xl transition-all duration-500 group-hover:bg-pulse-400/[0.14]" />
                  <div>
                    <span className="mb-5 grid size-11 place-items-center rounded-xl border border-mist-100/12 bg-ink-800 text-pulse-300 transition-colors duration-300 group-hover:border-pulse-400/50">
                      <I name={TYPE_META[typeKey].icon} size={20} />
                    </span>
                    <h3 className="font-display text-lg font-semibold tracking-tight">{c.name}</h3>
                    <p className="mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-mist-400">{c.description}</p>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="num text-xs text-mist-500">{count} product{count === 1 ? "" : "s"}</span>
                    <I name="arrowUR" size={16} className="text-mist-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-pulse-300" />
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <StickyShowcase />

      {/* ============ FEATURED ============ */}
      <section className="border-y border-mist-100/8 bg-ink-900/60 py-24">
        <div className="container-x">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <SectionHead eyebrow="Featured drops" title={<>Built once, <span className="text-pulse-400">shipped</span> to many</>} sub="Hand-picked from the catalog — each one production-ready with docs, updates and support." />
            <Link to="/products" className="link-line mb-1 hidden items-center gap-2 text-sm font-semibold text-pulse-300 sm:flex">Browse the full catalog <I name="arrowR" size={15} /></Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} badge={p.id === bestSellerId ? "Most popular" : undefined} />)}
          </div>
        </div>
      </section>

      {/* ============ ADDONS RAIL ============ */}
      <section className="container-x py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <SectionHead eyebrow="Add-on economy" title={<>Stack capability on <span className="text-solar-300">anything</span> you own</>} sub="Loyalty, delivery, coupons, staff permissions — admins link each module to the exact products it fits." />
          <Link to="/addons" className="link-line mb-1 hidden items-center gap-2 text-sm font-semibold text-pulse-300 sm:flex">All add-ons <I name="arrowR" size={15} /></Link>
        </div>
        <div className="-mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-4 hide-scrollbar sm:-mx-8 sm:px-8">
          {state.addons.filter((a) => a.active).map((a) => (
            <div key={a.id} className="w-[290px] shrink-0 snap-start"><AddonCard addon={a} /></div>
          ))}
          <Link to="/addons" className="group grid w-[220px] shrink-0 snap-start place-items-center rounded-xl border border-dashed border-mist-100/20 text-mist-400 transition-colors hover:border-pulse-400/50 hover:text-pulse-300">
            <span className="flex flex-col items-center gap-2 text-sm font-semibold">
              <I name="plus" size={22} /> View all {state.addons.length} add-ons
            </span>
          </Link>
        </div>
      </section>

      {/* ============ PRICING PREVIEW ============ */}
      <section className="border-y border-mist-100/8 bg-ink-900/60 py-24">
        <div className="container-x">
          <SectionHead center eyebrow="Pricing" title={<>Three ways in. <span className="text-pulse-400">Zero</span> lock-in.</>} sub="Every product page shows exact pricing — these are the entry points." />
          <div className="mb-10 flex justify-center">
            <div className="flex items-center gap-1 rounded-lg border border-mist-100/12 bg-ink-900 p-1">
              {(["monthly", "yearly"] as const).map((m) => (
                <button key={m} onClick={() => setYearly(m === "yearly")} aria-pressed={yearly === (m === "yearly")}
                  className={`rounded-md px-4 py-1.5 text-[13px] font-semibold capitalize transition-all duration-200 ${yearly === (m === "yearly") ? "bg-pulse-400 text-ink-950" : "text-mist-400 hover:text-mist-200"}`}>
                  {m}{m === "yearly" && <span className="ml-1.5 text-[10.5px] opacity-80">−17%</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="mx-auto grid max-w-4xl items-stretch gap-5 lg:grid-cols-3">
            <Reveal className="h-full">
              <div className="card card-hover flex h-full flex-col p-6">
                <Badge tone="wave" className="mb-4 w-fit">Own it</Badge>
                <h3 className="font-display text-xl font-bold">Websites</h3>
                <p className="mt-1.5 text-[13px] text-mist-400">One-time purchase, yours forever.</p>
                <p className="num mt-5 text-4xl font-bold">{money(minWebsite)}<span className="text-sm font-medium text-mist-500"> from</span></p>
                <ul className="mt-5 space-y-2 text-[13px] text-mist-300">
                  {["Source + license included", "Free .livo.site subdomain", "Optional care plan"].map((f) => <li key={f} className="flex gap-2"><I name="check" size={13} className="mt-0.5 text-pulse-400" />{f}</li>)}
                </ul>
                <Link to="/products?type=website" className="mt-auto pt-6"><span className="block rounded-lg border border-mist-100/20 py-2.5 text-center text-sm font-semibold transition-colors hover:border-pulse-400/60 hover:text-pulse-300">Browse websites</span></Link>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="h-full">
              <div className="card relative flex h-full flex-col border-pulse-400/45 p-6 shadow-[0_30px_70px_-30px_rgba(5,150,105,0.4)]">
                <span className="absolute -top-3 left-6 rounded-full bg-pulse-400 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-950">Most popular</span>
                <Badge tone="pulse" className="mb-4 w-fit">Subscribe</Badge>
                <h3 className="font-display text-xl font-bold">Business systems</h3>
                <p className="mt-1.5 text-[13px] text-mist-400">POS, inventory & operations.</p>
                <p className="num mt-5 text-4xl font-bold">
                  {money(yearly ? Math.round((pos?.yearlyPrice ?? 890) / 12) : pos?.monthlyPrice ?? 89)}
                  <span className="text-sm font-medium text-mist-500"> /mo{yearly ? ", billed yearly" : ""}</span>
                </p>
                <ul className="mt-5 space-y-2 text-[13px] text-mist-300">
                  {["Updates & support included", "Offline-first architecture", "Cancel any time"].map((f) => <li key={f} className="flex gap-2"><I name="check" size={13} className="mt-0.5 text-pulse-400" />{f}</li>)}
                </ul>
                <Link to="/products?type=system" className="mt-auto pt-6"><span className="block rounded-lg bg-pulse-400 py-2.5 text-center text-sm font-bold text-ink-950 transition-colors hover:bg-pulse-300">Browse systems</span></Link>
              </div>
            </Reveal>
            <Reveal delay={0.2} className="h-full">
              <div className="card card-hover flex h-full flex-col p-6">
                <Badge tone="solar" className="mb-4 w-fit">Download</Badge>
                <h3 className="font-display text-xl font-bold">Digital products</h3>
                <p className="mt-1.5 text-[13px] text-mist-400">Templates, kits, e-books.</p>
                <p className="num mt-5 text-4xl font-bold">{money(minDigital)}<span className="text-sm font-medium text-mist-500"> from</span></p>
                <ul className="mt-5 space-y-2 text-[13px] text-mist-300">
                  {["Instant delivery at checkout", "How-to guide with every file", "Commercial license"].map((f) => <li key={f} className="flex gap-2"><I name="check" size={13} className="mt-0.5 text-pulse-400" />{f}</li>)}
                </ul>
                <Link to="/digital-products" className="mt-auto pt-6"><span className="block rounded-lg border border-mist-100/20 py-2.5 text-center text-sm font-semibold transition-colors hover:border-pulse-400/60 hover:text-pulse-300">Browse downloads</span></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="container-x py-24">
        <Reveal>
          <div className="card relative overflow-hidden px-8 py-12">
            <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_100%_at_50%_0%,black,transparent)]" />
            <div className="relative grid gap-10 text-center sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: active.length, suffix: "", label: "Live products" },
                { n: state.addons.length, suffix: "", label: "Stackable add-ons" },
                { n: completedOrders.length, suffix: "", label: "Orders processed" },
                { n: state.downloads.length, suffix: "", label: "Downloads delivered" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="num text-5xl font-bold text-mist-100"><Counter to={s.n} suffix={s.suffix} /></p>
                  <p className="mt-2 text-[12.5px] font-semibold uppercase tracking-[0.16em] text-mist-500">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="relative mt-8 text-center text-[11.5px] text-mist-500">Live numbers, updated in real time.</p>
          </div>
        </Reveal>
      </section>

      {/* ============ SAVINGS CALCULATOR ============ */}
      <section className="container-x pb-24">
        <Reveal><SavingsCalculator /></Reveal>
      </section>

      {/* ============ FAQ ============ */}
      <section className="container-x grid gap-12 pb-24 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <SectionHead eyebrow="Questions" title={<>Asked <span className="text-pulse-400">often</span>, answered honestly</>} sub="Product-level FAQs live on each product page. These cover the platform." />
          <Link to="/faq" className="link-line inline-flex items-center gap-2 text-sm font-semibold text-pulse-300">Full FAQ <I name="arrowR" size={15} /></Link>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => <FaqItem key={f.q} f={f} open={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? -1 : i)} />)}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="container-x pb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-pulse-400/25 bg-gradient-to-br from-ink-900 via-ink-850 to-ink-800 px-8 py-14 sm:px-14">
            <div className="absolute -left-20 -top-20 size-72 rounded-full bg-pulse-400/12 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 size-72 rounded-full bg-solar-400/10 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tight sm:text-[2.6rem]">
                  Discover. Purchase. Activate.<br /><span className="text-pulse-400">Manage. Expand.</span>
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mist-400">
                  Create an account, buy your first product and watch it appear in your dashboard — downloads, subscriptions and add-ons included.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Magnetic>
                    <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-pulse-400 px-6 py-3 text-[15px] font-bold text-ink-950 transition-colors hover:bg-pulse-300">
                      Create free account <I name="arrowR" size={16} />
                    </Link>
                  </Magnetic>
                  <Link to="/products" className="inline-flex items-center gap-2 rounded-xl border border-mist-100/20 px-6 py-3 text-[15px] font-semibold text-mist-200 transition-colors hover:border-pulse-400/60 hover:text-pulse-300">
                    Browse first
                  </Link>
                </div>
              </div>
              <div className="hidden rounded-xl border border-mist-100/12 bg-ink-900/95 p-5 font-mono text-[12.5px] leading-7 shadow-[0_24px_60px_-30px_rgba(22,32,43,0.4)] lg:block" aria-hidden>
                <p className="text-mist-500"># your livo journey</p>
                <p><span className="text-pulse-400">$</span> <span className="text-mist-200">livo discover</span> <span className="text-mist-500">--type any</span></p>
                <p><span className="text-mist-500">→ 10 products found</span></p>
                <p><span className="text-pulse-400">$</span> <span className="text-mist-200">livo purchase</span> <span className="text-solar-300">novapharm</span></p>
                <p><span className="text-mist-500">→ owned ✓ activated ✓</span></p>
                <p><span className="text-pulse-400">$</span> <span className="text-mist-200">livo attach</span> <span className="text-solar-300">loyalty-points</span></p>
                <p><span className="text-mist-500">→ stacked ✓</span><span className="anim-blink text-pulse-400">▌</span></p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
