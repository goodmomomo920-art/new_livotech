import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { I, Logo } from "./icons";
import { Avatar, Badge, Drawer, timeAgo } from "./ui";

const NAV = [
  { to: "/products", label: "Products" },
  { to: "/solutions", label: "Solutions" },
  { to: "/addons", label: "Add-ons" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

function useClickOutside(onOut: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onOut]);
  return ref;
}

export function AnnouncementBar() {
  const { state } = useStore();
  const [hidden, setHidden] = useState(() => sessionStorage.getItem("livo.announce") === "1");
  if (hidden || !state.settings.announcement) return null;
  return (
    <div className="relative z-40 border-b border-pulse-400/20 bg-gradient-to-r from-pulse-400/12 via-ink-900 to-solar-400/12 px-4 py-2 text-center text-[12.5px] font-medium text-mist-300">
      <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-pulse-400 align-middle" />
      {state.settings.announcement}
      <button
        aria-label="Dismiss announcement"
        onClick={() => { sessionStorage.setItem("livo.announce", "1"); setHidden(true); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-500 hover:text-mist-200"
      >
        <I name="close" size={13} />
      </button>
    </div>
  );
}

function NotifBell() {
  const { state, me, markNotif, markAllNotifs } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const scope = me?.role === "customer" ? me.id : "admin";
  const list = state.notifications.filter((n) => n.userId === scope).slice(0, 8);
  const unread = list.filter((n) => !n.read).length;
  const kindIcon: Record<string, string> = { purchase: "cart", renewal: "refresh", payment: "card", update: "wand", download: "download", support: "headset", system: "info" };
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative grid size-9 place-items-center rounded-lg border border-mist-100/12 text-mist-300 transition-colors hover:border-pulse-400/50 hover:text-pulse-300"
      >
        <I name="bell" size={16} />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-solar-400 text-[9.5px] font-bold text-ink-950">{unread}</span>}
      </button>
      {open && (
        <div className="pop-in absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-xl border border-mist-100/12 bg-ink-900 shadow-[0_30px_70px_-25px_rgba(22,32,43,0.4)]">
          <div className="flex items-center justify-between border-b border-mist-100/10 px-4 py-3">
            <span className="font-display text-sm font-semibold">Notifications</span>
            <button onClick={() => markAllNotifs(scope)} className="text-[11.5px] font-semibold text-pulse-300 hover:text-pulse-400">Mark all read</button>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {list.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-mist-500">No notifications yet.</p>}
            {list.map((n) => (
              <Link
                key={n.id} to={n.href ?? "#"} onClick={() => { markNotif(n.id); setOpen(false); }}
                className={`flex gap-3 border-b border-mist-100/6 px-4 py-3 transition-colors hover:bg-ink-800 ${n.read ? "opacity-55" : ""}`}
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-mist-100/12 bg-ink-800 text-pulse-300">
                  <I name={kindIcon[n.kind] ?? "info"} size={14} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-mist-100">
                    {n.title}
                    {!n.read && <span className="size-1.5 rounded-full bg-pulse-400" />}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-mist-400">{n.body}</span>
                  <span className="mt-1 block text-[10.5px] text-mist-500">{timeAgo(n.at)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const { me, logout, toast } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const nav = useNavigate();
  if (!me) return null;
  const isStaff = me.role !== "customer";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-lg border border-mist-100/12 py-1 pl-1 pr-2.5 transition-colors hover:border-pulse-400/50" aria-label="Account menu">
        <Avatar name={me.name} size={28} />
        <span className="hidden text-left sm:block">
          <span className="block max-w-[110px] truncate text-[12.5px] font-semibold leading-tight text-mist-100">{me.name}</span>
          <span className="block text-[10px] font-medium uppercase tracking-wider text-mist-500">{me.role === "superadmin" ? "Super admin" : me.role}</span>
        </span>
        <I name="chevD" size={13} className="text-mist-500" />
      </button>
      {open && (
        <div className="pop-in absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-mist-100/12 bg-ink-900 py-1.5 shadow-[0_30px_70px_-25px_rgba(22,32,43,0.4)]">
          <Link to={isStaff ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-mist-200 hover:bg-ink-800">
            <I name="grid" size={15} className="text-mist-400" /> {isStaff ? "Admin console" : "My dashboard"}
          </Link>
          {!isStaff && (
            <>
              <Link to="/dashboard/orders" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-mist-200 hover:bg-ink-800">
                <I name="receipt" size={15} className="text-mist-400" /> Orders
              </Link>
              <Link to="/dashboard/downloads" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-mist-200 hover:bg-ink-800">
                <I name="download" size={15} className="text-mist-400" /> Downloads
              </Link>
            </>
          )}
          <Link to={isStaff ? "/admin/settings" : "/dashboard/settings"} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-mist-200 hover:bg-ink-800">
            <I name="settings" size={15} className="text-mist-400" /> Settings
          </Link>
          <div className="my-1.5 border-t border-mist-100/10" />
          <button
            onClick={() => { logout(); setOpen(false); toast("info", "Logged out", "See you soon."); nav("/"); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-medium text-flare-300 hover:bg-flare-500/8"
          >
            <I name="logout" size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { state, me } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  useEffect(() => setMobile(false), [loc.pathname]);

  return (
    <>
      <AnnouncementBar />
      <header
        className={`sticky top-0 z-[70] border-b transition-all duration-300 ${
          scrolled ? "border-mist-100/10 bg-ink-950/85 py-2.5 shadow-[0_12px_36px_-20px_rgba(22,32,43,0.35)] backdrop-blur-xl" : "border-transparent bg-transparent py-4"
        }`}
      >
        <div className="container-x flex items-center justify-between gap-4">
          <Link to="/" className="group flex items-center gap-2.5" aria-label="LivoTech home">
            <span className="transition-transform duration-300 group-hover:rotate-[-6deg]"><Logo size={30} /></span>
            <span className="font-display text-[19px] font-bold tracking-tight">
              Livo<span className="text-pulse-400">Tech</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `link-line text-[13.5px] font-medium transition-colors ${isActive ? "active text-pulse-300" : "text-mist-300 hover:text-mist-100"}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {state.cart && (
              <Link to="/checkout" className="relative grid size-9 place-items-center rounded-lg border border-solar-400/50 text-solar-300 transition-colors hover:bg-solar-400/10" aria-label="Go to checkout">
                <I name="cart" size={16} />
                <span className="absolute -right-1 -top-1 size-2.5 animate-pulse rounded-full bg-solar-400" />
              </Link>
            )}
            {me ? (
              <>
                <NotifBell />
                <AccountMenu />
              </>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-lg px-3.5 py-2 text-[13.5px] font-semibold text-mist-300 transition-colors hover:text-mist-100 sm:block">Log in</Link>
                <Link to="/register" className="hidden rounded-lg bg-pulse-400 px-4 py-2 text-[13.5px] font-bold text-ink-950 shadow-[0_10px_26px_-10px_rgba(5,150,105,0.6)] transition-all hover:bg-pulse-300 sm:block">
                  Get started
                </Link>
              </>
            )}
            <button onClick={() => setMobile(true)} className="grid size-9 place-items-center rounded-lg border border-mist-100/12 text-mist-300 lg:hidden" aria-label="Open menu">
              <I name="menu" size={17} />
            </button>
          </div>
        </div>
      </header>

      <Drawer open={mobile} onClose={() => setMobile(false)} title={<span className="flex items-center gap-2"><Logo size={24} /> LivoTech</span>}>
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {[{ to: "/", label: "Home" }, ...NAV, { to: "/ebooks", label: "E-books" }, { to: "/faq", label: "FAQ" }, { to: "/contact", label: "Contact" }].map((n) => (
            <NavLink
              key={n.to} to={n.to} end={n.to === "/"}
              className={({ isActive }) => `rounded-lg px-4 py-3 font-display text-[15px] font-semibold transition-colors ${isActive ? "bg-pulse-400/12 text-pulse-300" : "text-mist-200 hover:bg-ink-800"}`}
            >
              {n.label}
            </NavLink>
          ))}
          <div className="mt-5 border-t border-mist-100/10 pt-5">
            {me ? (
              <Link to={me.role === "customer" ? "/dashboard" : "/admin"} className="block rounded-lg bg-pulse-400 px-4 py-3 text-center font-bold text-ink-950">
                Open {me.role === "customer" ? "dashboard" : "admin console"}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link to="/login" className="rounded-lg border border-mist-100/15 px-4 py-3 text-center font-semibold text-mist-100">Log in</Link>
                <Link to="/register" className="rounded-lg bg-pulse-400 px-4 py-3 text-center font-bold text-ink-950">Get started</Link>
              </div>
            )}
          </div>
        </nav>
      </Drawer>
    </>
  );
}

export function Footer() {
  const { state } = useStore();
  const s = state.settings;
  return (
    <footer className="relative mt-28 border-t border-mist-100/10 bg-ink-900/70">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-lg font-bold tracking-tight">Livo<span className="text-pulse-400">Tech</span></span>
          </Link>
          <p className="mt-3.5 max-w-xs text-[13.5px] leading-relaxed text-mist-400">{s.tagline}</p>
          <div className="mt-5 flex gap-2">
            {[
              { icon: "chat", label: "Twitter", href: `https://x.com/${s.twitter.replace(/^@/, "")}` },
              { icon: "code", label: "GitHub", href: `https://github.com/${s.github}` },
              { icon: "users", label: "LinkedIn", href: `https://www.linkedin.com/${s.linkedin}` },
            ].map((x) => (
              <a key={x.label} href={x.href} target="_blank" rel="noreferrer" aria-label={`LivoTech on ${x.label}`}
                className="grid size-9 place-items-center rounded-lg border border-mist-100/12 text-mist-400 transition-colors hover:border-pulse-400/50 hover:text-pulse-300">
                <I name={x.icon} size={15} />
              </a>
            ))}
          </div>
        </div>
        <FooterCol title="Products" links={[
          { to: "/products?type=website", label: "Websites" },
          { to: "/products?type=system", label: "Business systems" },
          { to: "/products?type=saas", label: "SaaS" },
          { to: "/digital-products", label: "Digital products" },
          { to: "/ebooks", label: "E-books" },
        ]} />
        <FooterCol title="Platform" links={[
          { to: "/solutions", label: "Solutions" },
          { to: "/addons", label: "Add-ons" },
          { to: "/pricing", label: "Pricing" },
          { to: "/dashboard", label: "Customer dashboard" },
          { to: "/admin", label: "Admin console" },
        ]} />
        <FooterCol title="Company" links={[
          { to: "/about", label: "About" },
          { to: "/contact", label: "Contact" },
          { to: "/faq", label: "FAQ" },
          { to: "/login", label: "Log in" },
          { to: "/register", label: "Create account" },
        ]} />
      </div>
      <div className="border-t border-mist-100/8">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-[12px] text-mist-500 sm:flex-row">
          <span>© {new Date().getFullYear()} {s.brand}. {s.tagline}</span>
          <span className="flex items-center gap-2">
            <Badge tone="solar">Demo build</Badge>
            Data is seeded & stored locally — contact <a className="text-mist-300 hover:text-pulse-300" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="eyebrow !text-mist-500 mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-[13.5px] text-mist-400 transition-colors hover:text-pulse-300">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
