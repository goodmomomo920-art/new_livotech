import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../../lib/store";
import { I } from "../../components/icons";
import { Avatar, Badge, Btn, Confirm, EmptyState, Field, fmtDate, fmtDateTime, Modal, money, Pagination, Select, StatusBadge, TextArea, TextInput, timeAgo, usePageTitle } from "../../components/ui";
import { downloadInvoicePdf } from "../../lib/invoice";
import { Reveal, Stagger, StaggerItem } from "../../lib/motion";
import { DashShell } from "./DashboardA";
import type { Order } from "../../lib/types";

/* ------------------------------- orders ------------------------------- */

export function OrdersPage() {
  usePageTitle("My orders");
  const { me, state } = useStore();
  const [detail, setDetail] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const mine = state.orders.filter((o) => o.customerId === me?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const paged = mine.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashShell title="Orders" sub="Every purchase, snapshot-priced for history accuracy">
      <div className="mx-auto max-w-5xl">
        {mine.length === 0 ? (
          <EmptyState icon="receipt" title="No orders yet" body="Completed purchases appear here with itemized snapshots — prices stay accurate even if the catalog changes."
            action={<Link to="/products"><Btn icon="arrowR">Browse products</Btn></Link>} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-mist-100/10">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Items</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((o) => (
                    <tr key={o.id} onClick={() => setDetail(o)} className="cursor-pointer border-b border-mist-100/6 transition-colors hover:bg-ink-800/50">
                      <td className="num px-5 py-3.5 font-bold text-pulse-300">{o.number}</td>
                      <td className="px-5 py-3.5 text-mist-300">{o.items.map((i) => i.name).join(" + ")}</td>
                      <td className="px-5 py-3.5 text-mist-400">{fmtDate(o.createdAt)}</td>
                      <td className="num px-5 py-3.5 font-semibold">{money(o.total)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.paymentStatus} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6"><Pagination page={page} pageSize={pageSize} total={mine.length} onPage={setPage} /></div>
          </>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Order ${detail.number}` : ""}>
        {detail && (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.paymentStatus} />
              <Badge tone="mist">{detail.paymentMethod}</Badge>
              <Badge tone="mist" className="num">{fmtDateTime(detail.createdAt)}</Badge>
            </div>
            <div className="rounded-xl border border-mist-100/10 bg-ink-800/60 p-4">
              {detail.items.map((it) => (
                <div key={it.productId} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                  <span className="text-mist-200">{it.name}
                    <span className="ml-2 text-[11px] uppercase tracking-wider text-mist-500">{it.type}{it.interval !== "once" && ` · ${it.interval}`}</span>
                  </span>
                  <span className="num font-semibold">{money(it.total)}</span>
                </div>
              ))}
              {detail.discount > 0 && (
                <div className="flex justify-between py-2 text-[13.5px] text-solar-300"><span>Discount ({detail.couponCode})</span><span className="num">−{money(detail.discount)}</span></div>
              )}
              <div className="mt-1 flex justify-between border-t border-mist-100/10 pt-3 font-bold"><span>Total</span><span className="num text-pulse-300">{money(detail.total)}</span></div>
            </div>
            <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-mist-500">
              <I name="info" size={13} className="mt-0.5 shrink-0" /> Line items are snapshots taken at purchase time — later catalog edits never rewrite your history.
            </p>
          </div>
        )}
      </Modal>
    </DashShell>
  );
}

/* ---------------------------- subscriptions ---------------------------- */

export function SubscriptionsPage() {
  usePageTitle("My subscriptions");
  const { me, state, cancelSubscription } = useStore();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const mine = state.subscriptions.filter((s) => s.customerId === me?.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const target = mine.find((s) => s.id === cancelId);

  return (
    <DashShell title="Subscriptions" sub="Renewals, plans and cancellations">
      <div className="mx-auto max-w-5xl">
        {mine.length === 0 ? (
          <EmptyState icon="refresh" title="You don't have any active subscriptions" body="Systems and SaaS products subscribe monthly or yearly — manage them all here."
            action={<Link to="/products?type=system"><Btn icon="arrowR">Browse systems</Btn></Link>} />
        ) : (
          <Stagger className="grid gap-5 md:grid-cols-2">
            {mine.map((s) => {
              const p = state.products.find((x) => x.id === s.productId);
              const addon = state.addons.find((a) => a.id === s.productId);
              const name = p?.name ?? addon?.name ?? s.plan;
              const daysLeft = Math.ceil((new Date(s.nextBillingAt).getTime() - Date.now()) / 864e5);
              return (
                <StaggerItem key={s.id} className="h-full">
                  <div className={`card card-hover flex h-full flex-col p-5 ${s.status === "past_due" ? "border-solar-400/50" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-xl border border-wave-400/30 bg-wave-400/10 text-wave-300">
                        <I name={p ? "cpu" : "spark"} size={19} />
                      </span>
                      <StatusBadge status={s.status} />
                    </div>
                    <h3 className="mt-4 font-display text-[17px] font-bold tracking-tight">{s.plan}</h3>
                    <p className="text-[12.5px] text-mist-500">{name} · started {fmtDate(s.startDate)}</p>
                    <div className="num mt-4 grid grid-cols-2 gap-3 text-[12.5px] text-mist-400">
                      <span>Price<br /><b className="text-[15px] text-mist-100">{money(s.price)}<span className="text-[11px] text-mist-500">/{s.interval === "monthly" ? "mo" : "yr"}</span></b></span>
                      <span>Next billing<br /><b className={`text-[13px] ${s.status === "past_due" ? "text-solar-300" : "text-mist-100"}`}>{s.status === "cancelled" ? "—" : fmtDate(s.nextBillingAt)}</b></span>
                    </div>
                    {s.status === "active" && daysLeft <= 7 && daysLeft >= 0 && (
                      <p className="mt-3 flex items-center gap-2 rounded-lg border border-wave-400/30 bg-wave-400/8 px-3 py-2 text-[12px] text-wave-300">
                        <I name="clock" size={13} /> Renews in {daysLeft} day{daysLeft === 1 ? "" : "s"}
                      </p>
                    )}
                    {s.status === "past_due" && (
                      <p className="mt-3 flex items-center gap-2 rounded-lg border border-solar-400/40 bg-solar-400/8 px-3 py-2 text-[12px] text-solar-300">
                        <I name="alert" size={13} /> Payment failed — update your method via support to resume.
                      </p>
                    )}
                    <div className="mt-auto flex gap-2 pt-4">
                      {s.status === "active" && <Btn size="sm" variant="danger" onClick={() => setCancelId(s.id)}>Cancel plan</Btn>}
                      {s.status === "cancelled" && <Badge tone="mist" className="self-start">Ended {s.cancelledAt ? fmtDate(s.cancelledAt) : ""}</Badge>}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
      <Confirm
        open={!!cancelId} onClose={() => setCancelId(null)} title="Cancel subscription?"
        body={target ? `${target.plan} stops at the end of the current period (${fmtDate(target.nextBillingAt)}). You keep access until then, and ownership flips to expired afterwards.` : ""}
        confirmLabel="Cancel subscription"
        onConfirm={async () => { if (cancelId) await cancelSubscription(cancelId); }}
      />
    </DashShell>
  );
}

/* -------------------------------- billing -------------------------------- */

export function BillingPage() {
  usePageTitle("Billing");
  const { me, state, toast } = useStore();
  const paid = state.orders.filter((o) => o.customerId === me?.id && o.paymentStatus === "paid").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const spent = paid.reduce((s, o) => s + o.total, 0);
  const activeSubValue = state.subscriptions.filter((s) => s.customerId === me?.id && s.status === "active" && s.interval === "monthly").reduce((s, x) => s + x.price, 0);

  const invoice = (o: Order) => {
    downloadInvoicePdf(
      o,
      { brand: state.settings.brand, contactEmail: state.settings.contactEmail },
      { name: me?.name ?? "", email: me?.email ?? "", company: me?.company },
    );
    toast("success", "Invoice downloaded", `${o.number} saved as a PDF.`);
  };

  return (
    <DashShell title="Billing" sub="Payment history and invoices">
      <div className="mx-auto max-w-5xl space-y-8">
        <Stagger className="grid gap-4 sm:grid-cols-3">
          <StaggerItem><div className="card p-5"><p className="text-[11.5px] font-semibold uppercase tracking-wider text-mist-500">Lifetime spend</p><p className="num mt-2 text-3xl font-bold text-mist-100">{money(spent)}</p></div></StaggerItem>
          <StaggerItem><div className="card p-5"><p className="text-[11.5px] font-semibold uppercase tracking-wider text-mist-500">Monthly commitments</p><p className="num mt-2 text-3xl font-bold text-mist-100">{money(activeSubValue)}<span className="text-sm text-mist-500">/mo</span></p></div></StaggerItem>
          <StaggerItem><div className="card p-5"><p className="text-[11.5px] font-semibold uppercase tracking-wider text-mist-500">Paid invoices</p><p className="num mt-2 text-3xl font-bold text-mist-100">{paid.length}</p></div></StaggerItem>
        </Stagger>

        <section>
          <h3 className="mb-4 font-display text-lg font-bold tracking-tight">Payment history</h3>
          {paid.length === 0 ? (
            <EmptyState icon="card" title="No payments yet" body="Paid orders generate invoices you can download any time." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-mist-100/10">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-mist-100/10 bg-ink-800/70 text-[11px] uppercase tracking-wider text-mist-500">
                    <th className="px-5 py-3 font-semibold">Invoice</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Method</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paid.map((o) => (
                    <tr key={o.id} className="border-b border-mist-100/6 transition-colors hover:bg-ink-800/50">
                      <td className="num px-5 py-3.5 font-bold text-pulse-300">{o.number}</td>
                      <td className="px-5 py-3.5 text-mist-400">{fmtDate(o.createdAt)}</td>
                      <td className="px-5 py-3.5 text-mist-400">{o.paymentMethod}</td>
                      <td className="num px-5 py-3.5 font-semibold">{money(o.total)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Btn size="sm" variant="ghost" icon="download" onClick={() => invoice(o)}>Invoice</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="flex items-center gap-2 text-[12px] text-mist-500"><I name="shield" size={13} className="text-pulse-400" /> The platform is payment-provider agnostic — cards and wallets settle through verified server-side webhooks, never frontend callbacks.</p>
      </div>
    </DashShell>
  );
}

/* ------------------------------- downloads ------------------------------- */

export function DownloadsPage() {
  usePageTitle("My downloads");
  const { me, state, recordDownload, toast } = useStore();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const owned = state.ownerships.filter((o) => o.customerId === me?.id && o.status !== "cancelled")
    .map((o) => state.products.find((p) => p.id === o.productId))
    .filter((p): p is NonNullable<typeof p> => !!p && p.downloadable);
  const history = state.downloads.filter((d) => d.userId === me?.id);

  const dl = async (productId: string, fileId: string, fileName: string) => {
    setBusyKey(fileId);
    try {
      await recordDownload(productId, fileId, fileName);
      toast("success", "Download started", `${fileName} — ownership verified, signed URL issued.`);
    } catch (e) {
      toast("error", "Download blocked", e instanceof Error ? e.message : "Authorization failed.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <DashShell title="Downloads" sub="Files unlock only for products you own">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* how it works */}
        <Reveal>
          <div className="card border-wave-400/30 p-6">
            <p className="flex items-center gap-2 font-display text-[16px] font-bold"><I name="info" size={17} className="text-wave-300" /> How downloading works</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { n: "1", t: "Files unlock instantly", b: "The moment payment is verified, every file for your purchase appears here and on the success screen." },
                { n: "2", t: "Signed & authorized", b: "Each click issues a signed URL after checking your ownership — paid files are never publicly accessible." },
                { n: "3", t: "Updates included", b: "New versions land in this same list, free. Re-download anything, any time." },
              ].map((s) => (
                <div key={s.n} className="rounded-xl border border-mist-100/10 bg-ink-800/60 p-4">
                  <span className="num grid size-7 place-items-center rounded-lg bg-wave-400/12 text-[13px] font-bold text-wave-300">{s.n}</span>
                  <p className="mt-2.5 text-[13.5px] font-bold">{s.t}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-mist-400">{s.b}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <section>
          <h3 className="mb-4 font-display text-lg font-bold tracking-tight">Your files</h3>
          {owned.length === 0 ? (
            <EmptyState icon="download" title="Your purchased downloads will appear here" body="Buy any digital product, e-book or template and its files unlock instantly — with every future update."
              action={<Link to="/digital-products"><Btn icon="arrowR">Browse digital products</Btn></Link>} />
          ) : (
            <div className="space-y-4">
              {owned.map((p) => (
                <Reveal key={p.id}>
                  <div className="card overflow-hidden">
                    <div className="flex items-center gap-4 border-b border-mist-100/10 bg-ink-800/50 p-4">
                      <img src={p.image} alt="" className="h-12 w-16 rounded-md border border-mist-100/12 object-cover object-top" />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-display text-[15px] font-bold">{p.name}</h4>
                        <p className="text-[11.5px] text-mist-500">v{p.version} · {p.files.length} files · updates included</p>
                      </div>
                      <Badge tone="pulse" dot>Owned</Badge>
                    </div>
                    {p.downloadNote && (
                      <p className="flex items-start gap-2.5 border-b border-mist-100/10 bg-wave-400/6 px-4 py-3 text-[12.5px] leading-relaxed text-mist-300">
                        <I name="wand" size={14} className="mt-0.5 shrink-0 text-wave-300" />
                        <span><b className="text-wave-300">How to use these files:</b> {p.downloadNote}</span>
                      </p>
                    )}
                    <div className="divide-y divide-mist-100/6">
                      {p.files.map((f) => {
                        const count = history.filter((h) => h.fileId === f.id).length;
                        return (
                          <div key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <span className="grid size-9 place-items-center rounded-lg border border-mist-100/12 bg-ink-800 text-mist-300"><I name="file" size={16} /></span>
                            <div className="min-w-0 flex-1">
                              <p className="num truncate text-[13px] font-semibold text-mist-100">{f.name}</p>
                              <p className="text-[11px] text-mist-500">{f.type} · {f.size} · v{f.version}{count > 0 && ` · downloaded ${count}×`}</p>
                            </div>
                            <Btn size="sm" variant="outline" icon="download" loading={busyKey === f.id} onClick={() => dl(p.id, f.id, f.name)}>
                              {busyKey === f.id ? "Signing URL…" : "Download"}
                            </Btn>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {history.length > 0 && (
          <section>
            <h3 className="mb-4 font-display text-lg font-bold tracking-tight">Download history</h3>
            <div className="card divide-y divide-mist-100/6">
              {history.slice(0, 8).map((h) => (
                <div key={h.id} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                  <I name="clock" size={14} className="text-mist-500" />
                  <span className="num flex-1 truncate text-mist-300">{h.fileName}</span>
                  <span className="text-[11.5px] text-mist-500">{timeAgo(h.at)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashShell>
  );
}

/* -------------------------------- support -------------------------------- */

export function SupportPage() {
  usePageTitle("Support");
  const { me, state, createTicket, replyTicket, setTicketStatus, toast } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "Websites", body: "" });
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = state.tickets.filter((t) => t.customerId === me?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const submitNew = async () => {
    if (form.subject.trim().length < 4 || form.body.trim().length < 10) {
      toast("error", "Add a little more detail", "Subject needs 4+ characters, message 10+.");
      return;
    }
    setBusy(true);
    try {
      await createTicket(form.subject.trim(), form.category, form.body.trim());
      setCreating(false);
      setForm({ subject: "", category: "Websites", body: "" });
      toast("success", "Ticket opened", "Support replies land in your notifications.");
    } catch (e) {
      toast("error", "Couldn't open ticket", e instanceof Error ? e.message : "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (ticketId: string) => {
    if (reply.trim().length < 2 || !me) return;
    setBusy(true);
    try {
      await replyTicket(ticketId, reply.trim(), "customer", me.name);
      setReply("");
      toast("success", "Reply sent", "The thread moved back to the support queue.");
    } catch (e) {
      toast("error", "Couldn't send reply", e instanceof Error ? e.message : "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashShell title="Support" sub="Tickets, threads and replies" actions={<Btn size="sm" icon="plus" onClick={() => setCreating(true)}>New ticket</Btn>}>
      <div className="mx-auto max-w-4xl">
        {mine.length === 0 && !creating ? (
          <EmptyState icon="headset" title="No tickets yet" body="Questions about a product, a domain, a charge? Open a ticket — real humans reply."
            action={<Btn icon="plus" onClick={() => setCreating(true)}>Open your first ticket</Btn>} />
        ) : (
          <div className="space-y-3">
            {mine.map((t) => (
              <Reveal key={t.id}>
                <div className={`card w-full p-5 transition-all hover:border-pulse-400/40 ${openId === t.id ? "border-pulse-400/50" : ""}`}>
                  <button onClick={() => setOpenId(openId === t.id ? null : t.id)} className="w-full text-left">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="num text-[12px] font-bold text-pulse-300">{t.number}</span>
                      <StatusBadge status={t.status} />
                      <StatusBadge status={t.priority} />
                      <Badge tone="mist">{t.category}</Badge>
                      <span className="ml-auto text-[11.5px] text-mist-500">{timeAgo(t.createdAt)}</span>
                    </div>
                    <h3 className="mt-2 font-display text-[15.5px] font-semibold">{t.subject}</h3>
                    <p className="mt-1 line-clamp-1 text-[13px] text-mist-400">{t.messages[t.messages.length - 1]?.body}</p>
                  </button>
                  {openId === t.id && (
                    <div className="mt-4 space-y-3 border-t border-mist-100/10 pt-4">
                      {t.messages.map((m) => (
                        <div key={m.id} className={`flex gap-3 ${m.author === "customer" ? "flex-row-reverse" : ""}`}>
                          <Avatar name={m.authorName} size={30} />
                          <div className={`max-w-[85%] rounded-xl border px-4 py-3 ${m.author === "customer" ? "border-pulse-400/30 bg-pulse-400/[0.07]" : "border-mist-100/12 bg-ink-800/70"}`}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-mist-500">{m.authorName} · {m.author === "support" ? "LivoTech" : "you"}</p>
                            <p className="mt-1 text-[13.5px] leading-relaxed text-mist-200">{m.body}</p>
                            <p className="mt-1.5 text-[10.5px] text-mist-500">{fmtDateTime(m.at)}</p>
                          </div>
                        </div>
                      ))}
                      {t.status !== "closed" && (
                        <div className="flex gap-2.5 pt-1">
                          <TextInput value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" onKeyDown={(e) => e.key === "Enter" && sendReply(t.id)} />
                          <Btn icon="send" loading={busy} onClick={() => sendReply(t.id)} className="shrink-0">Send</Btn>
                        </div>
                      )}
                      {t.status !== "closed" && t.status !== "resolved" && (
                        <div className="flex justify-end">
                          <Btn size="sm" variant="ghost" icon="check" onClick={async () => { await setTicketStatus(t.id, "closed"); toast("info", "Ticket closed", "Reopen any time with a new ticket."); }}>
                            Close ticket
                          </Btn>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Open a support ticket"
        footer={<><Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn><Btn icon="send" loading={busy} onClick={submitNew}>Submit ticket</Btn></>}>
        <div className="space-y-4">
          <Field label="Subject"><TextInput value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Connecting a custom domain" /></Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["Websites", "Systems", "Billing", "Downloads", "Account", "Other"].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Message" hint="min 10 characters"><TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What happened? What did you expect? Include order numbers if relevant." /></Field>
          <p className="flex items-center gap-2 text-[11.5px] text-mist-500"><I name="upload" size={13} /> Attachments are supported in production (Supabase Storage) — omitted in this demo.</p>
        </div>
      </Modal>
    </DashShell>
  );
}

/* -------------------------------- settings -------------------------------- */

export function SettingsPage() {
  usePageTitle("Account settings");
  const { me, updateProfile, changePassword, logout, toast } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState(me?.name ?? "");
  const [company, setCompany] = useState(me?.company ?? "");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState<"profile" | "pw" | null>(null);
  const [prefs, setPrefs] = useState({ productUpdates: true, renewalAlerts: true, offers: false });

  const saveProfile = async () => {
    if (name.trim().length < 2) { toast("error", "Name too short", "Give us at least 2 characters."); return; }
    setBusy("profile");
    await updateProfile(name.trim(), company.trim());
    setBusy(null);
    toast("success", "Profile updated", "Your changes are saved.");
  };
  const savePw = async () => {
    if (pw.next !== pw.confirm) { toast("error", "Passwords don't match", "Double-check the confirmation field."); return; }
    setBusy("pw");
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      toast("success", "Password changed", "Use it next time you log in.");
    } catch (e) {
      toast("error", "Couldn't change password", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <DashShell title="Settings" sub="Profile, security and preferences">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="card p-6">
            <h3 className="mb-1 font-display text-lg font-bold tracking-tight">Profile</h3>
            <p className="mb-5 text-[13px] text-mist-500">Shown on invoices and support threads.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl border border-mist-100/10 bg-ink-800/60 p-4">
                <Avatar name={name || me?.name || "?"} size={48} />
                <div>
                  <p className="font-display font-semibold">{me?.name}</p>
                  <p className="num text-[12px] text-mist-500">{me?.email}</p>
                  <Badge tone="pulse" className="mt-1.5">Customer</Badge>
                </div>
              </div>
              <Field label="Full name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Company" hint="optional"><TextInput value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Adel Pharma" /></Field>
              <Btn icon="check" loading={busy === "profile"} onClick={saveProfile}>Save profile</Btn>
            </div>
          </div>
        </Reveal>
        <div className="space-y-6">
          <Reveal delay={0.06}>
            <div className="card p-6">
              <h3 className="mb-1 font-display text-lg font-bold tracking-tight">Security</h3>
              <p className="mb-5 text-[13px] text-mist-500">Rotate your password regularly — sessions persist across devices.</p>
              <div className="space-y-4">
                <Field label="Current password"><TextInput type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password" hint="min 8 chars"><TextInput type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
                  <Field label="Confirm"><TextInput type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
                </div>
                <Btn icon="lock" loading={busy === "pw"} onClick={savePw}>Update password</Btn>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card p-6">
              <h3 className="mb-4 font-display text-lg font-bold tracking-tight">Notifications</h3>
              <div className="space-y-3">
                {([
                  ["productUpdates", "Product updates", "Version bumps and changelogs for things you own"],
                  ["renewalAlerts", "Renewal alerts", "7-day and 1-day warnings before billing"],
                  ["offers", "Offers & drops", "New products and coupon codes"],
                ] as const).map(([key, t, b]) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-mist-100/10 bg-ink-800/50 px-4 py-3">
                    <div><p className="text-[13.5px] font-semibold">{t}</p><p className="text-[11.5px] text-mist-500">{b}</p></div>
                    <button role="switch" aria-checked={prefs[key]}
                      onClick={() => { setPrefs({ ...prefs, [key]: !prefs[key] }); toast("info", "Preference saved", `${t} ${!prefs[key] ? "enabled" : "muted"}.`); }}
                      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${prefs[key] ? "bg-pulse-500 border-pulse-400/70" : "bg-ink-700 border-mist-100/15"}`}>
                      <span className={`absolute top-0.5 size-[18px] rounded-full bg-ink-950 transition-transform ${prefs[key] ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="card border-flare-500/25 p-6">
              <h3 className="mb-2 font-display text-lg font-bold tracking-tight text-flare-300">Session</h3>
              <p className="mb-4 text-[13px] text-mist-500">Log out of this browser. Ownership and data stay safe.</p>
              <Btn variant="danger" icon="logout" onClick={() => { logout(); nav("/"); }}>Log out</Btn>
            </div>
          </Reveal>
        </div>
      </div>
    </DashShell>
  );
}
