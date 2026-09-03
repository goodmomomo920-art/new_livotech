import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { FAQS } from "../lib/faqs";
import { I } from "../components/icons";
import { Btn, Field, SectionHead, TextArea, TextInput, usePageTitle } from "../components/ui";
import { Counter, Reveal, Stagger, StaggerItem } from "../lib/motion";

/* ---------------------------------- About ---------------------------------- */

export function AboutPage() {
  usePageTitle("About");
  const { state } = useStore();
  const milestones = [
    { y: "2019", t: "First website shipped", b: "A pharmacy storefront built in a weekend for a neighbor. It still runs." },
    { y: "2021", t: "Systems era begins", b: "The same pharmacy needed a register. SwiftPOS v1 was born between shifts." },
    { y: "2023", t: "One platform, many products", b: "Websites, systems and downloads merged into a single catalog and dashboard." },
    { y: "2025", t: "The add-on economy", b: "Loyalty, delivery, coupons — modular capabilities linked product-by-product." },
  ];
  return (
    <div>
      <section className="relative border-b border-mist-100/8 bg-ink-900/60 py-20">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(70%_90%_at_50%_0%,black,transparent)]" />
        <div className="container-x relative grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <Reveal>
            <p className="eyebrow mb-3 flex items-center gap-2.5"><span className="inline-block h-px w-7 bg-pulse-400/70" />About {state.settings.brand}</p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">We build the boring parts <span className="text-pulse-400">once</span>, so you skip them forever</h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-mist-400">
              LivoTech exists because every local business deserves the same infrastructure big companies take for granted —
              a storefront that sells, a register that doesn't lie, stock that warns you early. We productize that work and sell it fairly.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card grid grid-cols-2 gap-6 p-7 text-center">
              {[
                { n: state.products.filter((p) => p.active).length, l: "products live" },
                { n: state.addons.length, l: "add-ons" },
                { n: state.users.filter((u) => u.role === "customer").length, l: "customers" },
                { n: state.orders.filter((o) => o.paymentStatus === "paid").length, l: "orders" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="num text-4xl font-bold text-mist-100"><Counter to={s.n} /></p>
                  <p className="mt-1 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-mist-500">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-x py-20">
        <SectionHead eyebrow="Timeline" title="How the ecosystem grew" />
        <div className="relative ml-3 space-y-10 border-l border-mist-100/15 pl-8">
          {milestones.map((m, i) => (
            <Reveal key={m.y} delay={i * 0.07}>
              <div className="relative">
                <span className="absolute -left-[41px] top-1 grid size-6 place-items-center rounded-full border border-pulse-400/50 bg-ink-900">
                  <span className="size-2 rounded-full bg-pulse-400" />
                </span>
                <p className="num text-[12px] font-bold tracking-widest text-pulse-300">{m.y}</p>
                <h3 className="mt-1 font-display text-xl font-bold tracking-tight">{m.t}</h3>
                <p className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed text-mist-400">{m.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-mist-100/8 bg-ink-900/60 py-20">
        <div className="container-x">
          <SectionHead eyebrow="Principles" title="Three rules we won't bend" />
          <Stagger className="grid gap-5 md:grid-cols-3">
            {[
              { icon: "shield", t: "Security is the product", b: "Ownership checks on every download, validation on every price, no client-trusted payments. The boring locks are the feature." },
              { icon: "layers", t: "Everything is data", b: "Products, types, categories and add-on links are records, not code paths. New industries plug in without rebuilds." },
              { icon: "spark", t: "Craft over templates", b: "Every screen you're looking at was designed as a portfolio piece — motion, type and depth included." },
            ].map((p) => (
              <StaggerItem key={p.t} className="h-full">
                <div className="card card-hover h-full p-6">
                  <span className="mb-4 grid size-11 place-items-center rounded-xl border border-mist-100/12 bg-ink-800 text-pulse-300"><I name={p.icon} size={19} /></span>
                  <h3 className="font-display text-lg font-semibold tracking-tight">{p.t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-mist-400">{p.b}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------- Contact ---------------------------------- */

export function ContactPage() {
  usePageTitle("Contact");
  const { state, sendContact, toast } = useStore();
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || form.body.trim().length < 10) {
      setErr("Please fill every field — the message needs at least 10 characters.");
      return;
    }
    setBusy(true);
    try {
      await sendContact(form.name.trim(), form.email.trim(), form.subject.trim(), form.body.trim());
      setSent(true);
      toast("success", "Message received", "We reply within one business day.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <section className="relative border-b border-mist-100/8 bg-ink-900/60 py-16">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(70%_90%_at_50%_0%,black,transparent)]" />
        <div className="container-x relative">
          <Reveal>
            <p className="eyebrow mb-3 flex items-center gap-2.5"><span className="inline-block h-px w-7 bg-pulse-400/70" />Contact</p>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Talk to a <span className="text-pulse-400">human</span> who built the product</h1>
            <p className="mt-4 max-w-xl text-[15px] text-mist-400">Pre-sale questions, fit checks, custom work — one form, real replies.</p>
          </Reveal>
        </div>
      </section>
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="space-y-4">
            {[
              { icon: "mail", t: "General", v: state.settings.contactEmail },
              { icon: "headset", t: "Support", v: state.settings.supportEmail },
              { icon: "clock", t: "Response time", v: "Within 1 business day" },
            ].map((c) => (
              <div key={c.t} className="card flex items-center gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-mist-100/12 bg-ink-800 text-pulse-300"><I name={c.icon} size={19} /></span>
                <div>
                  <p className="text-[11.5px] font-semibold uppercase tracking-wider text-mist-500">{c.t}</p>
                  <p className="font-display text-[15px] font-semibold text-mist-100">{c.v}</p>
                </div>
              </div>
            ))}
            <div className="card border-solar-400/30 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-solar-300"><I name="info" size={15} /> Already a customer?</p>
              <p className="mt-1.5 text-[13px] text-mist-400">Use the dashboard support desk instead — tickets there get priority routing.</p>
              <Link to="/dashboard/support" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-pulse-300 hover:text-pulse-400">Open support desk <I name="arrowR" size={13} /></Link>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          {sent ? (
            <div className="card flex h-full flex-col items-center justify-center p-10 text-center">
              <span className="mb-5 grid size-16 place-items-center rounded-full border border-pulse-400/50 bg-pulse-400/10 text-pulse-300"><I name="check" size={28} strokeWidth={2.2} /></span>
              <h2 className="font-display text-2xl font-bold">Message on its way</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist-400">Thanks, {form.name.split(" ")[0]} — we'll reply to <span className="text-mist-200">{form.email}</span> within one business day.</p>
              <div className="mt-6 flex gap-3">
                <Btn variant="outline" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", body: "" }); }}>Send another</Btn>
                <Link to="/products"><Btn icon="arrowR">Browse products</Btn></Link>
              </div>
            </div>
          ) : (
            <div className="card space-y-5 p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Salma Adel" /></Field>
                <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@business.com" /></Field>
              </div>
              <Field label="Subject"><TextInput value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Multi-branch restaurant website?" /></Field>
              <Field label="Message" hint="min 10 characters"><TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Tell us what you run and what you need…" /></Field>
              {err && <p className="flex items-center gap-2 rounded-lg border border-flare-500/30 bg-flare-500/8 px-3.5 py-2.5 text-[13px] text-flare-300"><I name="alert" size={14} /> {err}</p>}
              <Btn size="lg" icon="send" loading={busy} onClick={submit} className="w-full sm:w-auto">Send message</Btn>
            </div>
          )}
        </Reveal>
      </section>
    </div>
  );
}

/* ---------------------------------- FAQ ---------------------------------- */

export function FaqPage() {
  usePageTitle("FAQ");
  const [open, setOpen] = useState(0);
  return (
    <div>
      <section className="relative border-b border-mist-100/8 bg-ink-900/60 py-16">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(70%_90%_at_50%_0%,black,transparent)]" />
        <div className="container-x relative">
          <Reveal>
            <p className="eyebrow mb-3 flex items-center gap-2.5"><span className="inline-block h-px w-7 bg-pulse-400/70" />Help center</p>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">Frequently asked, <span className="text-pulse-400">honestly</span> answered</h1>
          </Reveal>
        </div>
      </section>
      <section className="container-x max-w-3xl py-14">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i * 0.04, 0.2)}>
              <div className={`card overflow-hidden transition-colors ${open === i ? "border-pulse-400/40" : ""}`}>
                <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-display text-[15px] font-semibold">{f.q}</span>
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full border border-mist-100/15 text-mist-400 transition-transform duration-300 ${open === i ? "rotate-180 border-pulse-400/50 text-pulse-300" : ""}`}><I name="chevD" size={14} /></span>
                </button>
                <div className="grid transition-[grid-template-rows] duration-300" style={{ gridTemplateRows: open === i ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden"><p className="px-5 pb-5 text-[13.5px] leading-relaxed text-mist-400">{f.a}</p></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="card mt-10 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-display text-xl font-bold">Still curious about something?</h2>
            <p className="mt-1 text-sm text-mist-400">Product-specific FAQs live on each product page.</p>
          </div>
          <Link to="/contact"><Btn icon="send">Ask us directly</Btn></Link>
        </div>
      </section>
    </div>
  );
}
