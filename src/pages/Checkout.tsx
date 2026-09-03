import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore, wait } from "../lib/store";
import { TYPE_META } from "../lib/seed";
import { I } from "../components/icons";
import { Badge, Btn, EmptyState, money, usePageTitle } from "../components/ui";
import { Reveal } from "../lib/motion";
import type { Order, ProductFile } from "../lib/types";

type Step = "review" | "pay" | "done";

export default function CheckoutPage() {
  usePageTitle("Checkout");
  const { state, me, setCart, validateCoupon, checkout, recordDownload, toast } = useStore();
  const nav = useNavigate();
  const cart = state.cart;
  const product = useMemo(() => state.products.find((p) => p.id === cart?.productId) ?? null, [state.products, cart]);
  const addons = useMemo(() => (cart ? state.addons.filter((a) => cart.addonIds.includes(a.id)) : []), [state.addons, cart]);

  const [step, setStep] = useState<Step>("review");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponErr, setCouponErr] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [method, setMethod] = useState("Card");
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [dlKey, setDlKey] = useState<string | null>(null);
  const [allBusy, setAllBusy] = useState(false);

  const ownedBase = !!me && !!product && state.ownerships.some((o) => o.customerId === me.id && o.productId === product.id && o.status === "active");

  const unit = cart && !ownedBase
    ? cart.interval === "monthly" ? product?.monthlyPrice ?? product?.price ?? 0
      : cart.interval === "yearly" ? product?.yearlyPrice ?? product?.price ?? 0
      : product?.price ?? 0
    : 0;
  const subtotal = unit + addons.reduce((s, a) => s + a.price, 0);
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);
  const addonMonthly = addons.some((a) => a.interval === "monthly");

  const applyCoupon = async () => {
    setCouponErr(""); setCouponBusy(true);
    try {
      const v = await validateCoupon(couponInput, subtotal);
      setCoupon({ code: v.code, discount: v.discount });
      toast("success", `Coupon ${v.code} applied`, `You saved ${money(v.discount)}.`);
    } catch (e) {
      setCoupon(null);
      setCouponErr(e instanceof Error ? e.message : "Invalid coupon.");
    } finally {
      setCouponBusy(false);
    }
  };

  const pay = async () => {
    setPayErr(""); setPaying(true);
    try {
      const o = await checkout({ couponCode: coupon?.code, method });
      setOrder(o);
      setStep("done");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setPayErr(e instanceof Error ? e.message : "Payment could not be completed.");
    } finally {
      setPaying(false);
    }
  };

  const dlOne = async (f: ProductFile) => {
    if (!product) return;
    setDlKey(f.id);
    try {
      await recordDownload(product.id, f.id, f.name);
      toast("success", "Download started", `${f.name} — ownership verified, signed URL issued.`);
    } catch (e) {
      toast("error", "Download blocked", e instanceof Error ? e.message : "Authorization failed.");
    } finally {
      setDlKey(null);
    }
  };

  const dlAll = async (files: ProductFile[]) => {
    if (!product || allBusy) return;
    setAllBusy(true);
    for (const f of files) {
      try { await recordDownload(product.id, f.id, f.name); } catch { /* ownership already validated */ }
      await wait(650);
    }
    setAllBusy(false);
    toast("success", `${files.length} files delivered`, "Everything is also saved under Dashboard → Downloads.");
  };

  /* ------------------------------ success ------------------------------ */

  if (step === "done" && order) {
    const baseItemId = order.items.find((i) => i.type !== "addon")?.productId ?? order.items[0]?.productId;
    const p = state.products.find((x) => x.id === baseItemId);
    return (
      <div className="container-x flex min-h-[70vh] items-center justify-center py-16">
        <Reveal className="w-full max-w-xl">
          <div className="card relative overflow-hidden p-8 text-center">
            <div className="absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-pulse-400/15 blur-3xl" />
            <span className="relative mx-auto mb-5 grid size-16 place-items-center rounded-full border border-pulse-400/50 bg-pulse-400/10 text-pulse-300">
              <I name="check" size={28} strokeWidth={2.2} />
            </span>
            <p className="num text-[12px] font-bold tracking-widest text-pulse-300">ORDER {order.number}</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Payment verified. It's yours.</h1>
            <p className="mt-2 text-sm leading-relaxed text-mist-400">
              Ownership activated after server-side verification — {p?.downloadable ? "your files are ready right below" : p?.type === "website" ? "your site is being provisioned" : "your product is in the dashboard"}.
            </p>

            <div className="mt-6 rounded-xl border border-mist-100/12 bg-ink-800/60 p-4 text-left">
              {order.items.map((it) => (
                <div key={it.productId} className="flex items-center justify-between py-1.5 text-[13.5px]">
                  <span className="text-mist-300">{it.name}{it.interval !== "once" && <span className="text-mist-500"> · {it.interval}</span>}</span>
                  <span className="num font-semibold">{money(it.total)}</span>
                </div>
              ))}
              {order.discount > 0 && (
                <div className="flex items-center justify-between py-1.5 text-[13.5px] text-solar-300">
                  <span>Coupon {order.couponCode}</span><span className="num">−{money(order.discount)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-mist-100/10 pt-2.5 font-bold">
                <span>Total paid</span><span className="num text-pulse-300">{money(order.total)}</span>
              </div>
            </div>

            {/* instant file delivery */}
            {p?.downloadable && p.files.length > 0 && (
              <div className="mt-5 rounded-xl border border-pulse-400/30 bg-pulse-400/[0.05] p-4 text-left">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-pulse-300">
                    <I name="download" size={14} /> Your files are unlocked · {p.files.length}
                  </p>
                  <Btn size="sm" variant="soft" icon="download" loading={allBusy} onClick={() => dlAll(p.files)}>
                    {allBusy ? "Delivering…" : "Download all"}
                  </Btn>
                </div>
                <div className="divide-y divide-mist-100/8">
                  {p.files.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-mist-100/12 bg-ink-900 text-mist-400"><I name="file" size={14} /></span>
                      <span className="num min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold text-mist-200">{f.name}</span>
                      <span className="hidden text-[10.5px] text-mist-500 sm:block">{f.type} · {f.size}</span>
                      <Btn size="sm" variant="outline" loading={dlKey === f.id} onClick={() => dlOne(f)}>
                        {dlKey === f.id ? "Signing URL…" : "Get file"}
                      </Btn>
                    </div>
                  ))}
                </div>
                {p.downloadNote && (
                  <p className="mt-3 rounded-lg border border-wave-400/30 bg-wave-400/8 px-3.5 py-2.5 text-left text-[12px] leading-relaxed text-mist-300">
                    <b className="text-wave-300">From the team:</b> {p.downloadNote}
                  </p>
                )}
                <ol className="mt-3 space-y-1.5 text-left text-[11.5px] leading-relaxed text-mist-500">
                  <li className="flex gap-2"><span className="num font-bold text-pulse-300">1.</span> Files unlock the moment payment is verified — right here, and forever in your dashboard.</li>
                  <li className="flex gap-2"><span className="num font-bold text-pulse-300">2.</span> Every click issues a signed URL after an ownership check; paid files are never public.</li>
                  <li className="flex gap-2"><span className="num font-bold text-pulse-300">3.</span> Future updates land in Dashboard → Downloads, free.</li>
                </ol>
              </div>
            )}

            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              <Link to="/dashboard"><Btn className="w-full" icon="grid">Open dashboard</Btn></Link>
              {p?.downloadable
                ? <Link to="/dashboard/downloads"><Btn variant="outline" className="w-full" icon="download">Go to downloads</Btn></Link>
                : <Link to="/products"><Btn variant="outline" className="w-full" icon="arrowR">Keep browsing</Btn></Link>}
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  if (!cart || !product) {
    return (
      <div className="container-x py-20">
        <EmptyState icon="cart" title="Your cart is empty" body="Pick a product from the catalog — it'll wait for you here." action={<Link to="/products"><Btn icon="arrowR">Browse products</Btn></Link>} />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="container-x py-20">
        <EmptyState icon="lock" title="Log in to check out" body={`Your cart is saved — ${product.name} will still be here after you log in or create an account.`}
          action={<div className="flex gap-3"><Link to="/login?next=/checkout"><Btn icon="key">Log in</Btn></Link><Link to="/register?next=/checkout"><Btn variant="outline">Create account</Btn></Link></div>} />
      </div>
    );
  }

  if (ownedBase && addons.length === 0) {
    return (
      <div className="container-x py-20">
        <EmptyState icon="check" title={`You already own ${product.name}`}
          body="The base product is never charged twice. Stack compatible add-ons on it instead — billing stays separate."
          action={<Link to={`/products/${product.slug}`}><Btn icon="plus">Choose add-ons</Btn></Link>} />
      </div>
    );
  }

  return (
    <div className="container-x py-12">
      <div className="mb-8 flex items-center gap-3">
        {(["review", "pay"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <span className={`grid size-8 place-items-center rounded-full border text-[13px] font-bold transition-colors ${step === s ? "border-pulse-400 bg-pulse-400 text-ink-950" : "border-mist-100/20 text-mist-500"}`}>{i + 1}</span>
            <span className={`text-sm font-semibold ${step === s ? "text-mist-100" : "text-mist-500"}`}>{s === "review" ? "Review order" : "Payment"}</span>
            {i === 0 && <span className="h-px w-10 bg-mist-100/15" />}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {step === "review" ? (
            <Reveal>
              <div className="card overflow-hidden">
                <div className="flex items-center gap-5 border-b border-mist-100/10 p-5">
                  <img src={product.image} alt={product.name} className="h-20 w-28 rounded-lg border border-mist-100/12 object-cover object-top" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mist-500">{TYPE_META[product.type].label}{!ownedBase && cart.interval !== "once" && ` · ${cart.interval}`}</p>
                    <h2 className="truncate font-display text-lg font-bold tracking-tight">{product.name}</h2>
                    {ownedBase ? (
                      <p className="mt-0.5"><Badge tone="pulse" dot>Owned — base not charged</Badge></p>
                    ) : (
                      <p className="num mt-0.5 text-sm text-mist-300">{money(unit)}{cart.interval !== "once" && <span className="text-mist-500"> /{cart.interval === "monthly" ? "mo" : "yr"}</span>}</p>
                    )}
                  </div>
                  <button onClick={() => { setCart(null); nav("/products"); }} className="shrink-0 rounded-lg p-2 text-mist-500 transition-colors hover:bg-flare-500/10 hover:text-flare-300" aria-label="Remove from cart">
                    <I name="trash" size={17} />
                  </button>
                </div>
                {addons.length > 0 && (
                  <div className="border-b border-mist-100/10 p-5">
                    <p className="mb-3 text-[11.5px] font-bold uppercase tracking-wider text-mist-500">Add-ons · {addons.length}</p>
                    <div className="space-y-2.5">
                      {addons.map((a) => (
                        <div key={a.id} className="flex items-center gap-3.5 rounded-lg border border-mist-100/10 bg-ink-800/60 px-4 py-3">
                          <I name={a.icon} size={17} className="text-solar-300" />
                          <span className="flex-1 text-sm font-semibold">{a.name}</span>
                          <span className="num text-sm text-mist-300">{money(a.price)}<span className="text-mist-500">{a.interval === "monthly" ? " /mo" : ""}</span></span>
                          <button onClick={() => setCart({ ...cart, addonIds: cart.addonIds.filter((x) => x !== a.id) })} className="text-mist-500 hover:text-flare-300" aria-label={`Remove ${a.name}`}>
                            <I name="close" size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-mist-500">Coupon</p>
                  <div className="flex gap-2.5">
                    <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="WELCOME10"
                      className="num flex-1 rounded-lg border border-mist-100/12 bg-ink-800 px-3.5 py-2.5 text-sm uppercase tracking-widest text-mist-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-mist-500 outline-none focus:border-pulse-400/60" />
                    <Btn variant="soft" loading={couponBusy} onClick={applyCoupon} icon="tag">Apply</Btn>
                  </div>
                  {couponErr && <p className="mt-2 flex items-center gap-2 text-[12.5px] text-flare-300"><I name="alert" size={13} /> {couponErr}</p>}
                  {coupon && <p className="mt-2 flex items-center gap-2 text-[12.5px] text-pulse-300"><I name="check" size={13} /> {coupon.code} applied — you save {money(coupon.discount)}</p>}
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-mist-100/10 bg-ink-900/70 px-5 py-3.5 text-[12.5px] text-mist-400">
                <I name="shield" size={16} className="shrink-0 text-pulse-400" />
                Demo checkout: payment is simulated, but totals are recomputed server-side and ownership only activates after verification — never from the frontend alone.
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <div className="card p-6">
                <p className="mb-4 text-[11.5px] font-bold uppercase tracking-wider text-mist-500">Payment method</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[{ id: "Card", icon: "card", t: "Card", b: "Visa · Mastercard · Meeza" }, { id: "Wallet", icon: "wallet", t: "Wallet", b: "Vodafone Cash · Fawry" }].map((m) => (
                    <button key={m.id} onClick={() => setMethod(m.id)} aria-pressed={method === m.id}
                      className={`flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${method === m.id ? "border-pulse-400/60 bg-pulse-400/[0.08]" : "border-mist-100/12 hover:border-mist-100/30"}`}>
                      <span className={`grid size-10 place-items-center rounded-lg border ${method === m.id ? "border-pulse-400/50 text-pulse-300" : "border-mist-100/12 text-mist-400"}`}><I name={m.icon} size={18} /></span>
                      <span>
                        <span className="block font-display text-[15px] font-semibold">{m.t}</span>
                        <span className="text-[12px] text-mist-500">{m.b}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {method === "Card" && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                    <label className="block sm:col-span-3"><span className="mb-1.5 block text-[12.5px] font-semibold text-mist-300">Card number</span>
                      <input placeholder="4242 4242 4242 4242" className="num w-full rounded-lg border border-mist-100/12 bg-ink-800 px-3.5 py-2.5 text-sm text-mist-100 outline-none focus:border-pulse-400/60" /></label>
                    <label className="block"><span className="mb-1.5 block text-[12.5px] font-semibold text-mist-300">Expiry</span>
                      <input placeholder="12/28" className="num w-full rounded-lg border border-mist-100/12 bg-ink-800 px-3.5 py-2.5 text-sm text-mist-100 outline-none focus:border-pulse-400/60" /></label>
                    <label className="block"><span className="mb-1.5 block text-[12.5px] font-semibold text-mist-300">CVC</span>
                      <input placeholder="123" className="num w-full rounded-lg border border-mist-100/12 bg-ink-800 px-3.5 py-2.5 text-sm text-mist-100 outline-none focus:border-pulse-400/60" /></label>
                    <label className="block"><span className="mb-1.5 block text-[12.5px] font-semibold text-mist-300">Name on card</span>
                      <input placeholder={me.name} className="w-full rounded-lg border border-mist-100/12 bg-ink-800 px-3.5 py-2.5 text-sm text-mist-100 outline-none focus:border-pulse-400/60" /></label>
                  </div>
                )}
                {payErr && <p className="mt-4 flex items-start gap-2 rounded-lg border border-flare-500/35 bg-flare-500/8 px-3.5 py-2.5 text-[13px] text-flare-300"><I name="alert" size={14} className="mt-0.5 shrink-0" /> {payErr}</p>}
                <p className="mt-4 flex items-center gap-2 text-[11.5px] text-mist-500"><I name="lock" size={13} className="text-pulse-400" /> No real charge is made — this demo verifies the flow, not your wallet.</p>
              </div>
            </Reveal>
          )}
        </div>

        {/* summary */}
        <div>
          <Reveal delay={0.08}>
            <div className="card sticky top-24 p-6">
              <h3 className="font-display text-lg font-bold tracking-tight">Order summary</h3>
              <div className="mt-4 space-y-2.5 text-sm">
                {ownedBase ? (
                  <div className="flex justify-between text-mist-500"><span>{product.name} <Badge tone="pulse" className="ml-1">owned</Badge></span><span className="num">—</span></div>
                ) : (
                  <div className="flex justify-between text-mist-300"><span>{product.name}{cart.interval !== "once" && <span className="text-mist-500"> · {cart.interval}</span>}</span><span className="num">{money(unit)}</span></div>
                )}
                {addons.map((a) => <div key={a.id} className="flex justify-between text-mist-400"><span>{a.name}{a.interval === "monthly" && <span className="text-mist-500"> /mo</span>}</span><span className="num">{money(a.price)}</span></div>)}
                <div className="flex justify-between border-t border-mist-100/10 pt-2.5 text-mist-300"><span>Subtotal</span><span className="num">{money(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-solar-300"><span>Discount ({coupon?.code})</span><span className="num">−{money(discount)}</span></div>}
                <div className="flex justify-between border-t border-mist-100/10 pt-3 text-base font-bold">
                  <span>Total{ownedBase && addonMonthly && <span className="text-[12px] font-medium text-mist-500"> /mo</span>}{!ownedBase && cart.interval !== "once" && <span className="text-[12px] font-medium text-mist-500"> /{cart.interval === "monthly" ? "mo" : "yr"}</span>}</span>
                  <span className="num text-pulse-300">{money(total)}</span>
                </div>
              </div>
              {step === "review" ? (
                <Btn size="lg" className="mt-6 w-full" icon="arrowR" onClick={() => setStep("pay")}>Continue to payment</Btn>
              ) : (
                <div className="mt-6 grid gap-2.5">
                  <Btn size="lg" className="w-full" icon="bolt" loading={paying} onClick={pay}>{paying ? "Verifying payment…" : `Pay ${money(total)}`}</Btn>
                  <Btn variant="ghost" onClick={() => setStep("review")}>Back to review</Btn>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
