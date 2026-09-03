import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { I, Logo } from "../components/icons";
import { Btn, Field, TextInput, usePageTitle } from "../components/ui";

export type AuthMode = "login" | "register" | "forgot";

const TITLES: Record<AuthMode, { t: string; s: string }> = {
  login: { t: "Welcome back", s: "Log in to manage your products, downloads and subscriptions." },
  register: { t: "Create your account", s: "One account for every product — websites, systems, downloads and add-ons." },
  forgot: { t: "Reset your password", s: "Enter your account email and we'll send a reset link." },
};

export default function AuthPage({ mode }: { mode: AuthMode }) {
  usePageTitle(TITLES[mode].t);
  const { login, register, requestReset, toast, me, state } = useStore();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const heroImgs = useMemo(() => state.products.filter((p) => p.featured).slice(0, 3).map((p) => p.image), [state.products]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setIdx((i) => (i + 1) % Math.max(1, heroImgs.length)), 4000);
    return () => window.clearInterval(id);
  }, [heroImgs.length]);

  useEffect(() => {
    if (me && mode !== "forgot") nav(me.role === "customer" ? next || "/dashboard" : "/admin", { replace: true });
  }, [me, mode, nav, next]);

  const submit = async () => {
    setErr(""); setInfo(""); setBusy(true);
    try {
      if (mode === "login") {
        if (!form.email.trim() || !form.password) throw new Error("Enter your email and password.");
        const u = await login(form.email, form.password);
        toast("success", `Welcome back, ${u.name.split(" ")[0]}`, u.role === "customer" ? "Your dashboard is ready." : "Admin console unlocked.");
        nav(u.role === "customer" ? next || "/dashboard" : "/admin", { replace: true });
      } else if (mode === "register") {
        if (form.name.trim().length < 2) throw new Error("Tell us your full name.");
        if (!/^\S+@\S+\.\S+$/.test(form.email)) throw new Error("That email doesn't look valid.");
        if (form.password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (form.password !== form.confirm) throw new Error("Passwords don't match.");
        const u = await register(form.name, form.email, form.password);
        toast("success", `Welcome to LivoTech, ${u.name.split(" ")[0]}`, "Your account was created with the customer role.");
        nav(next || "/dashboard", { replace: true });
      } else {
        if (!/^\S+@\S+\.\S+$/.test(form.email)) throw new Error("Enter a valid email address.");
        const msg = await requestReset(form.email);
        setInfo(msg);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-70px)] lg:grid-cols-[1fr_1.1fr]">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden border-r border-mist-100/10 bg-ink-900 lg:block">
        <div className="bg-grid absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
        {heroImgs.map((src, i) => (
          <img key={src} src={src} alt="" aria-hidden className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === idx ? "opacity-25" : "opacity-0"}`} />
        ))}
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex w-fit items-center gap-2.5">
            <Logo size={30} />
            <span className="font-display text-xl font-bold tracking-tight">Livo<span className="text-pulse-400">Tech</span></span>
          </Link>
          <div className="max-w-md">
            <p className="eyebrow mb-4">One ecosystem</p>
            <h2 className="font-display text-4xl font-bold leading-[1.06] tracking-tight">
              Discover. Purchase. Activate.<br /><span className="text-pulse-400">Manage. Expand.</span>
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-mist-300">
              Websites, POS systems, templates and e-books — everything lands in one dashboard the moment payment clears.
            </p>
          </div>
        </div>
      </div>

      {/* form */}
      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-md">
          <p className="eyebrow mb-3">{mode === "login" ? "Log in" : mode === "register" ? "Sign up" : "Recovery"}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">{TITLES[mode].t}</h1>
          <p className="mt-2 text-sm leading-relaxed text-mist-400">{TITLES[mode].s}</p>

          <div className="card mt-6 space-y-4 p-6">
            {mode === "register" && (
              <Field label="Full name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Salma Adel" autoComplete="name" /></Field>
            )}
            <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@business.com" autoComplete="email" /></Field>
            {mode !== "forgot" && (
              <Field label="Password" hint={mode === "register" ? "min 8 characters" : undefined}>
                <TextInput type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} onKeyDown={(e) => e.key === "Enter" && submit()} />
              </Field>
            )}
            {mode === "register" && (
              <Field label="Confirm password">
                <TextInput type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" autoComplete="new-password" onKeyDown={(e) => e.key === "Enter" && submit()} />
              </Field>
            )}

            {err && <p className="flex items-start gap-2 rounded-lg border border-flare-500/35 bg-flare-500/8 px-3.5 py-2.5 text-[13px] text-flare-300"><I name="alert" size={14} className="mt-0.5 shrink-0" /> {err}</p>}
            {info && <p className="flex items-start gap-2 rounded-lg border border-pulse-400/35 bg-pulse-400/8 px-3.5 py-2.5 text-[13px] text-pulse-300"><I name="check" size={14} className="mt-0.5 shrink-0" /> {info}</p>}

            <Btn size="lg" className="w-full" loading={busy} onClick={submit} icon={mode === "forgot" ? "send" : "arrowR"}>
              {mode === "login" ? "Log in" : mode === "register" ? "Create account" : "Send reset link"}
            </Btn>

            {mode === "register" && (
              <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-mist-500">
                <I name="shield" size={13} className="mt-0.5 shrink-0 text-pulse-400" />
                New accounts are always assigned the <span className="font-semibold text-mist-300">customer</span> role — roles are never client-selectable. Admin access is provisioned by a Super Admin only.
              </p>
            )}
          </div>

          <p className="mt-5 text-center text-[13px] text-mist-400">
            {mode === "login" ? (
              <>New here? <Link to="/register" className="font-semibold text-pulse-300 hover:text-pulse-400">Create an account</Link> · <Link to="/forgot-password" className="text-mist-300 hover:text-pulse-300">Forgot password?</Link></>
            ) : mode === "register" ? (
              <>Already have an account? <Link to="/login" className="font-semibold text-pulse-300 hover:text-pulse-400">Log in</Link></>
            ) : (
              <>Remembered it? <Link to="/login" className="font-semibold text-pulse-300 hover:text-pulse-400">Back to log in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
