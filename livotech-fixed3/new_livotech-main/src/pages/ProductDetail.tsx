import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { isAddonCompatible } from "../lib/seed";
import { I } from "../components/icons";
import { Badge, Btn, money, Sk, usePageTitle } from "../components/ui";
import { Float, Magnetic, Reveal, Tilt } from "../lib/motion";
import { AddonCard, BrowserFrame, PriceTag, ProductCard, Stars, TypeBadge } from "../components/product";
import type { BillingInterval } from "../lib/types";

function DetailSkeleton() {
  return (
    <div className="container-x py-12">
      <Sk className="mb-8 h-4 w-72" />
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4"><Sk className="aspect-[3/2] w-full" /><div className="flex gap-3">{[...Array(3)].map((_, i) => <Sk key={i} className="h-20 w-28" />)}</div></div>
        <div className="space-y-4"><Sk className="h-5 w-24" /><Sk className="h-10 w-3/4" /><Sk className="h-4 w-full" /><Sk className="h-4 w-2/3" /><Sk className="h-28 w-full" /><Sk className="h-12 w-full" /></div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { state, me, setCart, toast } = useStore();
  const nav = useNavigate();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), 450);
    return () => clearTimeout(t);
  }, [slug]);

  const product = state.products.find((p) => p.slug === slug && p.active);
  usePageTitle(product ? product.name : "Product");

  const [imgIdx, setImgIdx] = useState(0);
  const [interval, setInterval] = useState<BillingInterval>(
    product?.billing === "subscription" ? "monthly" : "once",
  );
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [faqOpen, setFaqOpen] = useState(0);

  /* reset selection state when navigating between products */
  useEffect(() => {
    const prod = state.products.find((p) => p.slug === slug);
    setImgIdx(0);
    setSelectedAddons([]);
    setFaqOpen(0);
    setInterval(prod?.billing === "subscription" ? "monthly" : "once");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!loaded) return <DetailSkeleton />;

  if (!product) {
    return (
      <div className="container-x py-24 text-center">
        <I name="alert" size={30} className="mx-auto mb-4 text-solar-300" />
        <h1 className="font-display text-3xl font-bold">Product not found</h1>
        <p className="mt-2 text-sm text-mist-400">It may have been unpublished or the link is wrong.</p>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pulse-400 px-5 py-2.5 text-sm font-bold text-ink-950"><I name="arrowL" size={15} /> Back to catalog</Link>
      </div>
    );
  }

  const category = state.categories.find((c) => c.id === product.categoryId);
  const addons = state.addons.filter((a) => isAddonCompatible(a, product));
  const related = state.products.filter((p) => p.active && p.id !== product.id && (p.type === product.type || p.categoryId === product.categoryId)).slice(0, 3);
  const owned = me && state.ownerships.some((o) => o.customerId === me.id && o.productId === product.id && o.status === "active");

  const unit = interval === "monthly" ? product.monthlyPrice ?? product.price : interval === "yearly" ? product.yearlyPrice ?? product.price : product.price;
  const addonTotal = selectedAddons.reduce((s, id) => s + (state.addons.find((a) => a.id === id)?.price ?? 0), 0);
  const total = unit + addonTotal;

  const startPurchase = (goCheckout: boolean) => {
    setCart({ productId: product.id, interval, addonIds: selectedAddons });
    if (goCheckout) nav(me ? "/checkout" : "/login?next=/checkout");
    else toast("success", "Added to cart", `${product.name}${selectedAddons.length ? ` + ${selectedAddons.length} add-on(s)` : ""} — review it any time.`);
  };

  /* owned product → attach-only cart (base is never charged twice) */
  const attachSelected = () => {
    if (!selectedAddons.length) { toast("info", "Pick add-ons first", "Select at least one add-on below — only compatible ones are shown."); return; }
    setCart({ productId: product.id, interval: "once", addonIds: selectedAddons });
    nav("/checkout");
  };

  return (
    <div>
      <div className="container-x pt-8">
        <nav className="mb-7 flex flex-wrap items-center gap-2 text-[12.5px] text-mist-500" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-pulse-300">Home</Link> <I name="chevR" size={11} />
          <Link to="/products" className="hover:text-pulse-300">Products</Link> <I name="chevR" size={11} />
          {category && <><Link to={`/products?cat=${category.slug}`} className="hover:text-pulse-300">{category.name}</Link> <I name="chevR" size={11} /></>}
          <span className="text-mist-300">{product.name}</span>
        </nav>
      </div>

      <div className="container-x grid gap-12 pb-16 lg:grid-cols-[1.15fr_1fr]">
        {/* gallery */}
        <div>
          <Reveal>
            <Tilt max={3.5}>
              <div className="overflow-hidden rounded-2xl border border-mist-100/15 bg-ink-900 shadow-[0_36px_90px_-42px_rgba(22,32,43,0.4)]">
                <div className="flex items-center gap-2.5 border-b border-mist-100/10 bg-ink-800 px-4 py-2.5">
                  <span className="flex gap-1.5"><span className="size-2.5 rounded-full bg-flare-400/80" /><span className="size-2.5 rounded-full bg-solar-400/80" /><span className="size-2.5 rounded-full bg-pulse-400/80" /></span>
                  <span className="num flex-1 truncate rounded-md border border-mist-100/10 bg-ink-900 px-3 py-1 text-[11px] text-mist-400">preview · {product.slug}</span>
                </div>
                <div className="relative aspect-[3/2] overflow-hidden">
                  {product.gallery.map((g, i) => (
                    <img key={g + i} src={g} alt={`${product.name} screenshot ${i + 1}`} className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${i === imgIdx ? "opacity-100" : "opacity-0"}`} />
                  ))}
                </div>
              </div>
            </Tilt>
          </Reveal>
          <div className="mt-4 flex gap-3">
            {product.gallery.map((g, i) => (
              <button key={g + i} onClick={() => setImgIdx(i)} aria-label={`View screenshot ${i + 1}`}
                className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${i === imgIdx ? "border-pulse-400/70" : "border-mist-100/15 opacity-60 hover:opacity-100"}`}>
                <img src={g} alt="" className="h-full w-full object-cover object-top" />
              </button>
            ))}
          </div>
        </div>

        {/* buy panel */}
        <div>
          <Reveal delay={0.08}>
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={product.type} />
              {category && <Badge tone="mist">{category.name}</Badge>}
              <Badge tone="pulse" className="num">v{product.version}</Badge>
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.04] tracking-tight">{product.name}</h1>
            <div className="mt-3"><Stars rating={product.rating} reviews={product.reviews} size={15} /></div>
            <p className="mt-4 text-[15px] leading-relaxed text-mist-300">{product.tagline}</p>

            <div className="card mt-7 p-6">
              {product.billing === "subscription" && (product.monthlyPrice || product.yearlyPrice) ? (
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {([["monthly", "Monthly"], ["yearly", "Yearly"], ["once", "Lifetime"]] as [BillingInterval, string][]).map(([iv, label]) => {
                    const p = iv === "monthly" ? product.monthlyPrice ?? product.price : iv === "yearly" ? product.yearlyPrice ?? product.price : product.price;
                    return (
                      <button key={iv} onClick={() => setInterval(iv)} aria-pressed={interval === iv}
                        className={`rounded-lg border px-3 py-2.5 text-left transition-all duration-200 ${interval === iv ? "border-pulse-400/60 bg-pulse-400/10" : "border-mist-100/12 hover:border-mist-100/30"}`}>
                        <span className={`block text-[11px] font-semibold uppercase tracking-wider ${interval === iv ? "text-pulse-300" : "text-mist-500"}`}>{label}</span>
                        <span className="num text-[15px] font-bold text-mist-100">{money(p, product.currency)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-5"><PriceTag product={product} size="lg" /></div>
              )}

              {addons.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-mist-500">Compatible add-ons · {selectedAddons.length} selected</p>
                  <div className="flex flex-wrap gap-2">
                    {addons.map((a) => {
                      const on = selectedAddons.includes(a.id);
                      return (
                        <button key={a.id} onClick={() => setSelectedAddons((s) => (on ? s.filter((x) => x !== a.id) : [...s, a.id]))} aria-pressed={on}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-all duration-200 ${on ? "border-pulse-400/60 bg-pulse-400/10 text-pulse-300" : "border-mist-100/12 text-mist-400 hover:border-mist-100/30"}`}>
                          <I name={a.icon} size={13} /> {a.name} <span className="num text-mist-500">{money(a.price, product.currency)}/mo</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-mist-100/10 pt-4">
                <span className="text-[13px] text-mist-400">Total {interval !== "once" ? "today" : ""}</span>
                <span className="num text-2xl font-bold text-mist-100">
                  {money(total, product.currency)}{interval !== "once" && <span className="text-sm font-medium text-mist-500"> /{interval === "monthly" ? "mo" : "yr"}</span>}
                </span>
              </div>

              {owned ? (
                <div className="mt-5 rounded-lg border border-pulse-400/40 bg-pulse-400/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-pulse-300"><I name="check" size={15} /> You own this product</p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <Link to="/dashboard/products"><Btn size="sm" variant="outline">Open dashboard</Btn></Link>
                    {product.downloadable && <Link to="/dashboard/downloads"><Btn size="sm" variant="soft" icon="download">Downloads</Btn></Link>}
                    {addons.length > 0 && (
                      <Btn size="sm" icon="plus" onClick={attachSelected}>
                        {selectedAddons.length ? `Checkout with ${selectedAddons.length} add-on${selectedAddons.length > 1 ? "s" : ""}` : "Attach add-ons"}
                      </Btn>
                    )}
                  </div>
                  {addons.length > 0 && <p className="mt-2.5 text-[11.5px] text-mist-500">Pick compatible add-ons below — only the add-on is charged, never the base product again.</p>}
                </div>
              ) : (
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <Magnetic><Btn size="lg" className="w-full" icon="bolt" onClick={() => startPurchase(true)}>Buy now</Btn></Magnetic>
                  <Btn size="lg" variant="outline" icon="cart" onClick={() => startPurchase(false)}>Add to cart</Btn>
                </div>
              )}
              <p className="mt-3.5 flex items-center gap-2 text-[11.5px] text-mist-500">
                <I name="shield" size={13} className="text-pulse-400" /> Ownership activates after verified payment · {product.downloadable ? "files delivered instantly with a guide" : "14-day refund window"}
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* description + features */}
      <section className="border-y border-mist-100/8 bg-ink-900/60 py-16">
        <div className="container-x grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <p className="eyebrow mb-3">About this product</p>
            <h2 className="font-display text-2xl font-bold tracking-tight">What you're getting</h2>
            {product.description.split("\n\n").map((par) => (
              <p key={par.slice(0, 24)} className="mt-4 text-[14.5px] leading-[1.75] text-mist-300">{par}</p>
            ))}
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((t) => <Badge key={t} tone="mist" className="capitalize">#{t}</Badge>)}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card p-6">
              <p className="eyebrow mb-4">Features</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-mist-300">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-pulse-400/15 text-pulse-300"><I name="check" size={11} strokeWidth={2.6} /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* mockup band */}
      <section className="container-x py-16">
        <Reveal>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="eyebrow mb-3">See it running</p>
              <h2 className="font-display text-2xl font-bold tracking-tight">Production-grade, not mockup-grade</h2>
              <p className="mt-3 text-sm leading-relaxed text-mist-400">What you see is the real interface — same components, same performance budgets we ship to paying customers.</p>
            </div>
            <Float className="w-full"><BrowserFrame src={product.gallery[1] ?? product.image} alt={`${product.name} live interface`} url={`${product.slug.split("-")[0]}.livo.site`} /></Float>
          </div>
        </Reveal>
      </section>

      {/* addons */}
      {addons.length > 0 && (
        <section className="border-t border-mist-100/8 bg-ink-900/60 py-16">
          <div className="container-x">
            <Reveal>
              <p className="eyebrow mb-3">Stack on top</p>
              <h2 className="font-display text-2xl font-bold tracking-tight">Add-ons linked to {product.name}</h2>
              <p className="mt-2 max-w-xl text-sm text-mist-400">Our team links each module to the products it actually fits — you can't buy an incompatible combination.</p>
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {addons.slice(0, 6).map((a) => (
                <AddonCard key={a.id} addon={a} selected={selectedAddons.includes(a.id)} onSelect={(id) => setSelectedAddons((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {product.faqs.length > 0 && (
        <section className="container-x grid gap-10 py-16 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="eyebrow mb-3">Product FAQ</p>
            <h2 className="font-display text-2xl font-bold tracking-tight">Before you buy</h2>
            <p className="mt-3 text-sm text-mist-400">Still unsure? <Link to="/contact" className="text-pulse-300 hover:text-pulse-400">Ask us directly</Link> — replies within one business day.</p>
          </Reveal>
          <div className="space-y-3">
            {product.faqs.map((f, i) => (
              <div key={f.q} className={`card overflow-hidden transition-colors ${faqOpen === i ? "border-pulse-400/40" : ""}`}>
                <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} aria-expanded={faqOpen === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-display text-[14.5px] font-semibold">{f.q}</span>
                  <I name="chevD" size={14} className={`shrink-0 text-mist-400 transition-transform duration-300 ${faqOpen === i ? "rotate-180 text-pulse-300" : ""}`} />
                </button>
                <div className="grid transition-[grid-template-rows] duration-300" style={{ gridTemplateRows: faqOpen === i ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden"><p className="px-5 pb-5 text-[13.5px] leading-relaxed text-mist-400">{f.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* related */}
      {related.length > 0 && (
        <section className="border-t border-mist-100/8 bg-ink-900/60 py-16">
          <div className="container-x">
            <Reveal>
              <p className="eyebrow mb-3">Keep exploring</p>
              <h2 className="mb-8 font-display text-2xl font-bold tracking-tight">Pairs well with</h2>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
