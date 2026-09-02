import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { format, formatDistanceToNowStrict } from "date-fns";
import { I } from "./icons";
import { useStore } from "../lib/store";

/* ------------------------------ formatting ------------------------------ */

export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
export const fmtDate = (iso: string) => format(new Date(iso), "MMM d, yyyy");
export const fmtDateTime = (iso: string) => format(new Date(iso), "MMM d, yyyy · HH:mm");
export const timeAgo = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · LivoTech` : "LivoTech — Digital products, tools & solutions";
  }, [title]);
}

/* App areas must never be indexed */
export function useNoIndex() {
  useEffect(() => {
    let m = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!m) {
      m = document.createElement("meta");
      m.name = "robots";
      document.head.appendChild(m);
    }
    m.content = "noindex, nofollow";
    return () => { if (m) m.content = "index, follow"; };
  }, []);
}

export function useDebounced<T>(value: T, ms = 280): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* -------------------------------- button -------------------------------- */

type BtnVariant = "primary" | "solar" | "soft" | "ghost" | "outline" | "danger";
const btnBase =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 select-none whitespace-nowrap disabled:opacity-45 disabled:pointer-events-none active:scale-[0.97]";
const btnVariants: Record<BtnVariant, string> = {
  primary:
    "bg-pulse-400 text-ink-950 hover:bg-pulse-300 shadow-[0_10px_26px_-12px_rgba(5,150,105,0.65)] hover:shadow-[0_14px_30px_-12px_rgba(5,150,105,0.7)]",
  solar: "bg-solar-400 text-ink-950 hover:bg-solar-300 shadow-[0_10px_26px_-12px_rgba(217,119,6,0.55)]",
  soft: "bg-ink-750 text-mist-200 hover:bg-ink-700 border border-mist-100/10",
  ghost: "text-mist-400 hover:text-mist-100 hover:bg-ink-800",
  outline: "border border-mist-100/15 text-mist-200 hover:border-pulse-400/60 hover:text-pulse-300 hover:bg-pulse-400/5",
  danger: "bg-flare-500/10 text-flare-300 border border-flare-500/30 hover:bg-flare-500/15",
};
const btnSizes = { sm: "text-[13px] px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-[15px] px-6 py-3" };

export function Btn({
  variant = "primary", size = "md", loading, icon, children, className = "", ...rest
}: { variant?: BtnVariant; size?: keyof typeof btnSizes; loading?: boolean; icon?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? (
        <span className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
      ) : (
        icon && <I name={icon} size={size === "sm" ? 15 : 17} />
      )}
      {children}
    </button>
  );
}

/* --------------------------------- badges --------------------------------- */

export type Tone = "pulse" | "solar" | "flare" | "wave" | "mist";
const tones: Record<Tone, string> = {
  pulse: "bg-pulse-400/10 text-pulse-300 border-pulse-400/30",
  solar: "bg-solar-400/10 text-solar-300 border-solar-400/30",
  flare: "bg-flare-500/10 text-flare-300 border-flare-500/30",
  wave: "bg-wave-400/10 text-wave-300 border-wave-400/30",
  mist: "bg-mist-100/5 text-mist-400 border-mist-100/12",
};
const dots: Record<Tone, string> = {
  pulse: "bg-pulse-400", solar: "bg-solar-400", flare: "bg-flare-400", wave: "bg-wave-400", mist: "bg-mist-500",
};

export function Badge({ tone = "mist", children, dot, className = "" }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11.5px] font-semibold tracking-wide ${tones[tone]} ${className}`}>
      {dot && <span className={`size-1.5 rounded-full ${dots[tone]}`} />}
      {children}
    </span>
  );
}

const statusTone: Record<string, { tone: Tone; label: string }> = {
  pending: { tone: "solar", label: "Pending" },
  processing: { tone: "wave", label: "Processing" },
  completed: { tone: "pulse", label: "Completed" },
  cancelled: { tone: "mist", label: "Cancelled" },
  refunded: { tone: "flare", label: "Refunded" },
  paid: { tone: "pulse", label: "Paid" },
  failed: { tone: "flare", label: "Failed" },
  active: { tone: "pulse", label: "Active" },
  suspended: { tone: "flare", label: "Suspended" },
  expired: { tone: "mist", label: "Expired" },
  trial: { tone: "wave", label: "Trial" },
  past_due: { tone: "solar", label: "Past due" },
  paused: { tone: "wave", label: "Paused" },
  open: { tone: "pulse", label: "Open" },
  in_progress: { tone: "wave", label: "In progress" },
  waiting: { tone: "solar", label: "Waiting for customer" },
  resolved: { tone: "pulse", label: "Resolved" },
  closed: { tone: "mist", label: "Closed" },
  low: { tone: "mist", label: "Low" },
  normal: { tone: "wave", label: "Normal" },
  high: { tone: "solar", label: "High" },
  urgent: { tone: "flare", label: "Urgent" },
  draft: { tone: "mist", label: "Draft" },
  featured: { tone: "solar", label: "Featured" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = statusTone[status] ?? { tone: "mist" as Tone, label: status };
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}

/* --------------------------------- inputs --------------------------------- */

export const inpCls =
  "w-full rounded-lg bg-ink-800 border border-mist-100/12 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-500 outline-none transition-colors focus:border-pulse-400/60 focus:bg-ink-900";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold text-mist-300">
        {label}
        {hint && <span className="text-[11px] font-normal text-mist-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inpCls} ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inpCls} appearance-none pr-9 bg-no-repeat ${props.className ?? ""}`}
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235d6b7e' stroke-width='2'%3E%3Cpath d='m6 9.5 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.8rem center",
      }}
    />
  );
}
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inpCls} min-h-[110px] resize-y ${props.className ?? ""}`} />;
}

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ${on ? "bg-pulse-500 border-pulse-400/70" : "bg-ink-700 border-mist-100/15"} ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      <span className={`absolute top-0.5 size-[18px] rounded-full bg-ink-950 shadow transition-transform duration-200 ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <I name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inpCls} pl-9`} />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-500 hover:text-mist-200">
          <I name="close" size={14} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------ modal & drawer ------------------------------ */

function OverlayShell({ open, onClose, children, align = "center" }: { open: boolean; onClose: () => void; children: ReactNode; align?: "center" | "right" }) {
  const [render, setRender] = useState(open);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (open) {
      setRender(true);
      const t = requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
      document.body.style.overflow = "hidden";
      return () => { cancelAnimationFrame(t); document.body.style.overflow = ""; };
    }
    setShow(false);
    const t = setTimeout(() => setRender(false), 240);
    return () => clearTimeout(t);
  }, [open]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!render) return null;
  return createPortal(
    <div className={`fixed inset-0 z-[90] ${align === "center" ? "flex items-center justify-center p-4" : "flex justify-end"}`}>
      <div className={`absolute inset-0 bg-mist-100/45 backdrop-blur-[3px] transition-opacity duration-200 ${show ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        role="dialog" aria-modal="true"
        className={`relative transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          align === "center"
            ? `w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl card shadow-[0_40px_90px_-30px_rgba(22,32,43,0.45)] ${show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.96] translate-y-3"}`
            : `h-full w-full max-w-md bg-ink-900 border-l border-mist-100/10 shadow-2xl ${show ? "translate-x-0" : "translate-x-full"}`
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return (
    <OverlayShell open={open} onClose={onClose}>
      <div className={wide ? "max-w-2xl mx-auto w-full" : ""}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-mist-100/10 bg-ink-900/95 px-6 py-4 backdrop-blur">
          <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-md p-1.5 text-mist-400 hover:bg-ink-750 hover:text-mist-100 transition-colors">
            <I name="close" size={17} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-mist-100/10 bg-ink-900/95 px-6 py-4 backdrop-blur">{footer}</div>}
      </div>
    </OverlayShell>
  );
}

export function Confirm({ open, onClose, onConfirm, title, body, confirmLabel = "Confirm", tone = "danger" }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirmLabel?: string; tone?: "danger" | "primary" }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant={tone === "danger" ? "danger" : "primary"} loading={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); onClose(); }}>{confirmLabel}</Btn>
      </>}>
      <p className="text-sm leading-relaxed text-mist-300">{body}</p>
    </Modal>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  return (
    <OverlayShell open={open} onClose={onClose} align="right">
      <div className="flex items-center justify-between border-b border-mist-100/10 px-5 py-4">
        <div className="font-display text-lg font-semibold tracking-tight">{title}</div>
        <button onClick={onClose} aria-label="Close panel" className="rounded-md p-1.5 text-mist-400 hover:bg-ink-750 hover:text-mist-100">
          <I name="close" size={17} />
        </button>
      </div>
      <div className="h-[calc(100%-61px)] overflow-y-auto p-5">{children}</div>
    </OverlayShell>
  );
}

/* ---------------------------------- tabs ---------------------------------- */

export function Tabs({ tabs, active, onChange, className = "" }: { tabs: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={`flex gap-1 overflow-x-auto hide-scrollbar rounded-lg border border-mist-100/10 bg-ink-800 p-1 ${className}`} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id} role="tab" aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
            active === t.id ? "bg-ink-900 text-mist-100 shadow-sm" : "text-mist-400 hover:text-mist-200"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className={`num rounded px-1 text-[10.5px] ${active === t.id ? "bg-pulse-400/15 text-pulse-300" : "bg-ink-750 text-mist-500"}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- skeletons ------------------------------- */

export function Sk({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}
export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Sk className="aspect-[3/2] w-full rounded-none" />
      <div className="space-y-2.5 p-5">
        <Sk className="h-3 w-16" />
        <Sk className="h-5 w-3/4" />
        <Sk className="h-3 w-full" />
        <div className="flex justify-between pt-2"><Sk className="h-6 w-20" /><Sk className="h-6 w-24" /></div>
      </div>
    </div>
  );
}
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4">
      {Array.from({ length: rows }).map((_, i) => <Sk key={i} className="h-11 w-full" />)}
    </div>
  );
}

/* ------------------------------ empty / error ------------------------------ */

export function EmptyState({ icon = "box", title, body, action }: { icon?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-mist-100/20 bg-ink-800/50 px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-xl border border-mist-100/12 bg-ink-900 text-mist-400">
        <I name={icon} size={24} strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight text-mist-100">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-mist-400">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", body, retry }: { title?: string; body?: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-flare-500/25 bg-flare-500/5 px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-xl border border-flare-500/30 bg-flare-500/10 text-flare-300">
        <I name="alert" size={24} strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-mist-400">{body}</p>}
      {retry && <Btn variant="outline" className="mt-5" icon="refresh" onClick={retry}>Try again</Btn>}
    </div>
  );
}

/* -------------------------------- pagination -------------------------------- */

export function Pagination({ page, pageSize, total, onPage, onPageSize }: { page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize?: (s: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-mist-400">
      <div className="flex items-center gap-2">
        <span className="num">{total}</span> result{total === 1 ? "" : "s"}
        {onPageSize && (
          <select
            value={pageSize} aria-label="Rows per page"
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded-md border border-mist-100/12 bg-ink-900 px-2 py-1 text-xs text-mist-300 outline-none focus:border-pulse-400/60"
          >
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Btn variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><I name="chevL" size={15} /></Btn>
        <span className="num px-1 text-mist-300">{page} / {pages}</span>
        <Btn variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><I name="chevR" size={15} /></Btn>
      </div>
    </div>
  );
}

/* ---------------------------------- misc ---------------------------------- */

export function Avatar({ name, size = 34, className = "" }: { name: string; size?: number; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border border-pulse-400/30 bg-gradient-to-br from-pulse-400/15 to-wave-400/15 font-display font-semibold text-pulse-300 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function SectionHead({ eyebrow, title, sub, center }: { eyebrow: string; title: ReactNode; sub?: string; center?: boolean }) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow mb-3 flex items-center gap-2.5">{!center && <span className="inline-block h-px w-7 bg-pulse-400/70" />}{eyebrow}</p>
      <h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-mist-100 sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3.5 text-[15px] leading-relaxed text-mist-400">{sub}</p>}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} aria-hidden />;
}

/* ---------------------------------- toasts ---------------------------------- */

export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  const icons = { success: "check", error: "alert", info: "info" } as const;
  const colors = { success: "text-pulse-300 border-pulse-400/35", error: "text-flare-300 border-flare-500/40", info: "text-wave-300 border-wave-400/35" } as const;
  return createPortal(
    <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-[min(92vw,360px)] flex-col gap-2.5" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-in pointer-events-auto flex items-start gap-3 rounded-xl border bg-ink-900/97 p-3.5 shadow-[0_24px_60px_-24px_rgba(22,32,43,0.5)] ${colors[t.kind]}`}>
          <span className="mt-0.5 shrink-0"><I name={icons[t.kind]} size={17} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-mist-100">{t.title}</p>
            {t.body && <p className="mt-0.5 text-xs leading-relaxed text-mist-400">{t.body}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss notification" className="shrink-0 text-mist-500 hover:text-mist-200">
            <I name="close" size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

/* ------------------------- simulated async hook ------------------------- */

export function useSimLoad(deps: unknown[] = []) {
  const [loading, setLoading] = useState(true);
  const first = useRef(true);
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    const t = setTimeout(() => setLoading(false), 550 + Math.random() * 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return loading;
}
