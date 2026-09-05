import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { I } from "./icons";
import { money } from "./ui";
import { Stars } from "./product";
import { usePrefersReducedMotion } from "../lib/motion";

/* ============================================================================
   1) HERO MOTION-GRAPHICS BACKGROUND
   Coded SVG/CSS animation — no <video>. Cheap on the main thread, no network
   payload, keeps the hero fast (this is the whole point vs. a real video bg).
   ========================================================================= */

export function HeroMotionBg() {
  const reduced = usePrefersReducedMotion();
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: 4 + Math.random() * 92,
        size: 2 + Math.random() * 3.5,
        delay: Math.random() * 10,
        duration: 9 + Math.random() * 8,
        drift: `${(Math.random() - 0.5) * 60}px`,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* animated gradient mesh */}
      <div className="anim-mesh absolute -top-24 left-[8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(5,150,105,0.16),transparent_72%)] blur-2xl" />
      <div className="anim-mesh-b absolute top-10 right-[6%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(2,132,199,0.13),transparent_72%)] blur-2xl" />
      <div className="anim-mesh absolute bottom-[-140px] left-1/3 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(217,119,6,0.10),transparent_72%)] blur-2xl" style={{ animationDelay: "-6s" }} />

      {/* light pulses */}
      {!reduced && (
        <>
          <span className="anim-pulse-dot absolute left-[18%] top-[22%] size-2.5 rounded-full bg-pulse-400/70" />
          <span className="anim-pulse-dot absolute right-[22%] top-[38%] size-2 rounded-full bg-wave-400/70" style={{ animationDelay: "1.1s" }} />
          <span className="anim-pulse-dot absolute left-[38%] top-[68%] size-1.5 rounded-full bg-solar-400/70" style={{ animationDelay: "2.2s" }} />
          <span className="anim-pulse-dot absolute right-[12%] top-[70%] size-2 rounded-full bg-pulse-400/60" style={{ animationDelay: "0.6s" }} />
        </>
      )}

      {/* floating particles drifting upward */}
      {!reduced &&
        particles.map((p) => (
          <span
            key={p.id}
            className="anim-particle bg-pulse-400/40"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              // @ts-expect-error custom property
              "--drift": p.drift,
            }}
          />
        ))}
    </div>
  );
}

/* ============================================================================
   8) BRAND BACKGROUND — site-wide, subtle, echoes the LivoTech mark: a giant
   faint "LT" watermark plus small drifting pixel-squares (the logo's own
   motif), in the logo's navy/blue palette. Fixed behind all page content.
   ========================================================================= */

export function BrandBg() {
  const reduced = usePrefersReducedMotion();
  const pixels = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: 2 + Math.random() * 96,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 14,
        duration: 16 + Math.random() * 12,
        drift: `${(Math.random() - 0.5) * 90}px`,
        hue: i % 2 === 0 ? "#0284c7" : "#16202b",
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-30 overflow-hidden" aria-hidden>
      {/* giant faint LT wordmark watermark */}
      <span
        className="absolute left-1/2 top-[8%] -translate-x-1/2 select-none font-display font-bold leading-none tracking-tight opacity-[0.035]"
        style={{ fontSize: "clamp(18rem, 42vw, 34rem)", color: "#0b1830" }}
      >
        LT
      </span>
      {/* drifting brand pixels, matching the logo's dot motif */}
      {!reduced &&
        pixels.map((p) => (
          <span
            key={p.id}
            className="anim-particle rounded-[3px]"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.hue,
              opacity: 0.16,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              // @ts-expect-error custom property
              "--drift": p.drift,
            }}
          />
        ))}
    </div>
  );
}

/* ============================================================================
   2) LIVE LAUNCH COUNTER — real number, computed from store orders/websites
   ========================================================================= */

export function LiveLaunchBadge() {
  const { state } = useStore();
  const launchedThisMonth = useMemo(() => {
    const now = new Date();
    return state.websites.filter((w) => {
      const d = new Date(w.createdAt);
      return w.status === "active" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [state.websites]);

  if (launchedThisMonth <= 0) return null;
  return (
    <Link
      to="/products?type=website"
      className="group inline-flex items-center gap-2.5 rounded-full border border-pulse-400/30 bg-pulse-400/[0.07] py-1.5 pl-1.5 pr-4 text-[12.5px] font-semibold text-mist-200 transition-colors hover:border-pulse-400/55"
    >
      <span className="relative flex size-6 items-center justify-center">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-pulse-400/50" />
        <span className="relative inline-flex size-2.5 rounded-full bg-pulse-400" />
      </span>
      <span className="num">{launchedThisMonth}</span> موقع تم إطلاقه هذا الشهر
      <I name="arrowUR" size={13} className="text-pulse-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

/* ============================================================================
   3) TRUST BAR — real aggregate numbers + real top-rated products.
   No fabricated client logos/testimonials: we only surface what's actually
   in the database (ratings, review counts, paid-order volume).
   ========================================================================= */

export function TrustBar() {
  const { state } = useStore();
  const paidOrders = state.orders.filter((o) => o.paymentStatus === "paid").length;
  const customers = state.users.filter((u) => u.role === "customer").length;
  const topRated = useMemo(
    () => [...state.products].filter((p) => p.active && p.reviews > 0).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 4),
    [state.products],
  );

  return (
    <div className="border-y border-mist-100/8 bg-ink-900/60 py-8">
      <div className="container-x flex flex-wrap items-center justify-center gap-x-10 gap-y-5 text-center">
        <div>
          <p className="num text-2xl font-bold text-mist-100">{customers}+</p>
          <p className="text-[11.5px] uppercase tracking-[0.14em] text-mist-500">عميل موثّق</p>
        </div>
        <div>
          <p className="num text-2xl font-bold text-mist-100">{paidOrders}+</p>
          <p className="text-[11.5px] uppercase tracking-[0.14em] text-mist-500">طلب مكتمل</p>
        </div>
        {topRated.map((p) => (
          <Link key={p.id} to={`/products/${p.slug}`} className="flex items-center gap-2.5 rounded-lg border border-mist-100/10 px-3.5 py-2 transition-colors hover:border-pulse-400/40">
            <img src={p.image} alt="" className="size-8 rounded-md object-cover" />
            <div className="text-left">
              <p className="text-[12.5px] font-semibold text-mist-100">{p.name}</p>
              <Stars rating={p.rating} reviews={p.reviews} size={10} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   4) LIVE ACTIVITY TOASTS — built from real completed orders, not invented
   sales. Shows the most recent paid orders, rotating, name partially masked
   for privacy.
   ========================================================================= */

function maskName(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "عميل";
  return parts.length > 1 ? `${first} ${parts[1][0]}.` : first;
}

export function LiveActivityToast() {
  const { state } = useStore();
  const reduced = usePrefersReducedMotion();
  const feed = useMemo(() => {
    return state.orders
      .filter((o) => o.paymentStatus === "paid")
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8)
      .map((o) => {
        const buyer = state.users.find((u) => u.id === o.customerId);
        return { id: o.id, name: buyer ? maskName(buyer.name) : "عميل", item: o.items[0]?.name ?? "منتج", at: o.createdAt };
      });
  }, [state.orders, state.users]);

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced || feed.length === 0) return;
    let cycle: number;
    const show = () => {
      setVisible(true);
      const hide = window.setTimeout(() => setVisible(false), 5200);
      const next = window.setTimeout(() => { setIdx((i) => (i + 1) % feed.length); show(); }, 8600);
      cycle = next;
      return () => { window.clearTimeout(hide); window.clearTimeout(next); };
    };
    const t0 = window.setTimeout(show, 2500);
    return () => { window.clearTimeout(t0); window.clearTimeout(cycle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed.length, reduced]);

  if (reduced || feed.length === 0 || !visible) return null;
  const f = feed[idx];

  return (
    <div className="toast-slide-in fixed bottom-5 left-5 z-40 hidden max-w-[300px] items-center gap-3 rounded-xl border border-mist-100/12 bg-ink-900 p-3.5 shadow-[0_24px_60px_-24px_rgba(22,32,43,0.4)] sm:flex">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pulse-400/12 text-pulse-400">
        <I name="cart" size={16} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-semibold text-mist-100">{f.name} اشترى للتو</p>
        <p className="truncate text-[12px] text-mist-400">{f.item}</p>
      </div>
      <button aria-label="إغلاق" onClick={() => setVisible(false)} className="ml-auto shrink-0 text-mist-500 hover:text-mist-300">
        <I name="close" size={13} />
      </button>
    </div>
  );
}

/* ============================================================================
   5) STICKY CTA BAR — appears after the user scrolls past the hero
   ========================================================================= */

export function StickyCtaBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;

  return (
    <div className="sticky-bar-in fixed inset-x-0 bottom-0 z-40 border-t border-mist-100/12 bg-ink-900/95 backdrop-blur">
      <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-[13.5px] font-semibold text-mist-100">
          جاهز تبدأ؟ <span className="hidden text-mist-400 sm:inline">تصفح المنتجات وابدأ التفعيل في نفس اليوم.</span>
        </p>
        <div className="flex items-center gap-2.5">
          <Link to="/products" className="rounded-lg border border-mist-100/20 px-4 py-2 text-[13px] font-semibold text-mist-200 transition-colors hover:border-pulse-400/60 hover:text-pulse-300">
            تصفح المنتجات
          </Link>
          <Link to="/register" className="cta-pulse rounded-lg bg-pulse-400 px-4 py-2 text-[13px] font-bold text-ink-950 transition-colors hover:bg-pulse-300">
            ابدأ الآن مجانًا
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   6) EXIT-INTENT POPUP — once per session, triggers when the pointer leaves
   the top of the viewport (about-to-close-tab signal)
   ========================================================================= */

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem("livo_exit_shown") === "1") shown.current = true;
    const onLeave = (e: MouseEvent) => {
      if (shown.current) return;
      if (e.clientY <= 0) {
        shown.current = true;
        sessionStorage.setItem("livo_exit_shown", "1");
        setOpen(true);
      }
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} className="pop-in relative w-full max-w-md overflow-hidden rounded-2xl border border-mist-100/12 bg-ink-900 p-7 shadow-[0_50px_120px_-40px_rgba(22,32,43,0.5)]">
        <div className="hero-blob hero-blob-a -right-16 -top-16 size-52 bg-pulse-400/16" />
        <button aria-label="إغلاق" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid size-8 place-items-center rounded-full border border-mist-100/15 text-mist-400 hover:text-mist-200">
          <I name="close" size={14} />
        </button>
        <span className="mb-4 grid size-11 place-items-center rounded-xl border border-pulse-400/35 bg-pulse-400/10 text-pulse-400"><I name="spark" size={20} /></span>
        <h3 className="font-display text-xl font-bold tracking-tight text-mist-100">قبل ما تسيب الصفحة…</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-mist-400">
          سجّل حساب مجاني دلوقتي واحصل على نظرة كاملة على المنتجات، الأسعار، والدعم — من غير أي التزام مبدئي.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/register" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-xl bg-pulse-400 px-5 py-2.5 text-[14px] font-bold text-ink-950 hover:bg-pulse-300">
            إنشاء حساب مجاني <I name="arrowR" size={15} />
          </Link>
          <button onClick={() => setOpen(false)} className="rounded-xl border border-mist-100/20 px-5 py-2.5 text-[14px] font-semibold text-mist-300 hover:border-pulse-400/50 hover:text-pulse-300">
            لأ، شكرًا
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   7) SAVINGS CALCULATOR — "احسب وفرك" — compares buying a ready product vs.
   building from scratch, using real minimum catalog prices as the "buy" side.
   ========================================================================= */

export function SavingsCalculator() {
  const { state } = useStore();
  const minWebsite = useMemo(() => {
    const prices = state.products.filter((p) => p.active && p.type === "website").map((p) => p.price);
    return prices.length ? Math.min(...prices) : 0;
  }, [state.products]);

  const [devDays, setDevDays] = useState(30);
  const [dayRate, setDayRate] = useState(120);

  const buildCost = devDays * dayRate;
  const savings = Math.max(0, buildCost - minWebsite);
  const pct = buildCost > 0 ? Math.round((savings / buildCost) * 100) : 0;

  return (
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_100%_at_50%_0%,black,transparent)]" />
      <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-mist-100">احسب وفرك</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-mist-400">
            قارن تكلفة بناء موقع من الصفر بفريق تطوير، بشراء موقع جاهز من الكتالوج (بيبدأ من {money(minWebsite)}).
          </p>
          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-mist-400">
                <span>أيام التطوير المتوقعة</span><span className="num font-semibold text-mist-100">{devDays} يوم</span>
              </div>
              <input type="range" min={5} max={90} value={devDays} onChange={(e) => setDevDays(Number(e.target.value))} className="w-full accent-pulse-400" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-mist-400">
                <span>تكلفة اليوم الواحد (مطوّر)</span><span className="num font-semibold text-mist-100">{money(dayRate)}</span>
              </div>
              <input type="range" min={30} max={400} step={10} value={dayRate} onChange={(e) => setDayRate(Number(e.target.value))} className="w-full accent-pulse-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-pulse-400/25 bg-pulse-400/[0.05] p-6 text-center">
          <p className="text-[11.5px] uppercase tracking-[0.16em] text-mist-500">تكلفة البناء من الصفر (تقديري)</p>
          <p className="num mt-1 text-2xl font-bold text-mist-300 line-through decoration-flare-400/60">{money(buildCost)}</p>
          <p className="mt-4 text-[11.5px] uppercase tracking-[0.16em] text-mist-500">وفرك المتوقع مع Livo</p>
          <p className="num mt-1 text-4xl font-bold text-pulse-400">{money(savings)}</p>
          <p className="mt-2 text-[12.5px] text-mist-400">أقل بنسبة <span className="num font-semibold text-mist-100">{pct}%</span> من تكلفة البناء الداخلي</p>
          <Link to="/products?type=website" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pulse-400 px-5 py-2.5 text-[13.5px] font-bold text-ink-950 hover:bg-pulse-300">
            شوف المواقع الجاهزة <I name="arrowR" size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
