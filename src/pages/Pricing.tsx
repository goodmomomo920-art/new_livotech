import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { TYPE_META } from "../lib/seed";
import { I } from "../components/icons";
import { Badge, money, SectionHead, usePageTitle } from "../components/ui";
import { Reveal, Stagger, StaggerItem } from "../lib/motion";
import { AddonCard, TypeBadge } from "../components/product";
import { AttachAddonCta, AttachAddonModal } from "../components/AttachAddon";
import type { Addon, ProductType } from "../lib/types";

export function PricingPage() {
  usePageTitle("Pricing");
  const { state } = useStore();
  const [yearly, setYearly] = useState(false);
  const active = state.products.filter((p) => p.active);
  const subs = active.filter((p) => p.billing === "subscription");
  const oneTime = active.filter((p) => p.billing === "once");

  return (
    <div>
      <section className="relative border-b border-mist-100/8 bg-ink-900/60 py-16">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(70%_90%_at_50%_0%,black,transparent)]" />
        <div className="container-x relative">
          <Reveal>
            <p className="eyebrow mb-3 flex items-center gap-2.5"><span className="inline-block h-px w-7 bg-pulse-400/70" />Pricing</p>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Honest prices, <span className="text-pulse-400">two</span> simple models</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mist-400">Own it forever with a one-time purchase, or subscribe and keep updates flowing. Every price below comes straight from the live catalog.</p>
          </Reveal>
          <div className="mt-8 flex w-fit items-center gap-1 rounded-lg border border-mist-100/12 bg-ink-900 p-1">
            {(["monthly", "yearly"] as const).map((m) => (
              <button key={m} onClick={() => setYearly(m === "yearly")} aria-pressed={yearly === (m === "yearly")}
                className={`rounded-md px-5 py-2 text-[13px] font-semibold capitalize transition-all ${yearly === (m === "yearly") ? "bg-pulse-400 text-ink-950" : "text-mist-400 hover:text-mist-200"}`}>
                {m}{m === "yearly" && <span className="ml-1.5 text-[10.5px] opacity-80">save ~17%</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-14">
        <SectionHead eyebrow="Subscriptions" title="Systems & SaaS, billed your way" sub="Cancel any time — access continues until the period ends." />
        <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {subs.map((p) => {
            const mo = p.monthlyPrice ?? p.price;
            const yr = p.yearlyPrice ?? mo * 12;
            const shown = yearly ? Math.round(yr / 12) : mo;
            return (
              <StaggerItem key={p.id} className="h-full">
                <div className="card card-hover sheen flex h-full flex-col p-6">
                  <div className="flex items-start justify-between">
                    <TypeBadge type={p.type} />
                    {p.featured && <Badge tone="solar">Popular</Badge>}
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-[13px] text-mist-400">{p.tagline}</p>
                  <p className="num mt-5 text-4xl font-bold">
                    {money(shown, p.currency)}<span className="text-sm font-medium text-mist-500"> /mo</span>
                  </p>
                  <p className="num mt-1 text-[12px] text-mist-500">
                    {yearly ? `${money(yr, p.currency)} billed yearly` : `or ${money(yr, p.currency)}/yr — save ${money(mo * 12 - yr, p.currency)}`}
                  </p>
                  <ul className="mt-5 space-y-2 text-[13px] text-mist-300">
                    {p.features.slice(0, 4).map((f) => <li key={f} className="flex gap-2"><I name="check" size={13} className="mt-0.5 shrink-0 text-pulse-400" />{f}</li>)}
                  </ul>
                  <Link to={`/products/${p.slug}`} className="group mt-auto flex items-center justify-between rounded-lg border border-mist-100/18 px-4 py-2.5 text-sm font-semibold transition-all hover:border-pulse-400/60 hover:text-pulse-300" style={{ marginTop: "auto", paddingTop: "1.25rem" }}>
                    View details <I name="arrowR" size={15} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="border-t border-mist-100/8 bg-ink-900/60 py-14">
        <div className="container-x">
          <SectionHead eyebrow="One-time" title="Own it forever" sub="Websites and digital products — pay once, it's yours, updates included where noted." />
          <div className="overflow-x-auto rounded-xl border border-mist-100/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11.5px] uppercase tracking-wider text-mist-500">
                  <th className="px-5 py-3.5 font-semibold">Product</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">Price</th>
                  <th className="px-5 py-3.5 font-semibold">Delivery</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {oneTime.map((p) => (
                  <tr key={p.id} className="border-b border-mist-100/6 transition-colors hover:bg-ink-800/50">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <img src={p.image} alt="" className="h-9 w-12 rounded-md border border-mist-100/12 object-cover object-top" />
                        <span>
                          <span className="block font-display font-semibold text-mist-100">{p.name}</span>
                          {p.compareAt && <span className="num text-[11px] text-mist-500 line-through">{money(p.compareAt, p.currency)}</span>}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-mist-400">{TYPE_META[p.type].label}</td>
                    <td className="px-5 py-3.5"><span className="num font-bold text-mist-100">{money(p.price, p.currency)}</span></td>
                    <td className="px-5 py-3.5 text-mist-400">{p.downloadable ? "Instant download + guide" : "Deploy in days"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/products/${p.slug}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-pulse-300 hover:text-pulse-400">Details <I name="arrowR" size={13} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-x py-14">
        <SectionHead eyebrow="Add-ons" title="The $5–15/mo growth layer" sub="Attach to anything you own. Billed independently, cancel independently." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {state.addons.filter((a) => a.active).slice(0, 6).map((a) => <AddonCard key={a.id} addon={a} />)}
        </div>
        <div className="mt-8 text-center">
          <Link to="/addons" className="inline-flex items-center gap-2 rounded-xl border border-mist-100/20 px-5 py-2.5 text-sm font-semibold text-mist-200 transition-colors hover:border-pulse-400/60 hover:text-pulse-300">
            See all {state.addons.length} add-ons <I name="arrowR" size={15} />
          </Link>
        </div>
      </section>

      <section className="container-x pb-6">
        <Reveal>
          <div className="card flex flex-col items-start justify-between gap-5 border-solar-400/30 p-7 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-solar-400/40 bg-solar-400/10 text-solar-300"><I name="tag" size={20} /></span>
              <div>
                <h3 className="font-display text-lg font-bold">First order? Take 10% off</h3>
                <p className="mt-1 text-[13.5px] text-mist-400">Apply code <span className="num rounded bg-ink-800 px-1.5 py-0.5 font-bold text-solar-300">WELCOME10</span> at checkout — works on everything, once per customer.</p>
              </div>
            </div>
            <Link to="/products" className="shrink-0 rounded-xl bg-solar-400 px-5 py-2.5 text-sm font-bold text-ink-950 transition-colors hover:bg-solar-300">Start shopping</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export function AddonsPage() {
  usePageTitle("Add-ons");
  const { state } = useStore();
  const [type, setType] = useState<ProductType | "all">("all");
  const [attaching, setAttaching] = useState<Addon | null>(null);
  const list = state.addons.filter((a) => a.active && (type === "all" || a.compat.includes(type)));

  return (
    <div>
      <section className="relative border-b border-mist-100/8 bg-ink-900/60 py-16">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(70%_90%_at_50%_0%,black,transparent)]" />
        <div className="container-x relative">
          <Reveal>
            <p className="eyebrow mb-3 flex items-center gap-2.5"><span className="inline-block h-px w-7 bg-pulse-400/70" />Add-on economy</p>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Plug new powers into products you <span className="text-solar-300">already own</span></h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mist-400">Each add-on is linked by our team to the exact products it supports — pick one you own and it goes straight to your cart.</p>
          </Reveal>
          <div className="mt-8 flex flex-wrap gap-2">
            <Chip active={type === "all"} onClick={() => setType("all")}>All ({state.addons.filter((a) => a.active).length})</Chip>
            {(Object.keys(TYPE_META) as ProductType[]).filter((t) => state.addons.some((a) => a.active && a.compat.includes(t))).map((t) => (
              <Chip key={t} active={type === t} onClick={() => setType(t)} icon={TYPE_META[t].icon}>{TYPE_META[t].plural}</Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <StaggerItem key={a.id} className="h-full">
              <div className="flex h-full flex-col gap-2.5">
                <div className="flex-1"><AddonCard addon={a} /></div>
                <AttachAddonCta addon={a} onAttach={setAttaching} />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="container-x pb-8">
        <SectionHead eyebrow="How it works" title="Three steps to a smarter stack" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: "cart", t: "Own a base product", b: "Any website, system or SaaS from the catalog. One purchase, forever yours (or subscribed)." },
            { icon: "plus", t: "Attach linked add-ons", b: "Compatibility is enforced automatically — the cart only accepts modules linked to your product." },
            { icon: "bolt", t: "They just work", b: "Modules activate with separate billing. Remove them any time without touching the base." },
          ].map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="card relative h-full p-6">
                <span className="num absolute right-5 top-4 text-4xl font-bold text-mist-100/8">0{i + 1}</span>
                <span className="mb-4 grid size-11 place-items-center rounded-xl border border-mist-100/12 bg-ink-800 text-pulse-300"><I name={s.icon} size={19} /></span>
                <h3 className="font-display text-[16px] font-semibold">{s.t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-mist-400">{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <AttachAddonModal addon={attaching} onClose={() => setAttaching(null)} />
    </div>
  );
}

function Chip({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon?: string }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-all ${active ? "border-solar-400/60 bg-solar-400/12 text-solar-300" : "border-mist-100/12 bg-ink-900 text-mist-400 hover:border-mist-100/30 hover:text-mist-200"}`}>
      {icon && <I name={icon} size={14} />} {children}
    </button>
  );
}
