import { useMemo, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useStore } from "../../lib/store";
import { TYPE_META } from "../../lib/seed";
import { I, Logo } from "../../components/icons";
import { Avatar, Badge, Btn, Confirm, Drawer, EmptyState, Field, fmtDate, Modal, money, SearchInput, Select, StatusBadge, TextArea, TextInput, timeAgo, Toggle, useDebounced, useNoIndex, usePageTitle } from "../../components/ui";
import type { Category, PermissionKey, Product, ProductType } from "../../lib/types";

/* ------------------------------- shell ------------------------------- */

const GROUPS: { label: string; items: { to: string; label: string; icon: string; end?: boolean; perm?: PermissionKey }[] }[] = [
  {
    label: "Platform",
    items: [
      { to: "/admin", label: "Overview", icon: "gauge", end: true },
      { to: "/admin/customers", label: "Customers", icon: "users", perm: "customers" },
      { to: "/admin/orders", label: "Orders", icon: "receipt", perm: "orders" },
      { to: "/admin/subscriptions", label: "Subscriptions", icon: "refresh", perm: "subscriptions" },
      { to: "/admin/payments", label: "Payments", icon: "card", perm: "payments" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: "box", perm: "products" },
      { to: "/admin/categories", label: "Categories", icon: "grid", perm: "categories" },
      { to: "/admin/addons", label: "Add-ons", icon: "spark", perm: "addons" },
      { to: "/admin/websites", label: "Websites", icon: "globe", perm: "websites" },
      { to: "/admin/systems", label: "Systems", icon: "cpu", perm: "websites" },
      { to: "/admin/digital-products", label: "Digital Products", icon: "package", perm: "downloads" },
      { to: "/admin/downloads", label: "Downloads", icon: "download", perm: "downloads" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/coupons", label: "Coupons", icon: "tag", perm: "coupons" },
      { to: "/admin/support", label: "Support", icon: "headset", perm: "support" },
      { to: "/admin/content", label: "Content", icon: "file", perm: "content" },
      { to: "/admin/notifications", label: "Notifications", icon: "bell", perm: "notifications" },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/staff", label: "Staff", icon: "users", perm: "staff" },
      { to: "/admin/roles", label: "Roles & Permissions", icon: "shield", perm: "roles" },
      { to: "/admin/settings", label: "Settings", icon: "settings", perm: "settings" },
      { to: "/admin/audit-logs", label: "Audit Logs", icon: "chart", perm: "audit" },
    ],
  },
];

export function Restricted({ perm }: { perm: PermissionKey }) {
  return (
    <div className="mx-auto max-w-md">
      <EmptyState icon="lock" title="Not authorized" body={`Your role doesn't include the “${perm}” permission. Sensitive actions are blocked server-side, not just hidden.`} />
    </div>
  );
}

export function AdminShell({ children, title, sub, actions }: { children: ReactNode; title: string; sub?: string; actions?: ReactNode }) {
  useNoIndex();
  const { me, can } = useStore();
  const [mobile, setMobile] = useState(false);

  const nav = (
    <div className="flex flex-col gap-5">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => !i.perm || can(i.perm) || me?.role === "superadmin");
        if (!items.length) return null;
        return (
          <div key={g.label}>
            <p className="eyebrow !text-mist-500 mb-2 px-3.5">{g.label}</p>
            <nav className="flex flex-col gap-0.5" aria-label={g.label}>
              {items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all ${isActive ? "bg-pulse-400/10 text-pulse-300 shadow-[inset_2px_0_0_0_var(--color-pulse-400)]" : "text-mist-400 hover:bg-ink-800 hover:text-mist-100"}`}>
                  <I name={i.icon} size={16} /> {i.label}
                </NavLink>
              ))}
            </nav>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-950 lg:pl-[236px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-mist-100/10 bg-ink-900/97 lg:flex">
        <Link to="/admin" className="flex items-center gap-2.5 px-5 py-5">
          <Logo size={27} /><span className="font-display text-[16px] font-bold tracking-tight">Livo<span className="text-pulse-400">Tech</span></span>
          <Badge tone="solar" className="ml-auto !px-1.5 !text-[9.5px]">ADMIN</Badge>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 pb-6">{nav}</div>
        <div className="border-t border-mist-100/10 p-3.5">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-100">
            <I name="external" size={14} /> Back to website
          </Link>
        </div>
      </aside>

      {mobile && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-mist-100/50 backdrop-blur-[2px]" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 w-[260px] overflow-y-auto border-r border-mist-100/10 bg-ink-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><Logo size={24} /><b className="font-display">Admin</b></span>
              <button onClick={() => setMobile(false)} aria-label="Close menu"><I name="close" size={18} /></button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-mist-100/10 bg-ink-950/88 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 py-3.5 sm:px-7">
          <button onClick={() => setMobile(true)} className="grid size-9 place-items-center rounded-lg border border-mist-100/12 text-mist-300 lg:hidden" aria-label="Open admin menu"><I name="menu" size={16} /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[16.5px] font-bold tracking-tight">{title}</h1>
            {sub && <p className="hidden truncate text-[11.5px] text-mist-500 sm:block">{sub}</p>}
          </div>
          {actions}
          {me && (
            <span className="flex items-center gap-2.5 rounded-lg border border-mist-100/12 py-1 pl-1 pr-3">
              <Avatar name={me.name} size={28} />
              <span className="hidden text-left sm:block">
                <span className="block max-w-[100px] truncate text-[12px] font-semibold leading-tight">{me.name}</span>
                <span className="block text-[9.5px] font-bold uppercase tracking-wider text-solar-300">{me.role === "superadmin" ? "Super Admin" : "Admin"}</span>
              </span>
            </span>
          )}
        </div>
      </header>
      <main className="px-5 py-7 sm:px-7">{children}</main>
    </div>
  );
}

/* ------------------------------- overview ------------------------------- */

export function AdminOverview() {
  usePageTitle("Admin · Overview");
  const { state } = useStore();
  const paid = state.orders.filter((o) => o.paymentStatus === "paid");
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const customers = state.users.filter((u) => u.role === "customer");
  const openTickets = state.tickets.filter((t) => t.status === "open" || t.status === "in_progress");

  const weeks = useMemo(() => {
    const out: { label: string; total: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = Date.now() - (w + 1) * 7 * 864e5;
      const end = Date.now() - w * 7 * 864e5;
      const total = paid.filter((o) => { const t = new Date(o.createdAt).getTime(); return t > start && t <= end; }).reduce((s, o) => s + o.total, 0);
      out.push({ label: `W${8 - w}`, total });
    }
    return out;
  }, [paid]);
  const maxW = Math.max(1, ...weeks.map((w) => w.total));

  const kpis = [
    { icon: "users", label: "Customers", val: customers.length, to: "/admin/customers", tone: "text-pulse-300 border-pulse-400/45 bg-pulse-400/15" },
    { icon: "refresh", label: "Active subs", val: state.subscriptions.filter((s) => s.status === "active").length, to: "/admin/subscriptions", tone: "text-wave-300 border-wave-400/45 bg-wave-400/15" },
    { icon: "receipt", label: "Orders", val: state.orders.length, to: "/admin/orders", tone: "text-solar-300 border-solar-400/45 bg-solar-400/15" },
    { icon: "card", label: "Revenue", val: money(revenue), to: "/admin/payments", tone: "text-flare-300 border-flare-500/45 bg-flare-500/15" },
    { icon: "box", label: "Live products", val: state.products.filter((p) => p.active).length, to: "/admin/products", tone: "text-pulse-300 border-pulse-400/45 bg-pulse-400/15" },
    { icon: "globe", label: "Websites", val: state.websites.length, to: "/admin/websites", tone: "text-wave-300 border-wave-400/45 bg-wave-400/15" },
    { icon: "download", label: "Downloads", val: state.downloads.length, to: "/admin/downloads", tone: "text-solar-300 border-solar-400/45 bg-solar-400/15" },
    { icon: "headset", label: "Open tickets", val: openTickets.length, to: "/admin/support", tone: "text-flare-300 border-flare-500/45 bg-flare-500/15" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="card card-hover group p-4">
            <span className={`mb-3 grid size-10 place-items-center rounded-lg border ${k.tone}`}><I name={k.icon} size={18} /></span>
            <p className="num text-2xl font-bold text-mist-100">{k.val}</p>
            <p className="mt-0.5 text-[11.5px] font-semibold text-mist-500">{k.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-[16px] font-bold tracking-tight">Revenue · last 8 weeks</h3>
                <p className="text-[11.5px] text-mist-500">Paid orders only, from the live demo dataset</p>
              </div>
              <Badge tone="pulse" dot>{money(revenue)} total</Badge>
            </div>
            <div className="flex h-44 items-end gap-2.5">
              {weeks.map((w, i) => (
                <div key={w.label} className="group flex flex-1 flex-col items-center gap-2">
                  <span className="num text-[10px] text-mist-500 opacity-0 transition-opacity group-hover:opacity-100">{money(w.total)}</span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${i === weeks.length - 1 ? "bg-pulse-400" : "bg-ink-600 group-hover:bg-pulse-500/70"}`}
                    style={{ height: `${Math.max(4, (w.total / maxW) * 130)}px` }}
                    title={`${w.label}: ${money(w.total)}`}
                  />
                  <span className="text-[10px] font-semibold text-mist-500">{w.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card p-6">
            <h3 className="mb-4 font-display text-[16px] font-bold tracking-tight">Needs attention</h3>
            <div className="space-y-3">
              {state.subscriptions.filter((s) => s.status === "past_due").map((s) => {
                const u = state.users.find((x) => x.id === s.customerId);
                return (
                  <Link key={s.id} to="/admin/subscriptions" className="flex items-center gap-3 rounded-lg border border-solar-400/30 bg-solar-400/6 px-3.5 py-3 transition-colors hover:bg-solar-400/12">
                    <I name="alert" size={16} className="shrink-0 text-solar-300" />
                    <span className="min-w-0 text-[12.5px]"><b className="text-mist-100">{u?.name}</b><span className="text-mist-400"> — {s.plan} past due</span></span>
                  </Link>
                );
              })}
              {openTickets.slice(0, 3).map((t) => (
                <Link key={t.id} to="/admin/support" className="flex items-center gap-3 rounded-lg border border-mist-100/12 px-3.5 py-3 transition-colors hover:bg-ink-800">
                  <I name="headset" size={16} className="shrink-0 text-wave-300" />
                  <span className="min-w-0 truncate text-[12.5px]"><b className="text-mist-100">{t.number}</b><span className="text-mist-400"> — {t.subject}</span></span>
                </Link>
              ))}
              {state.orders.filter((o) => o.paymentStatus === "failed").map((o) => (
                <Link key={o.id} to="/admin/orders" className="flex items-center gap-3 rounded-lg border border-flare-500/30 bg-flare-500/6 px-3.5 py-3 transition-colors hover:bg-flare-500/12">
                  <I name="card" size={16} className="shrink-0 text-flare-300" />
                  <span className="min-w-0 text-[12.5px]"><b className="text-mist-100">{o.number}</b><span className="text-mist-400"> — payment failed</span></span>
                </Link>
              ))}
              {openTickets.length === 0 && <p className="text-[12.5px] text-mist-500">Queue is clear — nice work.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-mist-100/10 px-5 py-3.5">
              <h3 className="font-display text-[15px] font-bold">Recent orders</h3>
              <Link to="/admin/orders" className="text-[12px] font-semibold text-pulse-300">All orders</Link>
            </div>
            <div className="divide-y divide-mist-100/6">
              {state.orders.slice(0, 5).map((o) => {
                const u = state.users.find((x) => x.id === o.customerId);
                return (
                  <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="num text-[12px] font-bold text-pulse-300">{o.number}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-mist-300">{u?.name} · {o.items[0]?.name}</span>
                    <span className="num text-[12.5px] font-semibold">{money(o.total)}</span>
                    <StatusBadge status={o.paymentStatus} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-mist-100/10 px-5 py-3.5">
              <h3 className="font-display text-[15px] font-bold">Recent customers</h3>
              <Link to="/admin/customers" className="text-[12px] font-semibold text-pulse-300">All customers</Link>
            </div>
            <div className="divide-y divide-mist-100/6">
              {[...customers].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((u) => {
                const orders = state.orders.filter((o) => o.customerId === u.id).length;
                return (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={u.name} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{u.name}</span>
                      <span className="num block text-[11px] text-mist-500">{u.email}</span>
                    </span>
                    <span className="num text-[11.5px] text-mist-400">{orders} orders</span>
                    <StatusBadge status={u.status} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- customers ------------------------------- */

export function AdminCustomers() {
  usePageTitle("Admin · Customers");
  const { state, can, setUserStatus, toast } = useStore();
  const [q, setQ] = useState("");
  const dq = useDebounced(q).toLowerCase();
  const [inspecting, setInspecting] = useState<string | null>(null);

  const list = state.users
    .filter((u) => u.role === "customer")
    .filter((u) => !dq || u.name.toLowerCase().includes(dq) || u.email.toLowerCase().includes(dq));
  const target = state.users.find((u) => u.id === inspecting);
  const tOwn = target ? state.ownerships.filter((o) => o.customerId === target.id) : [];
  const tOrders = target ? state.orders.filter((o) => o.customerId === target.id) : [];
  const tSubs = target ? state.subscriptions.filter((s) => s.customerId === target.id) : [];
  const tDls = target ? state.downloads.filter((d) => d.userId === target.id) : [];
  const tTix = target ? state.tickets.filter((t) => t.customerId === target.id) : [];

  return (
    <AdminShell title="Customers" sub="Search, inspect and manage accounts">
      {!can("customers") ? <Restricted perm="customers" /> : (
        <div className="mx-auto max-w-5xl">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name or email…" className="mb-5 max-w-sm" />
          <div className="overflow-x-auto rounded-xl border border-mist-100/10">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Products</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((u) => {
                  const owned = state.ownerships.filter((o) => o.customerId === u.id && o.status === "active").length;
                  const orders = state.orders.filter((o) => o.customerId === u.id).length;
                  return (
                    <tr key={u.id} className="border-b border-mist-100/6 transition-colors hover:bg-ink-800/50">
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-3"><Avatar name={u.name} size={32} /><span><span className="block font-semibold">{u.name}</span><span className="num block text-[11px] text-mist-500">{u.email}</span></span></span>
                      </td>
                      <td className="num px-5 py-3.5">{owned}</td>
                      <td className="num px-5 py-3.5">{orders}</td>
                      <td className="px-5 py-3.5 text-mist-400">{fmtDate(u.createdAt)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Btn size="sm" variant="ghost" icon="eye" onClick={() => setInspecting(u.id)}>Inspect</Btn>
                          {u.status === "active" ? (
                            <Btn size="sm" variant="danger" onClick={async () => { try { await setUserStatus(u.id, "suspended"); toast("info", "Customer suspended", `${u.name} can no longer log in. Audited.`); } catch (e) { toast("error", "Couldn't suspend", e instanceof Error ? e.message : "Try again."); } }}>Suspend</Btn>
                          ) : (
                            <Btn size="sm" variant="outline" onClick={async () => { try { await setUserStatus(u.id, "active"); toast("success", "Customer reactivated", u.name); } catch (e) { toast("error", "Couldn't reactivate", e instanceof Error ? e.message : "Try again."); } }}>Activate</Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!target} onClose={() => setInspecting(null)} title={target ? target.name : ""} wide>
        {target && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={target.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="num text-[12.5px] text-mist-400">{target.email}{target.company ? ` · ${target.company}` : ""}</p>
                <p className="text-[11.5px] text-mist-500">Joined {fmtDate(target.createdAt)}</p>
              </div>
              <StatusBadge status={target.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Owned products", v: tOwn.length },
                { l: "Orders", v: tOrders.length },
                { l: "Subscriptions", v: tSubs.length },
                { l: "Downloads", v: tDls.length },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-mist-100/10 bg-ink-800/60 p-3.5 text-center">
                  <p className="num text-2xl font-bold">{s.v}</p>
                  <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-mist-500">{s.l}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-mist-500">Recent orders</p>
              <div className="divide-y divide-mist-100/6 rounded-xl border border-mist-100/10">
                {tOrders.length === 0 && <p className="px-4 py-5 text-center text-[12.5px] text-mist-500">No orders yet.</p>}
                {tOrders.slice(0, 4).map((o) => (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                    <span className="num font-bold text-pulse-300">{o.number}</span>
                    <span className="min-w-0 flex-1 truncate text-mist-400">{o.items.map((i) => i.name).join(" + ")}</span>
                    <span className="num font-semibold">{money(o.total)}</span>
                    <StatusBadge status={o.paymentStatus} />
                  </div>
                ))}
              </div>
            </div>
            {tTix.length > 0 && (
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-mist-500">Support tickets</p>
                <div className="space-y-2">
                  {tTix.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 rounded-lg border border-mist-100/10 px-3.5 py-2.5 text-[13px]">
                      <span className="num font-bold text-pulse-300">{t.number}</span>
                      <span className="min-w-0 flex-1 truncate">{t.subject}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}

/* -------------------------------- products -------------------------------- */

const blankProduct = (categories: { id: string }[]): Product => ({
  id: `p-${Date.now().toString(36)}`, slug: "", name: "", tagline: "", description: "",
  type: "website", categoryId: categories[0]?.id ?? "", image: "", gallery: [],
  price: 99, billing: "once", rating: 4.5, reviews: 0,
  features: [], tags: [], faqs: [], files: [], downloadable: false,
  active: true, featured: false, version: "1.0.0",
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});

export function AdminProducts() {
  usePageTitle("Admin · Products");
  const { state, can, saveProduct, deleteProduct, duplicateProduct, toast } = useStore();
  const [q, setQ] = useState("");
  const dq = useDebounced(q).toLowerCase();
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const list = state.products.filter((p) => !dq || p.name.toLowerCase().includes(dq) || p.slug.includes(dq));

  return (
    <AdminShell title="Products" sub="Create, price, feature, archive — everything is audited"
      actions={can("products") ? <Btn size="sm" icon="plus" onClick={() => setEditing(blankProduct(state.categories))}>New product</Btn> : undefined}>
      {!can("products") ? <Restricted perm="products" /> : (
        <div className="mx-auto max-w-6xl">
          <SearchInput value={q} onChange={setQ} placeholder="Search products…" className="mb-5 max-w-sm" />
          <div className="overflow-x-auto rounded-xl border border-mist-100/10">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Owners</th>
                  <th className="px-5 py-3 font-semibold">Active</th>
                  <th className="px-5 py-3 font-semibold">Featured</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const owners = state.ownerships.filter((o) => o.productId === p.id && o.status === "active").length;
                  return (
                    <tr key={p.id} className={`border-b border-mist-100/6 transition-colors hover:bg-ink-800/50 ${p.active ? "" : "opacity-55"}`}>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          {p.image ? <img src={p.image} alt="" className="h-9 w-12 rounded-md border border-mist-100/12 object-cover object-top" /> : <span className="grid h-9 w-12 place-items-center rounded-md border border-mist-100/12 bg-ink-800 text-mist-500"><I name="box" size={14} /></span>}
                          <span><span className="block font-semibold">{p.name}</span><span className="num block text-[10.5px] text-mist-500">/{p.slug}</span></span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-mist-400">{TYPE_META[p.type].label}</td>
                      <td className="num px-5 py-3 font-semibold">{p.billing === "subscription" ? `${money(p.monthlyPrice ?? p.price)}/mo` : money(p.price)}</td>
                      <td className="num px-5 py-3">{owners}</td>
                      <td className="px-5 py-3"><Toggle on={p.active} onChange={async (v) => { try { await saveProduct({ ...p, active: v }); toast("success", v ? "Product activated" : "Product archived", p.name); } catch (e) { toast("error", "Couldn't update product", e instanceof Error ? e.message : "Try again."); } }} /></td>
                      <td className="px-5 py-3"><Toggle on={p.featured} onChange={async (v) => { try { await saveProduct({ ...p, featured: v }); toast("success", v ? "Featured on homepage" : "Removed from featured", p.name); } catch (e) { toast("error", "Couldn't update product", e instanceof Error ? e.message : "Try again."); } }} /></td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Btn size="sm" variant="ghost" icon="edit" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} />
                          <Btn size="sm" variant="ghost" icon="package" aria-label={`Duplicate ${p.name}`}
                            onClick={async () => { const c = await duplicateProduct(p.id); toast("success", "Product duplicated", `${c.name} — draft, unpublished.`); }} />
                          <Btn size="sm" variant="ghost" icon="trash" className="!text-flare-300" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p.id)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(null)}
          onSave={async (p) => { try { await saveProduct(p); setEditing(null); toast("success", "Product saved", p.name); } catch (e) { toast("error", "Couldn't save product", e instanceof Error ? e.message : "Try again."); } }}
        />
      )}

      <Confirm open={!!deleting} onClose={() => setDeleting(null)} title="Delete this product?"
        body="Ownership records stay for audit, but the product disappears from the catalog. This action is logged."
        confirmLabel="Delete product"
        onConfirm={async () => { if (deleting) { await deleteProduct(deleting); toast("info", "Product deleted"); } }} />
    </AdminShell>
  );
}

function ProductForm({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product) => void }) {
  const { state } = useStore();
  const [f, setF] = useState<Product>({ ...product });
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Product>) => setF((x) => ({ ...x, ...patch }));

  return (
    <Modal open onClose={onClose} wide title={product.name ? `Edit · ${product.name}` : "New product"}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn icon="check" loading={busy} onClick={async () => {
          if (f.name.trim().length < 2) return;
          setBusy(true);
          await onSave({ ...f, name: f.name.trim() });
          setBusy(false);
        }}>Save product</Btn>
      </>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><TextInput value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Slug" hint="auto if empty"><TextInput value={f.slug} onChange={(e) => set({ slug: e.target.value })} /></Field>
        </div>
        <Field label="Tagline"><TextInput value={f.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
        <Field label="Description"><TextArea value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <Select value={f.type} onChange={(e) => set({ type: e.target.value as ProductType })}>
              {(Object.keys(TYPE_META) as ProductType[]).map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={f.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
              {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Billing">
            <Select value={f.billing} onChange={(e) => set({ billing: e.target.value as Product["billing"] })}>
              <option value="once">One-time</option>
              <option value="subscription">Subscription</option>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price"><TextInput type="number" value={f.price} onChange={(e) => set({ price: Number(e.target.value) })} /></Field>
          {f.billing === "subscription" && (
            <>
              <Field label="Monthly"><TextInput type="number" value={f.monthlyPrice ?? ""} onChange={(e) => set({ monthlyPrice: e.target.value ? Number(e.target.value) : undefined })} /></Field>
              <Field label="Yearly"><TextInput type="number" value={f.yearlyPrice ?? ""} onChange={(e) => set({ yearlyPrice: e.target.value ? Number(e.target.value) : undefined })} /></Field>
            </>
          )}
          <Field label="Compare-at" hint="optional"><TextInput type="number" value={f.compareAt ?? ""} onChange={(e) => set({ compareAt: e.target.value ? Number(e.target.value) : undefined })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Features" hint="one per line">
            <TextArea value={f.features.join("\n")} onChange={(e) => set({ features: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
          </Field>
          <Field label="Tags" hint="comma separated">
            <TextInput value={f.tags.join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
          </Field>
        </div>

        <div className={`rounded-xl border p-4 transition-colors ${f.downloadable ? "border-wave-400/40 bg-wave-400/[0.05]" : "border-mist-100/12"}`}>
          <label className="flex items-center gap-2.5 text-[13px] font-semibold">
            <Toggle on={f.downloadable} onChange={(v) => set({ downloadable: v })} /> Downloadable product — files unlock instantly at checkout
          </label>
          {f.downloadable && (
            <div className="mt-4 space-y-3">
              <Field label="Download instructions" hint="shown to the customer at delivery & in their downloads">
                <TextArea value={f.downloadNote ?? ""} onChange={(e) => set({ downloadNote: e.target.value })}
                  placeholder="e.g. Open the .fig file in Figma, enable the library under Assets → Libraries…" />
              </Field>
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-mist-500">Files · {f.files.length}</p>
                {f.files.map((file, i) => (
                  <div key={file.id} className="mb-2 flex items-center gap-2 rounded-lg border border-mist-100/10 bg-ink-800/60 px-3 py-2">
                    <I name="file" size={14} className="text-mist-400" />
                    <TextInput className="!py-1.5 text-[12.5px]" value={file.name}
                      onChange={(e) => set({ files: f.files.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                    <button onClick={() => set({ files: f.files.filter((_, j) => j !== i) })} className="shrink-0 text-mist-500 hover:text-flare-300" aria-label="Remove file"><I name="close" size={14} /></button>
                  </div>
                ))}
                <Btn size="sm" variant="soft" icon="plus" onClick={() => set({ files: [...f.files, { id: `f-${Date.now().toString(36)}`, name: "new-file.zip", size: "1.0 MB", type: "ZIP", version: f.version }] })}>
                  Add file
                </Btn>
                <p className="mt-2 text-[11px] text-mist-500">Demo: files are delivered as signed delivery documents. Production streams from private Supabase Storage.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 text-[13px] font-semibold"><Toggle on={f.active} onChange={(v) => set({ active: v })} /> Active</label>
          <label className="flex items-center gap-2.5 text-[13px] font-semibold"><Toggle on={f.featured} onChange={(v) => set({ featured: v })} /> Featured</label>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------- categories ------------------------------- */

export function AdminCategories() {
  usePageTitle("Admin · Categories");
  const { state, can, saveCategory, deleteCategory, moveCategory, toast } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const sorted = [...state.categories].sort((a, b) => a.order - b.order);

  return (
    <AdminShell title="Categories" sub="Reorder, rename, activate — the catalog follows"
      actions={can("categories") ? <Btn size="sm" icon="plus" onClick={() => setEditing({ id: `c-${Date.now().toString(36)}`, slug: "", name: "", description: "", active: true, order: sorted.length + 1 })}>New category</Btn> : undefined}>
      {!can("categories") ? <Restricted perm="categories" /> : (
        <div className="mx-auto max-w-3xl space-y-2.5">
          {sorted.map((c, i) => {
            const count = state.products.filter((p) => p.categoryId === c.id).length;
            return (
              <div key={c.id} className={`card flex items-center gap-4 p-4 ${c.active ? "" : "opacity-55"}`}>
                <div className="flex flex-col gap-0.5">
                  <button disabled={i === 0} onClick={() => moveCategory(c.id, -1)} aria-label="Move up" className="text-mist-500 hover:text-pulse-300 disabled:opacity-25"><I name="chevD" size={14} className="rotate-180" /></button>
                  <button disabled={i === sorted.length - 1} onClick={() => moveCategory(c.id, 1)} aria-label="Move down" className="text-mist-500 hover:text-pulse-300 disabled:opacity-25"><I name="chevD" size={14} /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[15px] font-bold">{c.name}</p>
                    <span className="num text-[11px] text-mist-500">/{c.slug}</span>
                    <Badge tone="mist">{count} products</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[12.5px] text-mist-400">{c.description}</p>
                </div>
                <Toggle on={c.active} onChange={async (v) => { try { await saveCategory({ ...c, active: v }); toast("success", v ? "Category activated" : "Category hidden", c.name); } catch (e) { toast("error", "Couldn't update category", e instanceof Error ? e.message : "Try again."); } }} />
                <Btn size="sm" variant="ghost" icon="edit" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} />
                <Btn size="sm" variant="ghost" icon="trash" className="!text-flare-300" aria-label={`Delete ${c.name}`}
                  onClick={async () => {
                    try { await deleteCategory(c.id); toast("info", "Category deleted", c.name); }
                    catch (e) { toast("error", "Can't delete", e instanceof Error ? e.message : "In use."); }
                  }} />
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={editing.name ? `Edit · ${editing.name}` : "New category"}
          footer={<>
            <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn icon="check" onClick={async () => {
              if (editing.name.trim().length < 2) return;
              try {
                await saveCategory({ ...editing, name: editing.name.trim(), slug: editing.slug || editing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
                setEditing(null); toast("success", "Category saved", editing.name);
              } catch (e) { toast("error", "Couldn't save category", e instanceof Error ? e.message : "Try again."); }
            }}>Save</Btn>
          </>}>
          <div className="space-y-4">
            <Field label="Name"><TextInput value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Slug" hint="auto if empty"><TextInput value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
            <Field label="Description"><TextArea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}

export { timeAgo };
