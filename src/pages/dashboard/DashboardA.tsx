import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useStore } from "../../lib/store";
import { TYPE_META } from "../../lib/seed";
import { I, Logo } from "../../components/icons";
import { Avatar, Badge, Btn, Drawer, EmptyState, fmtDate, money, StatusBadge, timeAgo, useNoIndex, usePageTitle } from "../../components/ui";
import { Reveal, Stagger, StaggerItem, StaggerNow, StaggerItemNow } from "../../lib/motion";
import { TypeBadge } from "../../components/product";
import { AttachAddonModal } from "../../components/AttachAddon";
import type { Addon } from "../../lib/types";

/* ------------------------------- shell ------------------------------- */

const NAV = [
  { to: "/dashboard", icon: "gauge", label: "Overview", end: true },
  { to: "/dashboard/products", icon: "box", label: "Products" },
  { to: "/dashboard/websites", icon: "globe", label: "Websites" },
  { to: "/dashboard/systems", icon: "cpu", label: "Systems" },
  { to: "/dashboard/digital-products", icon: "package", label: "Digital Products" },
  { to: "/dashboard/addons", icon: "spark", label: "Add-ons" },
  { to: "/dashboard/orders", icon: "receipt", label: "Orders" },
  { to: "/dashboard/subscriptions", icon: "refresh", label: "Subscriptions" },
  { to: "/dashboard/billing", icon: "card", label: "Billing" },
  { to: "/dashboard/downloads", icon: "download", label: "Downloads" },
  { to: "/dashboard/support", icon: "headset", label: "Support" },
  { to: "/dashboard/settings", icon: "settings", label: "Settings" },
];

export function DashShell({ children, title, sub, actions }: { children: ReactNode; title: string; sub?: string; actions?: ReactNode }) {
  useNoIndex();
  const { me, state } = useStore();
  const [mobile, setMobile] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const unread = state.notifications.filter((n) => n.userId === me?.id && !n.read).length;

  const links = (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end}
          className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 ${isActive ? "bg-pulse-400/12 text-pulse-300 shadow-[inset_2px_0_0_0_var(--color-pulse-400)]" : "text-mist-400 hover:bg-ink-800 hover:text-mist-100"}`}>
          <I name={n.icon} size={17} className="transition-transform duration-200 group-hover:scale-110" /> {n.label}
          {n.to === "/dashboard/support" && unread > 0 && <span className="num ml-auto rounded bg-pulse-400/15 px-1.5 text-[10.5px] text-pulse-300">{unread}</span>}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-mist-100/10 bg-ink-900/97 lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
          <Logo size={28} /><span className="font-display text-[17px] font-bold tracking-tight">Livo<span className="text-pulse-400">Tech</span></span>
          <Badge tone="pulse" className="ml-auto !px-1.5 !text-[9.5px]">APP</Badge>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 pb-4">{links}</div>
        <div className="border-t border-mist-100/10 p-4">
          <Link to="/products" className="group flex items-center gap-3 rounded-lg border border-dashed border-mist-100/20 px-3.5 py-3 text-[13px] font-semibold text-mist-400 transition-colors hover:border-pulse-400/50 hover:text-pulse-300">
            <I name="plus" size={16} /> Add another product
          </Link>
        </div>
      </aside>

      <Drawer open={mobile} onClose={() => setMobile(false)} title={<span className="flex items-center gap-2"><Logo size={22} /> Dashboard</span>}>
        {links}
      </Drawer>

      <header className="sticky top-0 z-30 border-b border-mist-100/10 bg-ink-950/88 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 py-3.5 sm:px-8">
          <button onClick={() => setMobile(true)} className="grid size-9 place-items-center rounded-lg border border-mist-100/12 text-mist-300 lg:hidden" aria-label="Open navigation">
            <I name="menu" size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[17px] font-bold tracking-tight">{title}</h1>
            {sub && <p className="hidden truncate text-[12px] text-mist-500 sm:block">{sub}</p>}
          </div>
          <form
            className="relative hidden md:block"
            onSubmit={(e) => { e.preventDefault(); if (q.trim()) { nav(`/products?q=${encodeURIComponent(q.trim())}`); setQ(""); } }}
            role="search"
          >
            <I name="search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the catalog…"
              className="w-56 rounded-lg border border-mist-100/12 bg-ink-900 py-2 pl-9 pr-3 text-[13px] text-mist-100 outline-none transition-all placeholder:text-mist-500 focus:w-72 focus:border-pulse-400/60" />
          </form>
          {actions}
          <Link to="/dashboard/support" className="relative grid size-9 place-items-center rounded-lg border border-mist-100/12 text-mist-300 transition-colors hover:border-pulse-400/50 hover:text-pulse-300" aria-label={`Support, ${unread} unread notifications`}>
            <I name="bell" size={16} />
            {unread > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-solar-400 text-[9.5px] font-bold text-ink-950">{unread}</span>}
          </Link>
          {me && <Link to="/dashboard/settings" className="flex items-center gap-2.5"><Avatar name={me.name} size={32} /><span className="hidden text-left sm:block"><span className="block max-w-[110px] truncate text-[12.5px] font-semibold leading-tight">{me.name}</span><span className="block text-[10px] uppercase tracking-wider text-mist-500">Customer</span></span></Link>}
        </div>
      </header>

      <main className="px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}

/* ------------------------------- overview ------------------------------- */

export function OverviewPage() {
  usePageTitle("Dashboard");
  const { me, state } = useStore();
  const mine = state.ownerships.filter((o) => o.customerId === me?.id);
  const activeMine = mine.filter((o) => o.status === "active");
  const subs = state.subscriptions.filter((s) => s.customerId === me?.id && s.status === "active");
  const orders = state.orders.filter((o) => o.customerId === me?.id);
  const availableFiles = activeMine.flatMap((o) => state.products.find((p) => p.id === o.productId)?.files ?? []);
  const notifs = state.notifications.filter((n) => n.userId === me?.id).slice(0, 6);
  const recentOwned = [...mine].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt)).slice(0, 4);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = [
    { icon: "box", label: "Active products", val: activeMine.length, to: "/dashboard/products", tone: "text-pulse-300 border-pulse-400/30 bg-pulse-400/10" },
    { icon: "refresh", label: "Active subscriptions", val: subs.length, to: "/dashboard/subscriptions", tone: "text-wave-300 border-wave-400/30 bg-wave-400/10" },
    { icon: "receipt", label: "Total orders", val: orders.length, to: "/dashboard/orders", tone: "text-solar-300 border-solar-400/30 bg-solar-400/10" },
    { icon: "download", label: "Available downloads", val: availableFiles.length, to: "/dashboard/downloads", tone: "text-flare-300 border-flare-500/30 bg-flare-500/10" },
  ];

  return (
    <DashShell title="Overview" sub="Your collection at a glance">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-mist-100/12 bg-gradient-to-br from-ink-900 via-ink-850 to-ink-800 p-7">
            <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_120%_at_20%_0%,black,transparent)]" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow mb-2">{greet}, {me?.name.split(" ")[0]}</p>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Your ecosystem is <span className="text-pulse-400">alive</span></h2>
                <p className="mt-1.5 max-w-md text-[13.5px] text-mist-400">{activeMine.length} active product{activeMine.length === 1 ? "" : "s"}, {subs.length} running subscription{subs.length === 1 ? "" : "s"} — expand any time with linked add-ons.</p>
              </div>
              <div className="flex gap-2.5">
                <Link to="/products"><Btn icon="plus">Add product</Btn></Link>
                <Link to="/dashboard/addons"><Btn variant="outline" icon="spark">Attach add-on</Btn></Link>
              </div>
            </div>
          </div>
        </Reveal>

        <StaggerNow className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItemNow key={s.label}>
              <Link to={s.to} className="card card-hover group p-5">
                <span className={`mb-3 grid size-10 place-items-center rounded-lg border ${s.tone}`}><I name={s.icon} size={17} /></span>
                <p className="num text-3xl font-bold">{s.val}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-mist-500">{s.label}</p>
              </Link>
            </StaggerItemNow>
          ))}
        </StaggerNow>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold tracking-tight">Recently purchased</h3>
              <Link to="/dashboard/products" className="text-[12.5px] font-semibold text-pulse-300">All products</Link>
            </div>
            {recentOwned.length === 0 ? (
              <EmptyState icon="box" title="You haven't purchased any products yet" body="Browse the catalog — everything you buy lands here instantly."
                action={<Link to="/products"><Btn icon="arrowR">Browse products</Btn></Link>} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {recentOwned.map((o) => {
                  const p = state.products.find((x) => x.id === o.productId);
                  if (!p) return null;
                  const sub = o.subscriptionId ? state.subscriptions.find((s) => s.id === o.subscriptionId) : undefined;
                  return (
                    <Reveal key={o.id}>
                      <Link to={`/products/${p.slug}`} className="card card-hover group flex gap-4 p-4">
                        <img src={p.image} alt="" className="h-16 w-20 shrink-0 rounded-lg border border-mist-100/12 object-cover object-top" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-display text-[15px] font-bold">{p.name}</h4>
                            <StatusBadge status={o.status} />
                          </div>
                          <p className="mt-0.5 text-[11.5px] text-mist-500">{TYPE_META[p.type].label}{sub ? ` · renews ${fmtDate(sub.nextBillingAt)}` : p.downloadable ? " · files ready" : ""}</p>
                          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-pulse-300 opacity-0 transition-opacity group-hover:opacity-100">Open <I name="arrowR" size={12} /></p>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-4 font-display text-lg font-bold tracking-tight">Recent activity</h3>
            <div className="card divide-y divide-mist-100/8">
              {notifs.length === 0 && <p className="px-5 py-8 text-center text-[13px] text-mist-500">Quiet so far — purchases and updates show up here.</p>}
              {notifs.map((n) => (
                <div key={n.id} className={`flex gap-3 px-5 py-3.5 ${n.read ? "opacity-60" : ""}`}>
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-mist-100/20" : "bg-pulse-400"}`} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-mist-400">{n.body}</p>
                    <p className="mt-1 text-[10.5px] text-mist-500">{timeAgo(n.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashShell>
  );
}

/* ---------------------------- owned products ---------------------------- */

export function OwnedProductsPage({ filterType }: { filterType?: "website" | "system" }) {
  usePageTitle(filterType === "website" ? "My websites" : filterType === "system" ? "My systems" : "My products");
  const { me, state } = useStore();
  const mine = state.ownerships
    .filter((o) => o.customerId === me?.id)
    .map((o) => ({ o, p: state.products.find((p) => p.id === o.productId) }))
    .filter((x): x is { o: (typeof state.ownerships)[number]; p: NonNullable<(typeof state.products)[number]> } => !!x.p && (!filterType || x.p.type === filterType))
    .sort((a, b) => b.o.purchasedAt.localeCompare(a.o.purchasedAt));

  const emptyCopy = filterType === "website"
    ? { t: "No websites yet", b: "Buy a ready-made website and it's provisioned under your account within days.", to: "/products?type=website", cta: "Browse websites" }
    : filterType === "system"
      ? { t: "No systems yet", b: "POS and inventory systems subscribe monthly or yearly — manage them all here.", to: "/products?type=system", cta: "Browse systems" }
      : { t: "You haven't purchased any products yet", b: "Websites, systems, SaaS and downloads — everything lives in one collection.", to: "/products", cta: "Browse products" };

  return (
    <DashShell title={filterType === "website" ? "Websites" : filterType === "system" ? "Systems" : "Products"} sub="Everything you own, in one place">
      <div className="mx-auto max-w-6xl">
        {mine.length === 0 ? (
          <EmptyState icon={filterType === "website" ? "globe" : filterType === "system" ? "cpu" : "box"} title={emptyCopy.t} body={emptyCopy.b}
            action={<Link to={emptyCopy.to}><Btn icon="arrowR">{emptyCopy.cta}</Btn></Link>} />
        ) : (
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map(({ o, p }) => {
              const sub = o.subscriptionId ? state.subscriptions.find((s) => s.id === o.subscriptionId) : undefined;
              const site = state.websites.find((w) => w.customerId === me?.id && w.productId === p.id);
              return (
                <StaggerItem key={o.id} className="h-full">
                  <div className="card card-hover flex h-full flex-col overflow-hidden">
                    <div className="relative aspect-[3/2] overflow-hidden border-b border-mist-100/8">
                      <img src={p.image} alt="" className="h-full w-full object-cover object-top" />
                      <div className="absolute left-3 top-3 flex gap-1.5"><TypeBadge type={p.type} /><StatusBadge status={o.status} /></div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-[16px] font-bold tracking-tight">{p.name}</h3>
                      <p className="num mt-1 text-[11.5px] text-mist-500">Purchased {fmtDate(o.purchasedAt)}{sub ? ` · ${sub.plan}` : p.downloadable ? " · downloadable" : ""}</p>
                      {sub && sub.status === "active" && <p className="mt-2 rounded-md bg-wave-400/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-wave-300">Renews {fmtDate(sub.nextBillingAt)}</p>}
                      {site && <p className="num mt-2 truncate text-[11.5px] text-mist-500">{site.domain}</p>}
                      <div className="mt-auto flex gap-2 pt-4">
                        {p.downloadable ? (
                          <Link to="/dashboard/downloads"><Btn size="sm" variant="outline" icon="download">Downloads</Btn></Link>
                        ) : (
                          <Link to={`/products/${p.slug}`}><Btn size="sm" variant="outline" icon="eye">View product</Btn></Link>
                        )}
                        <Link to={`/products/${p.slug}`}><Btn size="sm" variant="ghost" icon="plus">Add-ons</Btn></Link>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </DashShell>
  );
}

/* ------------------------------- websites ------------------------------- */

export function WebsitesPage() {
  usePageTitle("My websites");
  const { me, state } = useStore();
  const mine = state.websites.filter((w) => w.customerId === me?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <DashShell title="Websites" sub="Deployed sites, domains and status">
      <div className="mx-auto max-w-5xl">
        {mine.length === 0 ? (
          <EmptyState icon="globe" title="No websites deployed yet" body="Buy a website product and its deployment appears here with domain, URL and plan."
            action={<Link to="/products?type=website"><Btn icon="arrowR">Browse websites</Btn></Link>} />
        ) : (
          <div className="space-y-4">
            {mine.map((w) => {
              const p = state.products.find((x) => x.id === w.productId);
              const addonCount = state.customerAddons.filter((ca) => ca.customerId === me?.id && ca.attachedProductId === w.productId && ca.status === "active").length;
              return (
                <Reveal key={w.id}>
                  <div className="card flex flex-wrap items-center gap-5 p-5">
                    {p && <img src={p.image} alt="" className="h-14 w-20 rounded-lg border border-mist-100/12 object-cover object-top" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-[15.5px] font-bold">{w.name}</h3>
                        <StatusBadge status={w.status} />
                        {addonCount > 0 && <Badge tone="solar">{addonCount} add-on{addonCount > 1 ? "s" : ""}</Badge>}
                      </div>
                      <p className="num mt-1 text-[12px] text-mist-400">{w.url}</p>
                      <p className="mt-0.5 text-[11.5px] text-mist-500">{w.plan} · deployed {fmtDate(w.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={w.url} target="_blank" rel="noreferrer"><Btn size="sm" variant="outline" icon="external">Visit</Btn></a>
                      {p && <Link to={`/products/${p.slug}`}><Btn size="sm" variant="ghost" icon="plus">Add-ons</Btn></Link>}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </DashShell>
  );
}

/* --------------------------- digital products --------------------------- */

export function DigitalOwnedPage() {
  usePageTitle("My digital products");
  const { me, state } = useStore();
  const mine = state.ownerships
    .filter((o) => o.customerId === me?.id && o.status !== "cancelled")
    .map((o) => state.products.find((p) => p.id === o.productId))
    .filter((p): p is NonNullable<typeof p> => !!p && p.downloadable);
  return (
    <DashShell title="Digital Products" sub="Templates, kits and e-books you own">
      <div className="mx-auto max-w-5xl">
        {mine.length === 0 ? (
          <EmptyState icon="package" title="No digital products yet" body="Templates, UI kits and e-books unlock instantly after purchase."
            action={<Link to="/digital-products"><Btn icon="arrowR">Browse digital products</Btn></Link>} />
        ) : (
          <div className="space-y-4">
            {mine.map((p) => {
              const dls = state.downloads.filter((d) => d.userId === me?.id && d.productId === p.id).length;
              return (
                <Reveal key={p.id}>
                  <div className="card flex flex-wrap items-center gap-5 p-5">
                    <img src={p.image} alt="" className="h-14 w-20 rounded-lg border border-mist-100/12 object-cover object-top" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-[15.5px] font-bold">{p.name}</h3><TypeBadge type={p.type} /></div>
                      <p className="mt-1 text-[12px] text-mist-500">v{p.version} · {p.files.length} files · {dls} download{dls === 1 ? "" : "s"} so far</p>
                    </div>
                    <Link to="/dashboard/downloads"><Btn size="sm" icon="download">Get files</Btn></Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </DashShell>
  );
}

/* -------------------------------- add-ons -------------------------------- */

export function AddonsOwnedPage() {
  usePageTitle("My add-ons");
  const { me, state } = useStore();
  const [attaching, setAttaching] = useState<Addon | null>(null);
  const mine = state.customerAddons.filter((ca) => ca.customerId === me?.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const catalog = state.addons.filter((a) => a.active);

  return (
    <DashShell title="Add-ons" sub="Modules stacked on your products">
      <div className="mx-auto max-w-6xl space-y-10">
        <section>
          <h3 className="mb-4 font-display text-lg font-bold tracking-tight">Your add-ons</h3>
          {mine.length === 0 ? (
            <EmptyState icon="spark" title="No add-ons attached yet" body="Loyalty, delivery, coupons and more — attach modules to products you own, billed separately." />
          ) : (
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((ca) => {
                const a = state.addons.find((x) => x.id === ca.addonId);
                if (!a) return null;
                return (
                  <StaggerItem key={ca.id} className="h-full">
                    <div className="card card-hover flex h-full flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid size-11 place-items-center rounded-xl border border-solar-400/30 bg-solar-400/10 text-solar-300"><I name={a.icon} size={19} /></span>
                        <StatusBadge status={ca.status} />
                      </div>
                      <h4 className="mt-3.5 font-display text-[15.5px] font-bold">{a.name}</h4>
                      <p className="mt-0.5 text-[12px] text-mist-500">on <span className="font-semibold text-mist-300">{ca.attachedProductName}</span></p>
                      <div className="num mt-3 grid grid-cols-2 gap-2 text-[12px] text-mist-400">
                        <span>Price<br /><b className="text-[14px] text-mist-100">{money(ca.price)}{ca.interval === "monthly" ? "/mo" : ""}</b></span>
                        <span>{ca.renewsAt ? "Renews" : "Since"}<br /><b className="text-[12.5px] text-mist-100">{fmtDate(ca.renewsAt ?? ca.startedAt)}</b></span>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold tracking-tight">Attach a new add-on</h3>
              <p className="text-[12.5px] text-mist-500">Only modules linked to products you own can be attached — compatibility is managed by our team.</p>
            </div>
            <Link to="/addons" className="text-[12.5px] font-semibold text-pulse-300">Browse the full add-on catalog</Link>
          </div>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((a) => (
              <StaggerItem key={a.id} className="h-full">
                <div className="card card-hover flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-xl border border-mist-100/12 bg-ink-800 text-solar-300"><I name={a.icon} size={19} /></span>
                    <span className="num text-[14px] font-bold">{money(a.price)}<span className="text-[10.5px] font-medium text-mist-500">{a.interval === "monthly" ? "/mo" : ""}</span></span>
                  </div>
                  <h4 className="mt-3 font-display text-[15px] font-bold">{a.name}</h4>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-mist-400">{a.description}</p>
                  <p className="mt-2 text-[11px] font-semibold text-mist-500">Linked to {a.productIds.length} product{a.productIds.length === 1 ? "" : "s"}</p>
                  <div className="mt-auto pt-3.5">
                    <Btn size="sm" variant="outline" icon="plus" className="w-full" onClick={() => setAttaching(a)}>Attach to a product</Btn>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </div>
      <AttachAddonModal addon={attaching} onClose={() => setAttaching(null)} />
    </DashShell>
  );
}
