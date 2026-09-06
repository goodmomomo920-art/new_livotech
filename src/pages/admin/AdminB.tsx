import { useState } from "react";
import { useStore } from "../../lib/store";
import { TYPE_META } from "../../lib/seed";
import { I } from "../../components/icons";
import { Avatar, Badge, Btn, Confirm, EmptyState, Field, fmtDate, fmtDateTime, Modal, money, SearchInput, Select, StatusBadge, TextArea, TextInput, timeAgo, Toggle, useDebounced, usePageTitle } from "../../components/ui";
import { Reveal, Stagger, StaggerItem } from "../../lib/motion";
import { AdminShell, Restricted } from "./AdminA";
import type { Addon, Coupon, Order, ProductType, TicketStatus } from "../../lib/types";

/* --------------------------------- addons --------------------------------- */

const blankAddon = (): Addon => ({
  id: `ad-${Date.now().toString(36)}`, slug: "", name: "", description: "", price: 9, interval: "monthly",
  icon: "spark", active: true, features: [], compat: ["website"], productIds: [],
});

export function AdminAddons() {
  usePageTitle("Admin · Add-ons");
  const { state, can, saveAddon, deleteAddon, toast } = useStore();
  const [editing, setEditing] = useState<Addon | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const dq = useDebounced(q).toLowerCase();
  const list = state.addons.filter((a) => !dq || a.name.toLowerCase().includes(dq) || a.slug.includes(dq));

  return (
    <AdminShell title="Add-ons" sub="Link each module to the exact products it supports"
      actions={can("addons") ? <Btn size="sm" icon="plus" onClick={() => setEditing(blankAddon())}>New add-on</Btn> : undefined}>
      {!can("addons") ? <Restricted perm="addons" /> : (
        <div className="mx-auto max-w-6xl">
          <SearchInput value={q} onChange={setQ} placeholder="Search add-ons…" className="mb-5 max-w-sm" />
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => {
              const linked = a.productIds.map((id) => state.products.find((p) => p.id === id)?.name).filter(Boolean) as string[];
              const attached = state.customerAddons.filter((ca) => ca.addonId === a.id).length;
              return (
                <StaggerItem key={a.id} className="h-full">
                  <div className={`card card-hover flex h-full flex-col p-5 ${a.active ? "" : "opacity-55"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-xl border border-solar-400/30 bg-solar-400/10 text-solar-300"><I name={a.icon} size={19} /></span>
                      <StatusBadge status={a.active ? "active" : "draft"} />
                    </div>
                    <h3 className="mt-3 font-display text-[15.5px] font-bold">{a.name}</h3>
                    <p className="num mt-0.5 text-[12px] text-mist-500">{money(a.price)}{a.interval === "monthly" ? "/mo" : " once"} · {attached} attached by customers</p>
                    <div className="mt-3">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-mist-500">Linked products · {linked.length}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {linked.length === 0 && <span className="text-[11.5px] text-mist-500">Not linked yet — customers can't attach it.</span>}
                        {linked.slice(0, 4).map((n) => <Badge key={n} tone="pulse">{n}</Badge>)}
                        {linked.length > 4 && <Badge tone="mist">+{linked.length - 4} more</Badge>}
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-mist-500">Types: {a.compat.map((c) => TYPE_META[c].label).join(", ")}</p>
                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <Toggle on={a.active} onChange={async (v) => { try { await saveAddon({ ...a, active: v }); toast("success", v ? "Add-on activated" : "Add-on archived", a.name); } catch (e) { toast("error", "Couldn't update add-on", e instanceof Error ? e.message : "Try again."); } }} />
                      <Btn size="sm" variant="ghost" icon="edit" onClick={() => setEditing(a)}>Edit & link</Btn>
                      <Btn size="sm" variant="ghost" icon="trash" className="ml-auto !text-flare-300" onClick={() => setDeleting(a.id)} aria-label={`Delete ${a.name}`} />
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      )}

      {editing && <AddonForm addon={editing} onClose={() => setEditing(null)} onSave={async (a) => { try { await saveAddon(a); setEditing(null); toast("success", "Add-on saved", `${a.name} — linked to ${a.productIds.length} product(s).`); } catch (e) { toast("error", "Couldn't save add-on", e instanceof Error ? e.message : "Try again."); } }} />}

      <Confirm open={!!deleting} onClose={() => setDeleting(null)} title="Delete this add-on?"
        body="Customers who already attached it keep their billing record, but it disappears from the catalog. Audited."
        confirmLabel="Delete add-on"
        onConfirm={async () => { if (deleting) { await deleteAddon(deleting); toast("info", "Add-on deleted"); } }} />
    </AdminShell>
  );
}

function AddonForm({ addon, onClose, onSave }: { addon: Addon; onClose: () => void; onSave: (a: Addon) => void }) {
  const { state } = useStore();
  const [f, setF] = useState<Addon>({ ...addon });
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Addon>) => setF((x) => ({ ...x, ...patch }));
  const suggested = state.products.filter((p) => p.active && f.compat.includes(p.type) && !f.productIds.includes(p.id));

  return (
    <Modal open onClose={onClose} wide title={addon.name ? `Edit · ${addon.name}` : "New add-on"}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn icon="check" loading={busy} onClick={async () => {
          if (f.name.trim().length < 2 || f.price < 0) return;
          setBusy(true);
          await onSave({ ...f, name: f.name.trim(), slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
          setBusy(false);
        }}>Save add-on</Btn>
      </>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><TextInput value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Loyalty Points" /></Field>
          <Field label="Slug" hint="auto if empty"><TextInput value={f.slug} onChange={(e) => set({ slug: e.target.value })} /></Field>
        </div>
        <Field label="Description"><TextArea value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price"><TextInput type="number" value={f.price} onChange={(e) => set({ price: Number(e.target.value) })} /></Field>
          <Field label="Billing">
            <Select value={f.interval} onChange={(e) => set({ interval: e.target.value as Addon["interval"] })}>
              <option value="monthly">Monthly</option>
              <option value="once">One-time</option>
            </Select>
          </Field>
          <Field label="Icon">
            <Select value={f.icon} onChange={(e) => set({ icon: e.target.value })}>
              {["star", "tag", "bolt", "crown", "truck", "chat", "shield", "chart", "bell", "spark", "wand", "users"].map((ic) => <option key={ic} value={ic}>{ic}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Features" hint="one per line">
          <TextArea value={f.features.join("\n")} onChange={(e) => set({ features: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
        </Field>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-mist-300">Compatible product types</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_META) as ProductType[]).filter((t) => t !== "other").map((t) => {
              const on = f.compat.includes(t);
              return (
                <button key={t} type="button" aria-pressed={on}
                  onClick={() => set({ compat: on ? f.compat.filter((x) => x !== t) : [...f.compat, t] })}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-all ${on ? "border-wave-400/60 bg-wave-400/10 text-wave-300" : "border-mist-100/12 text-mist-400 hover:border-mist-100/30"}`}>
                  <I name={TYPE_META[t].icon} size={12} /> {TYPE_META[t].plural}
                </button>
              );
            })}
          </div>
        </div>

        {/* the product linker */}
        <div className="rounded-xl border border-pulse-400/30 bg-pulse-400/[0.04] p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="flex items-center gap-2 text-[13px] font-bold text-pulse-300"><I name="layers" size={14} /> Linked products · {f.productIds.length}</p>
            <span className="text-[11px] text-mist-500">customers can attach this add-on to any of these</span>
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-mist-400">Pick the exact products this module works with. Suggestions below match the compatible types you selected above.</p>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {state.products.filter((p) => p.active).map((p) => {
              const on = f.productIds.includes(p.id);
              const matchesType = f.compat.includes(p.type);
              return (
                <button key={p.id} type="button" aria-pressed={on}
                  onClick={() => set({ productIds: on ? f.productIds.filter((x) => x !== p.id) : [...f.productIds, p.id] })}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all ${on ? "border-pulse-400/60 bg-pulse-400/[0.08]" : matchesType ? "border-mist-100/12 bg-ink-900 hover:border-pulse-400/40" : "border-mist-100/8 bg-ink-900 opacity-55 hover:opacity-90"}`}>
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border transition-all ${on ? "border-pulse-400 bg-pulse-400 text-ink-950" : "border-mist-100/25 text-transparent"}`}>
                    <I name="check" size={11} strokeWidth={2.6} />
                  </span>
                  {p.image && <img src={p.image} alt="" className="h-8 w-11 rounded border border-mist-100/12 object-cover object-top" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                    <span className="text-[10.5px] text-mist-500">{TYPE_META[p.type].label}{matchesType ? " · matches compatible type" : " · outside selected types"}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {suggested.length > 0 && (
            <button type="button" onClick={() => set({ productIds: [...f.productIds, ...suggested.map((p) => p.id)] })}
              className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-pulse-300 hover:text-pulse-400">
              <I name="wand" size={13} /> Link all {suggested.length} matching-type product{suggested.length > 1 ? "s" : ""} at once
            </button>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-[13px] font-semibold"><Toggle on={f.active} onChange={(v) => set({ active: v })} /> Active in catalog</label>
      </div>
    </Modal>
  );
}

/* --------------------------- deployed lists --------------------------- */

export function AdminDeployed({ kind }: { kind: "websites" | "systems" | "digital" }) {
  const titles = { websites: "Websites", systems: "Systems", digital: "Digital Products" };
  usePageTitle(`Admin · ${titles[kind]}`);
  const { state, can } = useStore();

  if (kind === "websites") {
    return (
      <AdminShell title="Websites" sub="Every deployment across all customers">
        {!can("websites") ? <Restricted perm="websites" /> : (
          <div className="mx-auto max-w-5xl space-y-3">
            {state.websites.length === 0 && <EmptyState icon="globe" title="No websites deployed" body="Purchases of website products provision deployments here." />}
            {state.websites.map((w) => {
              const owner = state.users.find((u) => u.id === w.customerId);
              const p = state.products.find((x) => x.id === w.productId);
              return (
                <div key={w.id} className="card flex flex-wrap items-center gap-4 p-4">
                  {p && <img src={p.image} alt="" className="h-11 w-16 rounded-md border border-mist-100/12 object-cover object-top" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-display text-[14.5px] font-bold">{w.name}</p><StatusBadge status={w.status} /></div>
                    <p className="num mt-0.5 text-[11.5px] text-mist-500">{w.domain} · {owner?.name} · {fmtDate(w.createdAt)}</p>
                  </div>
                  <Badge tone="mist">{w.plan}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </AdminShell>
    );
  }

  const items = state.products.filter((p) => (kind === "digital" ? p.downloadable : p.type === "system"));
  return (
    <AdminShell title={titles[kind]} sub={kind === "systems" ? "POS, inventory & operations in the catalog" : "Downloadable catalog with delivery stats"}>
      {kind === "systems" && !can("websites") ? <Restricted perm="websites" /> : kind === "digital" && !can("downloads") ? <Restricted perm="downloads" /> : (
        <div className="mx-auto max-w-5xl space-y-3">
          {items.length === 0 && <EmptyState icon={kind === "systems" ? "cpu" : "package"} title="Nothing here yet" />}
          {items.map((p) => {
            const owners = state.ownerships.filter((o) => o.productId === p.id && o.status === "active").length;
            const dls = state.downloads.filter((d) => d.productId === p.id).length;
            const linkedAddons = state.addons.filter((a) => a.productIds.includes(p.id)).length;
            return (
              <div key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
                <img src={p.image} alt="" className="h-11 w-16 rounded-md border border-mist-100/12 object-cover object-top" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[14.5px] font-bold">{p.name}</p>
                    <StatusBadge status={p.active ? "active" : "draft"} />
                    {p.downloadable && <Badge tone="wave">{p.files.length} files</Badge>}
                  </div>
                  <p className="num mt-0.5 text-[11.5px] text-mist-500">
                    {money(p.billing === "subscription" ? p.monthlyPrice ?? p.price : p.price, p.currency)}{p.billing === "subscription" ? "/mo" : ""} · {owners} active owner{owners === 1 ? "" : "s"}
                    {kind === "digital" && ` · ${dls} downloads`} · {linkedAddons} linked add-on{linkedAddons === 1 ? "" : "s"}
                  </p>
                </div>
                {p.downloadable && p.downloadNote && <Badge tone="wave"><I name="wand" size={11} /> has download guide</Badge>}
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

/* --------------------------------- orders --------------------------------- */

export function AdminOrders() {
  usePageTitle("Admin · Orders");
  const { state, can, setOrderStatus, toast } = useStore();
  const [q, setQ] = useState("");
  const dq = useDebounced(q).toLowerCase();
  const [status, setStatus] = useState("all");
  const [detail, setDetail] = useState<Order | null>(null);
  const list = state.orders
    .filter((o) => status === "all" || o.status === status)
    .filter((o) => {
      if (!dq) return true;
      const u = state.users.find((x) => x.id === o.customerId);
      return o.number.toLowerCase().includes(dq) || (u?.name.toLowerCase().includes(dq) ?? false);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AdminShell title="Orders" sub="Search, inspect, update — payment states are never faked">
      {!can("orders") ? <Restricted perm="orders" /> : (
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <SearchInput value={q} onChange={setQ} placeholder="Order # or customer…" className="w-full sm:w-64" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto" aria-label="Filter by status">
              <option value="all">All statuses</option>
              {["pending", "processing", "completed", "cancelled", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="overflow-x-auto rounded-xl border border-mist-100/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((o) => {
                  const u = state.users.find((x) => x.id === o.customerId);
                  return (
                    <tr key={o.id} className="cursor-pointer border-b border-mist-100/6 transition-colors hover:bg-ink-800/50" onClick={() => setDetail(o)}>
                      <td className="num px-5 py-3.5 font-bold text-pulse-300">{o.number}</td>
                      <td className="px-5 py-3.5">{u?.name ?? "—"}</td>
                      <td className="max-w-[220px] truncate px-5 py-3.5 text-mist-400">{o.items.map((i) => i.name).join(" + ")}</td>
                      <td className="num px-5 py-3.5 font-semibold">{money(o.total)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.paymentStatus} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5 text-right"><Btn size="sm" variant="ghost" icon="eye">Open</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Order ${detail.number}` : ""}
        footer={detail && can("orders") ? (
          <>
            <Select value={detail.status} className="!w-auto" aria-label="Set order status"
              onChange={async (e) => { const s = e.target.value as Order["status"]; try { await setOrderStatus(detail.id, s); setDetail({ ...detail, status: s }); toast("success", "Order updated", `${detail.number} → ${s}`); } catch (err) { toast("error", "Couldn't update order", err instanceof Error ? err.message : "Try again."); } }}>
              {["pending", "processing", "completed", "cancelled", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Btn variant="ghost" onClick={() => setDetail(null)}>Close</Btn>
          </>
        ) : undefined}>
        {detail && (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge status={detail.status} /><StatusBadge status={detail.paymentStatus} />
              <Badge tone="mist">{detail.paymentMethod}</Badge>
              <Badge tone="mist" className="num">{fmtDateTime(detail.createdAt)}</Badge>
            </div>
            <div className="rounded-xl border border-mist-100/10 bg-ink-800/60 p-4">
              {detail.items.map((it) => (
                <div key={it.productId} className="flex items-center justify-between py-2 text-[13.5px]">
                  <span className="text-mist-200">{it.name}<span className="ml-2 text-[11px] uppercase tracking-wider text-mist-500">{it.type}</span></span>
                  <span className="num font-semibold">{money(it.total)}</span>
                </div>
              ))}
              {detail.discount > 0 && <div className="flex justify-between py-2 text-[13.5px] text-solar-300"><span>Coupon {detail.couponCode}</span><span className="num">−{money(detail.discount)}</span></div>}
              <div className="mt-1 flex justify-between border-t border-mist-100/10 pt-3 font-bold"><span>Total</span><span className="num text-pulse-300">{money(detail.total)}</span></div>
            </div>
            <p className="mt-4 flex items-start gap-2 text-[11.5px] text-mist-500"><I name="shield" size={13} className="mt-0.5 shrink-0 text-pulse-400" /> Status changes are audited. Payment verification always happens server-side — never from the frontend.</p>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}

/* ------------------------------ subscriptions ------------------------------ */

export function AdminSubscriptions() {
  usePageTitle("Admin · Subscriptions");
  const { state, can, setSubStatus, toast } = useStore();
  const [status, setStatus] = useState("all");
  const list = state.subscriptions.filter((s) => status === "all" || s.status === status).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <AdminShell title="Subscriptions" sub="Renewals, pauses and cancellations — sensitive changes are audited">
      {!can("subscriptions") ? <Restricted perm="subscriptions" /> : (
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-wrap gap-2">
            {["all", "active", "past_due", "paused", "cancelled", "expired"].map((s) => (
              <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s}
                className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold capitalize transition-all ${status === s ? "border-pulse-400/60 bg-pulse-400/12 text-pulse-300" : "border-mist-100/12 text-mist-400 hover:border-mist-100/30"}`}>
                {s.replace("_", " ")}{s !== "all" && <span className="num ml-1.5 opacity-70">{state.subscriptions.filter((x) => x.status === s).length}</span>}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-mist-100/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Next billing</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Set status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const u = state.users.find((x) => x.id === s.customerId);
                  return (
                    <tr key={s.id} className="border-b border-mist-100/6 transition-colors hover:bg-ink-800/50">
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2.5"><Avatar name={u?.name ?? "?"} size={28} /><span className="font-semibold">{u?.name ?? "—"}</span></span>
                      </td>
                      <td className="px-5 py-3.5 text-mist-300">{s.plan}</td>
                      <td className="num px-5 py-3.5 font-semibold">{money(s.price)}<span className="text-[10.5px] text-mist-500">/{s.interval === "monthly" ? "mo" : "yr"}</span></td>
                      <td className="num px-5 py-3.5 text-mist-400">{fmtDate(s.nextBillingAt)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-3.5">
                        <Select value={s.status} className="!w-auto !py-1.5 text-[12px]" aria-label={`Set status for ${s.plan}`}
                          onChange={async (e) => { const v = e.target.value as typeof s.status; try { await setSubStatus(s.id, v); toast("success", "Subscription updated", `${s.plan} → ${v.replace("_", " ")}`); } catch (err) { toast("error", "Couldn't update subscription", err instanceof Error ? err.message : "Try again."); } }}>
                          {["trial", "active", "past_due", "paused", "cancelled", "expired"].map((v) => <option key={v} value={v}>{v.replace("_", " ")}</option>)}
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

/* -------------------------------- payments -------------------------------- */

export function AdminPayments() {
  usePageTitle("Admin · Payments");
  const { state, can } = useStore();
  const payments = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totals = { paid: 0, failed: 0, pending: 0, refunded: 0 };
  payments.forEach((o) => { totals[o.paymentStatus] += o.total; });

  return (
    <AdminShell title="Payments" sub="Provider-agnostic ledger — verification is always server-side">
      {!can("payments") ? <Restricted perm="payments" /> : (
        <div className="mx-auto max-w-6xl space-y-6">
          <Stagger className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {([["paid", "pulse"], ["pending", "solar"], ["failed", "flare"], ["refunded", "mist"]] as const).map(([k, tone]) => (
              <StaggerItem key={k}>
                <div className="card p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-mist-500">{k}</p>
                  <p className={`num mt-1.5 text-xl font-bold ${tone === "pulse" ? "text-pulse-300" : tone === "flare" ? "text-flare-300" : tone === "solar" ? "text-solar-300" : "text-mist-200"}`}>{money(Math.round(totals[k] * 100) / 100)}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="overflow-x-auto rounded-xl border border-mist-100/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((o) => {
                  const u = state.users.find((x) => x.id === o.customerId);
                  return (
                    <tr key={o.id} className="border-b border-mist-100/6 transition-colors hover:bg-ink-800/50">
                      <td className="num px-5 py-3.5 font-bold text-pulse-300">{o.number}</td>
                      <td className="px-5 py-3.5">{u?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-mist-400">{o.paymentMethod}</td>
                      <td className="px-5 py-3.5 text-mist-400">{fmtDate(o.createdAt)}</td>
                      <td className="num px-5 py-3.5 font-semibold">{money(o.total)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.paymentStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

/* -------------------------------- downloads -------------------------------- */

export function AdminDownloads() {
  usePageTitle("Admin · Downloads");
  const { state, can } = useStore();
  const list = [...state.downloads].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <AdminShell title="Downloads" sub="Every authorized file delivery, tracked">
      {!can("downloads") ? <Restricted perm="downloads" /> : (
        <div className="mx-auto max-w-4xl">
          {list.length === 0 ? (
            <EmptyState icon="download" title="No downloads yet" body="Authorized file deliveries are logged here with user, file and timestamp." />
          ) : (
            <div className="card divide-y divide-mist-100/6">
              {list.map((d) => {
                const u = state.users.find((x) => x.id === d.userId);
                const p = state.products.find((x) => x.id === d.productId);
                return (
                  <div key={d.id} className="flex items-center gap-3.5 px-5 py-3.5">
                    <Avatar name={u?.name ?? "?"} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px]"><b>{u?.name ?? "Unknown"}</b> <span className="text-mist-400">downloaded</span> <span className="num font-semibold">{d.fileName}</span></p>
                      <p className="text-[11.5px] text-mist-500">{p?.name ?? d.productId} · ownership verified · signed URL issued</p>
                    </div>
                    <span className="num shrink-0 text-[11px] text-mist-500">{timeAgo(d.at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}

/* --------------------------------- coupons --------------------------------- */

export function AdminCoupons() {
  usePageTitle("Admin · Coupons");
  const { state, can, saveCoupon, deleteCoupon, toast } = useStore();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <AdminShell title="Coupons" sub="Windows, caps and per-customer limits enforced at checkout"
      actions={can("coupons") ? <Btn size="sm" icon="plus" onClick={() => setEditing({ code: "", kind: "percent", value: 10, minOrder: 0, startsAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 864e5).toISOString(), usageLimit: 100, used: 0, perCustomer: 1, active: true })}>New coupon</Btn> : undefined}>
      {!can("coupons") ? <Restricted perm="coupons" /> : (
        <div className="mx-auto max-w-4xl space-y-3">
          {state.coupons.map((c) => {
            const expired = Date.now() > new Date(c.expiresAt).getTime();
            return (
              <div key={c.code} className={`card flex flex-wrap items-center gap-4 p-4 ${!c.active || expired ? "opacity-55" : ""}`}>
                <span className="num rounded-lg border border-solar-400/40 bg-solar-400/10 px-3 py-1.5 text-[14px] font-bold tracking-widest text-solar-300">{c.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{c.kind === "percent" ? `${c.value}% off` : `${money(c.value)} off`}{c.maxDiscount ? ` · cap ${money(c.maxDiscount)}` : ""}{c.minOrder > 0 ? ` · min ${money(c.minOrder)}` : ""}</p>
                  <p className="num text-[11.5px] text-mist-500">{c.used}/{c.usageLimit} used · {c.perCustomer}/customer · expires {fmtDate(c.expiresAt)}{expired ? " · expired" : ""}</p>
                </div>
                <Toggle on={c.active} onChange={async (v) => { try { await saveCoupon({ ...c, active: v }); toast("success", v ? "Coupon activated" : "Coupon deactivated", c.code); } catch (e) { toast("error", "Couldn't update coupon", e instanceof Error ? e.message : "Try again."); } }} />
                <Btn size="sm" variant="ghost" icon="edit" onClick={() => setEditing(c)} aria-label={`Edit ${c.code}`} />
                <Btn size="sm" variant="ghost" icon="trash" className="!text-flare-300" onClick={() => setDeleting(c.code)} aria-label={`Delete ${c.code}`} />
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={editing.code ? `Edit · ${editing.code}` : "New coupon"}
          footer={<>
            <Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
            <Btn icon="check" onClick={async () => {
              if (editing.code.trim().length < 3) return;
              try {
                await saveCoupon({ ...editing, code: editing.code.trim().toUpperCase() });
                setEditing(null); toast("success", "Coupon saved", editing.code.toUpperCase());
              } catch (e) { toast("error", "Couldn't save coupon", e instanceof Error ? e.message : "Try again."); }
            }}>Save coupon</Btn>
          </>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code"><TextInput value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" /></Field>
            <Field label="Kind">
              <Select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as Coupon["kind"] })}>
                <option value="percent">Percent</option><option value="fixed">Fixed amount</option>
              </Select>
            </Field>
            <Field label="Value"><TextInput type="number" value={editing.value} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} /></Field>
            <Field label="Minimum order"><TextInput type="number" value={editing.minOrder} onChange={(e) => setEditing({ ...editing, minOrder: Number(e.target.value) })} /></Field>
            <Field label="Max discount" hint="optional"><TextInput type="number" value={editing.maxDiscount ?? ""} onChange={(e) => setEditing({ ...editing, maxDiscount: e.target.value ? Number(e.target.value) : undefined })} /></Field>
            <Field label="Usage limit"><TextInput type="number" value={editing.usageLimit} onChange={(e) => setEditing({ ...editing, usageLimit: Number(e.target.value) })} /></Field>
            <Field label="Per customer"><TextInput type="number" value={editing.perCustomer} onChange={(e) => setEditing({ ...editing, perCustomer: Number(e.target.value) })} /></Field>
            <Field label="Expires"><TextInput type="date" value={editing.expiresAt.slice(0, 10)} onChange={(e) => setEditing({ ...editing, expiresAt: new Date(e.target.value).toISOString() })} /></Field>
          </div>
        </Modal>
      )}

      <Confirm open={!!deleting} onClose={() => setDeleting(null)} title="Delete coupon?" body="Existing orders keep their discount snapshot. The code stops working immediately."
        confirmLabel="Delete" onConfirm={async () => { if (deleting) { try { await deleteCoupon(deleting); toast("info", "Coupon deleted", deleting); } catch (e) { toast("error", "Couldn't delete coupon", e instanceof Error ? e.message : "Try again."); } } }} />
    </AdminShell>
  );
}

/* --------------------------------- support --------------------------------- */

export function AdminSupport() {
  usePageTitle("Admin · Support");
  const { state, can, me, replyTicket, setTicketStatus, toast } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const staff = state.users.filter((u) => u.role !== "customer");

  const list = state.tickets
    .filter((t) => filter === "all" || (filter === "active" ? t.status === "open" || t.status === "in_progress" || t.status === "waiting" : t.status === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = state.tickets.find((t) => t.id === openId) ?? null;

  const send = async () => {
    if (!open || reply.trim().length < 2 || !me) return;
    setBusy(true);
    await replyTicket(open.id, reply.trim(), "support", me.name);
    setReply(""); setBusy(false);
    toast("success", "Reply sent", "The customer was notified.");
  };

  return (
    <AdminShell title="Support" sub={`${list.filter((t) => t.status === "open" || t.status === "in_progress").length} tickets need attention`}>
      {!can("support") ? <Restricted perm="support" /> : (
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[340px_1fr]">
          <div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {["all", "active", "open", "waiting", "resolved", "closed"].map((s) => (
                <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s}
                  className={`rounded-md border px-2.5 py-1 text-[11.5px] font-semibold capitalize transition-all ${filter === s ? "border-pulse-400/60 bg-pulse-400/12 text-pulse-300" : "border-mist-100/12 text-mist-400"}`}>{s}</button>
              ))}
            </div>
            <div className="space-y-2.5">
              {list.length === 0 && <EmptyState icon="headset" title="Queue is clear" />}
              {list.map((t) => {
                const u = state.users.find((x) => x.id === t.customerId);
                return (
                  <button key={t.id} onClick={() => setOpenId(t.id)}
                    className={`card w-full p-4 text-left transition-all hover:border-pulse-400/40 ${openId === t.id ? "border-pulse-400/50" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="num text-[11px] font-bold text-pulse-300">{t.number}</span>
                      <StatusBadge status={t.status} />
                      <StatusBadge status={t.priority} />
                    </div>
                    <p className="mt-1.5 truncate text-[13.5px] font-semibold">{t.subject}</p>
                    <p className="mt-0.5 text-[11.5px] text-mist-500">{u?.name} · {timeAgo(t.createdAt)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {open ? (
            <div className="card flex flex-col">
              <div className="flex flex-wrap items-center gap-2.5 border-b border-mist-100/10 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-bold">{open.subject}</p>
                  <p className="text-[11.5px] text-mist-500">{open.number} · {open.category}</p>
                </div>
                <Select value={open.status} className="!w-auto !py-1.5 text-[12px]" aria-label="Ticket status"
                  onChange={async (e) => { await setTicketStatus(open.id, e.target.value as TicketStatus); toast("success", "Status updated", `${open.number} → ${e.target.value.replace("_", " ")}`); }}>
                  {(["open", "in_progress", "waiting", "resolved", "closed"] as TicketStatus[]).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </Select>
                <Select value={open.assignee ?? ""} className="!w-auto !py-1.5 text-[12px]" aria-label="Assignee" onChange={() => undefined}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </Select>
              </div>
              <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-4">
                {open.messages.map((m) => (
                  <div key={m.id} className={`flex gap-3 ${m.author === "support" ? "flex-row-reverse" : ""}`}>
                    <Avatar name={m.authorName} size={30} />
                    <div className={`max-w-[85%] rounded-xl border px-4 py-3 ${m.author === "support" ? "border-pulse-400/30 bg-pulse-400/[0.07]" : "border-mist-100/12 bg-ink-800/70"}`}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-mist-500">{m.authorName} · {m.author === "support" ? "staff" : "customer"}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-mist-200">{m.body}</p>
                      <p className="mt-1.5 text-[10.5px] text-mist-500">{fmtDateTime(m.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5 border-t border-mist-100/10 p-4">
                <TextInput value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply as support…" onKeyDown={(e) => e.key === "Enter" && send()} />
                <Btn icon="send" loading={busy} onClick={send} className="shrink-0">Send</Btn>
              </div>
            </div>
          ) : (
            <EmptyState icon="headset" title="Pick a ticket" body="Select a conversation from the queue." />
          )}
        </div>
      )}
    </AdminShell>
  );
}

/* ------------------------------ content & notif ------------------------------ */

export function AdminContent() {
  usePageTitle("Admin · Content");
  const { state, can } = useStore();
  if (!can("content")) return <AdminShell title="Content" sub="CMS"><Restricted perm="content" /></AdminShell>;
  const contacts = state.contacts;

  return (
    <AdminShell title="Content" sub="Announcements, FAQs and inbound messages">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="card p-6">
            <h3 className="mb-1 font-display text-[16px] font-bold">Live announcement</h3>
            <p className="mb-4 text-[12px] text-mist-500">Shown in the site's top bar. Edit under Settings.</p>
            <div className="rounded-lg border border-pulse-400/30 bg-pulse-400/8 px-4 py-3 text-[13px] text-mist-200">{state.settings.announcement || "No announcement live."}</div>
            <h3 className="mb-2 mt-6 font-display text-[16px] font-bold">Product FAQs & download guides</h3>
            <p className="text-[12.5px] leading-relaxed text-mist-400">
              {state.products.reduce((s, p) => s + p.faqs.length, 0)} FAQ entries live across {state.products.length} products — managed per product in the product editor.{" "}
              {state.products.filter((p) => p.downloadNote).length} downloadable products include a custom download guide shown to customers at delivery.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="card overflow-hidden">
            <div className="border-b border-mist-100/10 px-5 py-3.5"><h3 className="font-display text-[15px] font-bold">Contact inbox · {contacts.length}</h3></div>
            <div className="max-h-[420px] divide-y divide-mist-100/6 overflow-y-auto">
              {contacts.length === 0 && <p className="px-5 py-8 text-center text-[12.5px] text-mist-500">No messages from the contact form yet.</p>}
              {contacts.map((c) => (
                <div key={c.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-semibold">{c.subject}</p>
                    <span className="shrink-0 text-[10.5px] text-mist-500">{timeAgo(c.at)}</span>
                  </div>
                  <p className="num text-[11px] text-pulse-300">{c.name} · {c.email}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] text-mist-400">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </AdminShell>
  );
}

export function AdminNotifications() {
  usePageTitle("Admin · Notifications");
  const { state, can, broadcast, toast, markAllNotifs } = useStore();
  const [form, setForm] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);
  if (!can("notifications")) return <AdminShell title="Notifications" sub="Broadcasts"><Restricted perm="notifications" /></AdminShell>;
  const adminNotifs = state.notifications.filter((n) => n.userId === "admin");

  return (
    <AdminShell title="Notifications" sub="Platform broadcasts + admin feed">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="card p-6">
            <h3 className="mb-1 font-display text-[16px] font-bold">Broadcast to all customers</h3>
            <p className="mb-4 text-[12px] text-mist-500">Lands in every customer notification center. Audited.</p>
            <div className="space-y-4">
              <Field label="Title"><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Winter catalog drop is live" /></Field>
              <Field label="Message"><TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Three new products, add-ons from $5/mo…" /></Field>
              <Btn icon="send" loading={busy} onClick={async () => {
                if (form.title.trim().length < 4 || form.body.trim().length < 8) { toast("error", "Too short", "Give the broadcast a real title and body."); return; }
                setBusy(true);
                try {
                  await broadcast(form.title.trim(), form.body.trim());
                  setForm({ title: "", body: "" }); toast("success", "Broadcast sent", `Delivered to ${state.users.filter((u) => u.role === "customer").length} customers.`);
                } catch (e) { toast("error", "Couldn't send broadcast", e instanceof Error ? e.message : "Try again."); }
                setBusy(false);
              }}>Send broadcast</Btn>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-mist-100/10 px-5 py-3.5">
              <h3 className="font-display text-[15px] font-bold">Admin feed</h3>
              <button onClick={() => markAllNotifs("admin")} className="text-[11.5px] font-semibold text-pulse-300">Mark all read</button>
            </div>
            <div className="max-h-[420px] divide-y divide-mist-100/6 overflow-y-auto">
              {adminNotifs.map((n) => (
                <div key={n.id} className={`px-5 py-3.5 ${n.read ? "opacity-55" : ""}`}>
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="size-1.5 rounded-full bg-pulse-400" />}
                    <p className="truncate text-[13px] font-semibold">{n.title}</p>
                    <span className="ml-auto shrink-0 text-[10.5px] text-mist-500">{timeAgo(n.at)}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-mist-400">{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </AdminShell>
  );
}

/* ------------------------------- staff & roles ------------------------------- */

export function AdminStaff() {
  usePageTitle("Admin · Staff");
  const { state, me, addStaff, setUserRole, setUserStatus, toast, can } = useStore();
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "admin" as "admin" | "superadmin" });
  const [busy, setBusy] = useState(false);
  if (!can("staff")) return <AdminShell title="Staff" sub="Team management"><Restricted perm="staff" /></AdminShell>;
  const staffList = state.users.filter((u) => u.role !== "customer");

  return (
    <AdminShell title="Staff" sub="Only Super Admins provision administrators"
      actions={me?.role === "superadmin" ? <Btn size="sm" icon="plus" onClick={() => setInviting(true)}>Invite staff</Btn> : undefined}>
      <div className="mx-auto max-w-4xl overflow-x-auto rounded-xl border border-mist-100/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {staffList.map((u) => (
              <tr key={u.id} className="border-b border-mist-100/6">
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-3"><Avatar name={u.name} size={30} /><span><span className="block font-semibold">{u.name}</span><span className="num block text-[11px] text-mist-500">{u.email}</span></span></span>
                </td>
                <td className="px-5 py-3.5">
                  {me?.role === "superadmin" && u.id !== me.id ? (
                    <Select value={u.role} className="!w-auto !py-1.5 text-[12px]" aria-label={`Role for ${u.name}`}
                      onChange={async (e) => { try { await setUserRole(u.id, e.target.value as typeof u.role); toast("success", "Role changed", `${u.name} → ${e.target.value}`); } catch (err) { toast("error", "Couldn't change role", err instanceof Error ? err.message : "Try again."); } }}>
                      <option value="admin">admin</option><option value="superadmin">superadmin</option>
                    </Select>
                  ) : (
                    <Badge tone={u.role === "superadmin" ? "solar" : "wave"}>{u.role === "superadmin" ? "Super Admin" : "Admin"}</Badge>
                  )}
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                <td className="px-5 py-3.5 text-mist-400">{fmtDate(u.createdAt)}</td>
                <td className="px-5 py-3.5 text-right">
                  {me?.role === "superadmin" && u.id !== me.id && (
                    u.status === "active"
                      ? <Btn size="sm" variant="danger" onClick={async () => { try { await setUserStatus(u.id, "suspended"); toast("info", "Staff suspended", u.name); } catch (e) { toast("error", "Couldn't suspend", e instanceof Error ? e.message : "Try again."); } }}>Suspend</Btn>
                      : <Btn size="sm" variant="outline" onClick={async () => { try { await setUserStatus(u.id, "active"); toast("success", "Staff reactivated", u.name); } catch (e) { toast("error", "Couldn't reactivate", e instanceof Error ? e.message : "Try again."); } }}>Reactivate</Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={inviting} onClose={() => setInviting(false)} title="Invite staff member"
        footer={<>
          <Btn variant="ghost" onClick={() => setInviting(false)}>Cancel</Btn>
          <Btn icon="send" loading={busy} onClick={async () => {
            if (form.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email)) { toast("error", "Check the form", "Name and a valid email are required."); return; }
            setBusy(true);
            try {
              await addStaff(form.name.trim(), form.email, form.role);
              toast("success", "Invite sent", `${form.name} can now log in.`);
              setInviting(false); setForm({ name: "", email: "", role: "admin" });
            } catch (e) {
              toast("error", "Couldn't invite", e instanceof Error ? e.message : "Try again.");
            } finally {
              setBusy(false);
            }
          }}>Send invite</Btn>
        </>}>
        <div className="space-y-4">
          <Field label="Full name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Karim Fathy" /></Field>
          <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@livotech.io" /></Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "superadmin" })}>
              <option value="admin">Admin — catalog & operations</option>
              <option value="superadmin">Super Admin — full control</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </AdminShell>
  );
}

export function AdminRoles() {
  usePageTitle("Admin · Roles");
  const { state, me, can, togglePerm, toast } = useStore();
  if (!can("roles")) return <AdminShell title="Roles" sub="Permissions"><Restricted perm="roles" /></AdminShell>;
  const perms = ["products", "categories", "addons", "orders", "subscriptions", "payments", "customers", "support", "content", "downloads", "coupons", "websites", "notifications", "staff", "roles", "settings", "audit"] as const;

  return (
    <AdminShell title="Roles & Permissions" sub={me?.role === "superadmin" ? "Toggle what each role can do — audited" : "Read-only: only Super Admins edit permissions"}>
      <div className="mx-auto max-w-3xl overflow-x-auto rounded-xl border border-mist-100/10">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
              <th className="px-5 py-3 font-semibold">Permission</th>
              <th className="px-5 py-3 text-center font-semibold">Admin</th>
              <th className="px-5 py-3 text-center font-semibold">Super Admin</th>
            </tr>
          </thead>
          <tbody>
            {perms.map((p) => (
              <tr key={p} className="border-b border-mist-100/6">
                <td className="px-5 py-3 font-semibold capitalize">{p}</td>
                {(["admin", "superadmin"] as const).map((role) => {
                  const on = state.rolePerms[role].includes(p);
                  return (
                    <td key={role} className="px-5 py-3 text-center">
                      <button
                        disabled={me?.role !== "superadmin"}
                        onClick={async () => { try { await togglePerm(role, p); toast("success", "Permission updated", `${role} · ${p} → ${on ? "revoked" : "granted"}`); } catch (e) { toast("error", "Couldn't update permission", e instanceof Error ? e.message : "Try again."); } }}
                        aria-label={`${role} ${p} ${on ? "granted" : "revoked"}`}
                        className={`grid size-6 place-items-center rounded-md border transition-all disabled:cursor-not-allowed ${on ? "border-pulse-400/60 bg-pulse-400 text-ink-950" : "border-mist-100/20 text-transparent hover:border-mist-100/40"}`}
                      >
                        <I name="check" size={12} strokeWidth={2.6} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mx-auto mt-4 max-w-3xl text-[11.5px] text-mist-500">Customer permissions are handled by ownership rules (RLS in production), not this matrix. Changes here are written to the audit log.</p>
    </AdminShell>
  );
}

/* --------------------------------- settings --------------------------------- */

export function AdminSettings() {
  usePageTitle("Admin · Settings");
  const { state, can, saveSettings, toast } = useStore();
  const [f, setF] = useState({ ...state.settings });
  const [busy, setBusy] = useState(false);
  if (!can("settings")) return <AdminShell title="Settings" sub="Platform configuration"><Restricted perm="settings" /></AdminShell>;

  return (
    <AdminShell title="Settings" sub="Brand, currency, contacts and maintenance — nothing is hardcoded">
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="card space-y-4 p-6">
            <h3 className="font-display text-[16px] font-bold">Brand & platform</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand"><TextInput value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></Field>
              <Field label="Currency">
                <Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>
                  {["USD", "EGP", "EUR", "GBP", "AED", "SAR"].map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Tagline"><TextInput value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></Field>
            <Field label="Announcement bar"><TextInput value={f.announcement} onChange={(e) => setF({ ...f, announcement: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact email"><TextInput value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
              <Field label="Support email"><TextInput value={f.supportEmail} onChange={(e) => setF({ ...f, supportEmail: e.target.value })} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Twitter"><TextInput value={f.twitter} onChange={(e) => setF({ ...f, twitter: e.target.value })} /></Field>
              <Field label="GitHub"><TextInput value={f.github} onChange={(e) => setF({ ...f, github: e.target.value })} /></Field>
              <Field label="LinkedIn"><TextInput value={f.linkedin} onChange={(e) => setF({ ...f, linkedin: e.target.value })} /></Field>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-mist-100/10 bg-ink-800/60 px-4 py-3">
              <div><p className="text-[13.5px] font-semibold">Maintenance mode</p><p className="text-[11.5px] text-mist-500">Pauses new purchases; dashboards stay open.</p></div>
              <Toggle on={f.maintenance} onChange={(v) => setF({ ...f, maintenance: v })} />
            </div>
            <Btn icon="check" loading={busy} onClick={async () => {
              setBusy(true);
              try { await saveSettings(f); toast("success", "Settings saved", "Live across the whole platform."); }
              catch (e) { toast("error", "Couldn't save settings", e instanceof Error ? e.message : "Try again."); }
              setBusy(false);
            }}>Save settings</Btn>
          </div>
        </Reveal>
        <Reveal delay={0.03}>
          <div className="card space-y-4 p-6">
            <h3 className="font-display text-[16px] font-bold">Foreign currency display</h3>
            <p className="text-[12.5px] text-mist-500">
              Visitors browsing from outside Egypt see prices converted to their local currency (USD, SAR…) — this is display-only, the amount actually charged always stays in EGP. Set how many EGP each unit is worth below.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="1 USD = ? EGP">
                <TextInput type="number" min={0} step={0.01} value={f.fxRates?.USD ?? ""}
                  onChange={(e) => setF({ ...f, fxRates: { ...f.fxRates, USD: Number(e.target.value) } })} />
              </Field>
              <Field label="1 SAR = ? EGP">
                <TextInput type="number" min={0} step={0.01} value={f.fxRates?.SAR ?? ""}
                  onChange={(e) => setF({ ...f, fxRates: { ...f.fxRates, SAR: Number(e.target.value) } })} />
              </Field>
            </div>
            <Btn icon="check" loading={busy} onClick={async () => {
              setBusy(true);
              try { await saveSettings(f); toast("success", "Rates saved", "New conversions apply immediately."); }
              catch (e) { toast("error", "Couldn't save rates", e instanceof Error ? e.message : "Try again."); }
              setBusy(false);
            }}>Save rates</Btn>
          </div>
        </Reveal>
        <div className="space-y-6">
          <Reveal delay={0.06}>
            <div className="card p-6">
              <h3 className="font-display text-[16px] font-bold">Payment architecture</h3>
              <div className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-mist-400">
                {[
                  "Order creation → payment initiation → provider verification → activation.",
                  "Activation never happens from frontend success alone.",
                  "Provider-agnostic: Egyptian (Fawry, Vodafone Cash) and international gateways plug into the same pipeline.",
                  "Secrets live in environment variables only — never in client code.",
                ].map((t, i) => (
                  <p key={i} className="flex gap-2.5"><I name="shield" size={13} className="mt-0.5 shrink-0 text-pulse-400" /> {t}</p>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </AdminShell>
  );
}

/* -------------------------------- audit logs -------------------------------- */

export function AdminAudit() {
  usePageTitle("Admin · Audit Logs");
  const { state, can } = useStore();
  const [q, setQ] = useState("");
  const dq = useDebounced(q).toLowerCase();
  const list = state.audit.filter((a) => !dq || a.actorName.toLowerCase().includes(dq) || a.action.includes(dq) || a.resource.includes(dq) || a.resourceId.toLowerCase().includes(dq));

  return (
    <AdminShell title="Audit Logs" sub="Who did what, to which resource, when — customers never see this">
      {!can("audit") ? <Restricted perm="audit" /> : (
        <div className="mx-auto max-w-5xl">
          <SearchInput value={q} onChange={setQ} placeholder="Search actor, action or resource…" className="mb-5 max-w-sm" />
          <div className="overflow-x-auto rounded-xl border border-mist-100/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Resource</th>
                  <th className="px-5 py-3 font-semibold">Detail</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-b border-mist-100/6 transition-colors hover:bg-ink-800/50">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2.5"><Avatar name={a.actorName} size={26} /><span className="font-semibold">{a.actorName}</span></span>
                    </td>
                    <td className="px-5 py-3.5"><Badge tone={a.action.includes("delete") || a.action.includes("suspend") ? "flare" : a.action.includes("create") || a.action.includes("save") ? "pulse" : "mist"} className="num">{a.action}</Badge></td>
                    <td className="px-5 py-3.5 text-mist-400">{a.resource} <span className="num text-[11px] text-mist-500">#{a.resourceId}</span></td>
                    <td className="max-w-[220px] truncate px-5 py-3.5 text-mist-400">{a.meta ?? "—"}</td>
                    <td className="num px-5 py-3.5 text-[11.5px] text-mist-500">{timeAgo(a.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <p className="mt-6 text-center text-[13px] text-mist-500">No audit entries match your search.</p>}
        </div>
      )}
    </AdminShell>
  );
}
