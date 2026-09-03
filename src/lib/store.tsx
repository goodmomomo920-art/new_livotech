/* ------------------------------------------------------------------
   LivoTech client store — wired to Supabase.
   Public catalog data loads for everyone; customer-scoped data loads
   once a session exists. Row Level Security on the database is what
   actually enforces who can see/change what — this file just calls it.
------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type {
  Addon, AppNotification, AuditLog, CartState, Category, Coupon, Order, OrderItem,
  Ownership, PermissionKey, Product, Role, RolePerms, Settings, StoreState, Subscription, Ticket, User,
} from "./types";

export const wait = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();

const emptyState: StoreState = {
  v: 1, sessionUserId: null, users: [],
  rolePerms: { customer: [], admin: [], superadmin: [] },
  categories: [], products: [], addons: [],
  ownerships: [], customerAddons: [], websites: [],
  orders: [], subscriptions: [], downloads: [], tickets: [],
  notifications: [], audit: [], coupons: [],
  settings: {
    brand: "LivoTech", tagline: "", announcement: "", currency: "USD",
    contactEmail: "", supportEmail: "", twitter: "", github: "", linkedin: "", maintenance: false,
  },
  contacts: [], cart: null,
};

export interface Toast { id: string; kind: "success" | "error" | "info"; title: string; body?: string }
export interface CheckoutInput { couponCode?: string; method: string }

interface StoreCtx {
  state: StoreState;
  me: User | null;
  loading: boolean;
  toasts: Toast[];
  toast: (kind: Toast["kind"], title: string, body?: string) => void;
  dismissToast: (id: string) => void;
  can: (perm: PermissionKey) => boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  requestReset: (email: string) => Promise<string>;
  updateProfile: (name: string, company: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  sendContact: (name: string, email: string, subject: string, body: string) => Promise<void>;
  setCart: (cart: CartState | null) => void;
  validateCoupon: (code: string, subtotal: number) => Promise<Coupon & { discount: number }>;
  checkout: (input: CheckoutInput) => Promise<Order>;
  recordDownload: (productId: string, fileId: string, fileName: string) => Promise<void>;
  createTicket: (subject: string, category: string, body: string) => Promise<Ticket>;
  replyTicket: (ticketId: string, body: string, author: "customer" | "support", authorName: string) => Promise<void>;
  setTicketStatus: (ticketId: string, status: Ticket["status"]) => Promise<void>;
  markNotif: (id: string) => void;
  markAllNotifs: (userId: string) => void;
  cancelSubscription: (subId: string) => Promise<void>;
  saveProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  duplicateProduct: (id: string) => Promise<Product>;
  saveCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  moveCategory: (id: string, dir: -1 | 1) => void;
  saveAddon: (a: Addon) => Promise<void>;
  deleteAddon: (id: string) => Promise<void>;
  setOrderStatus: (id: string, status: Order["status"], paymentStatus?: Order["paymentStatus"]) => Promise<void>;
  setSubStatus: (id: string, status: Subscription["status"]) => Promise<void>;
  setUserStatus: (id: string, status: User["status"]) => Promise<void>;
  setUserRole: (id: string, role: Role) => Promise<void>;
  addStaff: (name: string, email: string, role: Role) => Promise<void>;
  saveCoupon: (c: Coupon) => Promise<void>;
  deleteCoupon: (code: string) => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
  togglePerm: (role: Role, key: PermissionKey) => Promise<void>;
  broadcast: (title: string, body: string) => Promise<void>;
  resetDemo: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  if (res.data === null) throw new Error("No data returned.");
  return res.data;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(emptyState);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cart, setCartLocal] = useState<CartState | null>(null);

  const toast = useCallback((kind: Toast["kind"], title: string, body?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, kind, title, body }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const can = useCallback(
    (perm: PermissionKey) => {
      if (!me) return false;
      return (state.rolePerms[me.role] ?? []).includes(perm);
    },
    [me, state.rolePerms],
  );

  /* ------------------------------ data loading ------------------------------ */

  const loadPublicData = useCallback(async () => {
    const [cats, prods, addons, perms, settingsRow] = await Promise.all([
      supabase.from("categories").select("*").order("order"),
      supabase.from("products").select("*").order("createdAt", { ascending: false }),
      supabase.from("addons").select("*"),
      supabase.from("role_permissions").select("*"),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    const rolePerms: RolePerms = { customer: [], admin: [], superadmin: [] };
    (perms.data ?? []).forEach((r: any) => { rolePerms[r.role as Role] = r.perms ?? []; });

    setState((s) => ({
      ...s,
      categories: (cats.data as Category[]) ?? [],
      products: (prods.data as Product[]) ?? [],
      addons: (addons.data as Addon[]) ?? [],
      rolePerms,
      settings: (settingsRow.data as Settings) ?? s.settings,
    }));
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    const [own, cadd, sites, ords, subs, dls, tks, notifs, users, coupons, contacts, audit] = await Promise.all([
      supabase.from("ownerships").select("*"),
      supabase.from("customer_addons").select("*"),
      supabase.from("websites").select("*"),
      supabase.from("orders").select("*").order("createdAt", { ascending: false }),
      supabase.from("subscriptions").select("*"),
      supabase.from("downloads").select("*"),
      supabase.from("tickets").select("*").order("createdAt", { ascending: false }),
      supabase.from("notifications").select("*").order("at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("coupons").select("*"),
      supabase.from("contacts").select("*").order("at", { ascending: false }),
      supabase.from("audit_logs").select("*").order("at", { ascending: false }).limit(200),
    ]);

    setState((s) => ({
      ...s,
      sessionUserId: userId,
      ownerships: (own.data as Ownership[]) ?? [],
      customerAddons: (cadd.data as any[]) ?? [],
      websites: (sites.data as any[]) ?? [],
      orders: (ords.data as Order[]) ?? [],
      subscriptions: (subs.data as Subscription[]) ?? [],
      downloads: (dls.data as any[]) ?? [],
      tickets: (tks.data as Ticket[]) ?? [],
      notifications: (notifs.data as AppNotification[]) ?? [],
      users: (users.data as User[]) ?? [],
      coupons: (coupons.data as Coupon[]) ?? [],
      contacts: (contacts.data as any[]) ?? [],
      audit: (audit.data as AuditLog[]) ?? [],
    }));
  }, []);

  const loadProfile = useCallback(async (userId: string, email: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) {
      setMe({ id: data.id, name: data.name, email: data.email, password: "", role: data.role, status: data.status, company: data.company ?? undefined, createdAt: data.createdAt });
    } else {
      setMe({ id: userId, name: "", email, password: "", role: "customer", status: "active", createdAt: now() });
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadPublicData();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await Promise.all([loadProfile(session.user.id, session.user.email ?? ""), loadUserData(session.user.id)]);
  }, [loadPublicData, loadProfile, loadUserData]);

  useEffect(() => {
    let active = true;
    (async () => {
      await loadPublicData();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && active) {
        await Promise.all([loadProfile(session.user.id, session.user.email ?? ""), loadUserData(session.user.id)]);
      }
      if (active) setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await Promise.all([loadProfile(session.user.id, session.user.email ?? ""), loadUserData(session.user.id)]);
      } else {
        setMe(null);
        setState((s) => ({ ...s, sessionUserId: null, ownerships: [], customerAddons: [], websites: [], orders: [], subscriptions: [], downloads: [], tickets: [], notifications: [] }));
      }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadPublicData, loadProfile, loadUserData]);

  /* ------------------------------- auth ------------------------------- */

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Email or password is incorrect." : error.message);
    await loadProfile(data.user.id, data.user.email ?? "");
    await loadUserData(data.user.id);
    const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    if (p?.status === "suspended") { await supabase.auth.signOut(); throw new Error("This account is suspended. Contact support@livotech.io."); }
    return { id: data.user.id, name: p?.name ?? "", email: data.user.email ?? "", password: "", role: p?.role ?? "customer", status: p?.status ?? "active", company: p?.company, createdAt: p?.createdAt ?? now() } as User;
  }, [loadProfile, loadUserData]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
    if (error) throw new Error(error.message.includes("already registered") ? "An account with this email already exists. Try logging in." : error.message);
    if (!data.user) throw new Error("Check your email to confirm your account, then log in.");
    if (data.session) { await loadProfile(data.user.id, data.user.email ?? ""); await loadUserData(data.user.id); }
    return { id: data.user.id, name, email: email.trim().toLowerCase(), password: "", role: "customer", status: "active", createdAt: now() } as User;
  }, [loadProfile, loadUserData]);

  const logout = useCallback(() => { supabase.auth.signOut(); }, []);

  const requestReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw new Error(error.message);
    return `Password reset link sent to ${email.trim()}.`;
  }, []);

  const updateProfile = useCallback(async (name: string, company: string) => {
    if (!me) throw new Error("You must be logged in.");
    const { error } = await supabase.from("profiles").update({ name, company }).eq("id", me.id);
    if (error) throw new Error(error.message);
    setMe((u) => (u ? { ...u, name, company } : u));
  }, [me]);

  const changePassword = useCallback(async (current: string, next: string) => {
    if (!me) throw new Error("You must be logged in.");
    if (next.length < 8) throw new Error("New password must be at least 8 characters.");
    const { error: reauthErr } = await supabase.auth.signInWithPassword({ email: me.email, password: current });
    if (reauthErr) throw new Error("Current password is incorrect.");
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) throw new Error(error.message);
  }, [me]);

  const sendContact = useCallback(async (name: string, email: string, subject: string, body: string) => {
    const { error } = await supabase.from("contacts").insert({ name, email, subject, body });
    if (error) throw new Error(error.message);
  }, []);

  /* ---------------------------- cart & checkout ---------------------------- */

  const setCart = useCallback((c: CartState | null) => { setCartLocal(c); setState((s) => ({ ...s, cart: c })); }, []);

  const validateCoupon = useCallback(async (code: string, subtotal: number) => {
    const { data, error } = await supabase.rpc("validate_coupon", { p_code: code, p_subtotal: subtotal });
    if (error) throw new Error(error.message.replace(/^.*: /, ""));
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("This coupon is invalid or no longer active.");
    return { code: row.code, kind: row.kind, value: row.value, minOrder: row.minOrder, maxDiscount: row.maxDiscount, discount: row.discount } as Coupon & { discount: number };
  }, []);

  const checkout = useCallback(async (input: CheckoutInput): Promise<Order> => {
    if (!me) throw new Error("You must be logged in to complete a purchase.");
    if (!cart) throw new Error("Your cart is empty.");
    const product = state.products.find((p) => p.id === cart.productId);
    if (!product || !product.active) throw new Error("This product is no longer available.");
    const ownedBase = state.ownerships.some((o) => o.customerId === me.id && o.productId === product.id && o.status === "active");
    if (ownedBase && cart.addonIds.length === 0) throw new Error("You already own this product — attach add-ons to it instead.");

    const interval = cart.interval;
    const unit = interval === "monthly" ? product.monthlyPrice ?? product.price : interval === "yearly" ? product.yearlyPrice ?? product.price : product.price;
    const items: OrderItem[] = ownedBase ? [] : [{ productId: product.id, name: product.name, type: product.type, qty: 1, unitPrice: unit, interval, total: unit }];
    const addons = cart.addonIds.map((id) => state.addons.find((a) => a.id === id)).filter((a): a is Addon => !!a && a.active);
    addons.forEach((ad) => items.push({ productId: ad.id, name: `${ad.name} · ${product.name}`, type: "addon", qty: 1, unitPrice: ad.price, interval: ad.interval as any, total: ad.price }));

    const subtotal = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;
    let discount = 0, couponCode: string | undefined;
    if (input.couponCode) { const v = await validateCoupon(input.couponCode, subtotal); discount = v.discount; couponCode = v.code; }
    const total = Math.round((subtotal - discount) * 100) / 100;

    const order = must<Order>(await supabase.from("orders").insert({
      number: "", customerId: me.id, items, subtotal, discount, couponCode: couponCode ?? null, total,
      currency: state.settings.currency, status: "completed", paymentStatus: "paid", paymentMethod: input.method,
    }).select("*").single());

    const isRecurring = !ownedBase && interval !== "once";
    let sub: Subscription | null = null;
    if (isRecurring) {
      sub = must<Subscription>(await supabase.from("subscriptions").insert({
        customerId: me.id, productId: product.id, orderId: order.id,
        plan: `${product.name} ${interval === "monthly" ? "Monthly" : "Yearly"}`, price: unit,
        interval, status: "active", nextBillingAt: new Date(Date.now() + (interval === "monthly" ? 30 : 365) * 864e5).toISOString(),
      }).select("*").single());
    }
    if (!ownedBase) {
      await supabase.from("ownerships").insert({
        customerId: me.id, productId: product.id, orderId: order.id, status: "active",
        activatedAt: now(), expiresAt: sub?.nextBillingAt, subscriptionId: sub?.id,
      });
    }
    for (const ad of addons) {
      await supabase.from("customer_addons").insert({
        customerId: me.id, addonId: ad.id, attachedProductId: product.id, attachedProductName: product.name,
        orderId: order.id, interval: ad.interval, price: ad.price, status: "active",
        renewsAt: ad.interval === "monthly" ? new Date(Date.now() + 30 * 864e5).toISOString() : null,
      });
      if (ad.interval === "monthly") {
        await supabase.from("subscriptions").insert({ customerId: me.id, productId: ad.id, orderId: order.id, plan: ad.name, price: ad.price, interval: "monthly", status: "active", nextBillingAt: new Date(Date.now() + 30 * 864e5).toISOString() });
      }
    }
    if (!ownedBase && product.type === "website") {
      const slugPart = product.slug.split("-")[0];
      const domain = `${slugPart}-${me.id.slice(-4)}.livo.site`;
      await supabase.from("websites").insert({ name: `${product.name} — ${me.company || me.name}`, productId: product.id, customerId: me.id, domain, url: `https://${domain}`, plan: "Owned license", status: "pending" });
    }
    await supabase.from("notifications").insert({ userId: me.id, title: "Purchase confirmed", body: `Order ${order.number} — ${product.name}.`, kind: "purchase", href: product.downloadable ? "/dashboard/downloads" : "/dashboard/products" });
    await supabase.from("notifications").insert({ userId: "admin", title: "New order", body: `${me.name} — ${product.name} (${total} ${state.settings.currency})`, kind: "purchase", href: "/admin/orders" });

    setCart(null);
    await loadUserData(me.id);
    return order as Order;
  }, [me, cart, state.products, state.addons, state.ownerships, state.settings, validateCoupon, loadUserData, setCart]);

  /* ---------------------------- customer actions ---------------------------- */

  const recordDownload = useCallback(async (productId: string, fileId: string, fileName: string) => {
    if (!me) throw new Error("You must be logged in.");
    const owns = state.ownerships.some((o) => o.customerId === me.id && o.productId === productId && o.status !== "cancelled");
    if (!owns) throw new Error("You don't have access to this file — purchase the product first.");
    await supabase.from("downloads").insert({ userId: me.id, productId, fileId, fileName });
    await supabase.from("notifications").insert({ userId: me.id, title: "Download recorded", body: `${fileName}`, kind: "download", href: "/dashboard/downloads" });

    const product = state.products.find((p) => p.id === productId);
    const body = [
      "LivoTech — Secure delivery", "==================================",
      `File     : ${fileName}`, `Product  : ${product?.name ?? productId} (v${product?.version ?? "?"})`,
      `Licensed : ${me.name} <${me.email}>`, `Issued   : ${new Date().toLocaleString()}`,
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${fileName}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    await loadUserData(me.id);
  }, [me, state.ownerships, state.products, loadUserData]);

  const createTicket = useCallback(async (subject: string, category: string, body: string) => {
    if (!me) throw new Error("You must be logged in.");
    const ticket = must<Ticket>(await supabase.from("tickets").insert({
      number: "", customerId: me.id, subject, category, priority: "normal", status: "open",
      messages: [{ id: crypto.randomUUID(), author: "customer", authorName: me.name, body, at: now() }],
    }).select("*").single());
    await supabase.from("notifications").insert({ userId: "admin", title: `New ticket ${ticket.number}`, body: `${me.name}: ${subject}`, kind: "support", href: "/admin/support" });
    await loadUserData(me.id);
    return ticket as Ticket;
  }, [me, loadUserData]);

  const replyTicket = useCallback(async (ticketId: string, body: string, author: "customer" | "support", authorName: string) => {
    const t = state.tickets.find((x) => x.id === ticketId);
    if (!t) return;
    const messages = [...t.messages, { id: crypto.randomUUID(), author, authorName, body, at: now() }];
    const status = author === "support" ? "waiting" : t.status === "waiting" ? "open" : t.status;
    await supabase.from("tickets").update({ messages, status }).eq("id", ticketId);
    const n = author === "support"
      ? { userId: t.customerId, title: `New reply on ${t.number}`, body: `${authorName} replied.`, kind: "support" as const, href: "/dashboard/support" }
      : { userId: "admin", title: `Customer replied on ${t.number}`, body: `${authorName}: ${body.slice(0, 90)}`, kind: "support" as const, href: "/admin/support" };
    await supabase.from("notifications").insert(n);
    if (me) await loadUserData(me.id);
  }, [state.tickets, me, loadUserData]);

  const setTicketStatus = useCallback(async (ticketId: string, status: Ticket["status"]) => {
    await supabase.from("tickets").update({ status }).eq("id", ticketId);
    if (me) await loadUserData(me.id);
  }, [me, loadUserData]);

  const markNotif = useCallback((id: string) => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    supabase.from("notifications").update({ read: true }).eq("id", id);
  }, []);
  const markAllNotifs = useCallback((userId: string) => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }));
    supabase.from("notifications").update({ read: true }).eq("userId", userId);
  }, []);

  const cancelSubscription = useCallback(async (subId: string) => {
    if (!me) throw new Error("You must be logged in.");
    const { error } = await supabase.rpc("cancel_subscription", { p_sub_id: subId });
    if (error) throw new Error(error.message);
    await loadUserData(me.id);
    toast("info", "Subscription cancelled", "Access continues until the end of the billing period.");
  }, [me, loadUserData, toast]);

  /* -------------------------------- admin -------------------------------- */

  const requirePerm = (perm: PermissionKey) => {
    if (!me || me.role === "customer" || !can(perm)) throw new Error("Your role isn't authorized for this action.");
  };
  const logAudit = async (action: string, resource: string, resourceId: string, meta?: string) => {
    if (!me) return;
    await supabase.from("audit_logs").insert({ actorId: me.id, actorName: me.name, action, resource, resourceId, meta });
  };

  const saveProduct = useCallback(async (p: Product) => {
    requirePerm("products");
    const exists = state.products.some((x) => x.id === p.id);
    const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const row: any = { ...p, slug, updatedAt: now() };
    if (exists) await supabase.from("products").update(row).eq("id", p.id);
    else { delete row.id; await supabase.from("products").insert(row); }
    await logAudit(exists ? "product.update" : "product.create", "product", p.id, p.name);
    await loadPublicData();
  }, [state.products, me, can, loadPublicData]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteProduct = useCallback(async (id: string) => {
    requirePerm("products");
    await supabase.from("products").delete().eq("id", id);
    await logAudit("product.delete", "product", id);
    await loadPublicData();
  }, [me, can, loadPublicData]); // eslint-disable-line react-hooks/exhaustive-deps

  const duplicateProduct = useCallback(async (id: string) => {
    requirePerm("products");
    const p = state.products.find((x) => x.id === id);
    if (!p) throw new Error("Product not found.");
    const copy: any = { ...p, slug: `${p.slug}-copy`, name: `${p.name} (Copy)`, active: false, featured: false };
    delete copy.id;
    const created = must<Product>(await supabase.from("products").insert(copy).select("*").single());
    await logAudit("product.duplicate", "product", created.id, `from ${p.name}`);
    await loadPublicData();
    return created as Product;
  }, [state.products, me, can, loadPublicData]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCategory = useCallback(async (c: Category) => {
    requirePerm("categories");
    const exists = state.categories.some((x) => x.id === c.id);
    if (exists) await supabase.from("categories").update(c).eq("id", c.id);
    else { const row: any = { ...c }; delete row.id; await supabase.from("categories").insert(row); }
    await logAudit("category.save", "category", c.id, c.name);
    await loadPublicData();
  }, [state.categories, me, can, loadPublicData]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCategory = useCallback(async (id: string) => {
    requirePerm("categories");
    if (state.products.some((p) => p.categoryId === id)) throw new Error("Category has products — move them first.");
    await supabase.from("categories").delete().eq("id", id);
    await logAudit("category.delete", "category", id);
    await loadPublicData();
  }, [state.products, me, can, loadPublicData]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveCategory = useCallback((id: string, dir: -1 | 1) => {
    const sorted = [...state.categories].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    sorted.forEach((c, k) => { supabase.from("categories").update({ order: k + 1 }).eq("id", c.id); });
    setState((s) => ({ ...s, categories: sorted.map((c, k) => ({ ...c, order: k + 1 })) }));
  }, [state.categories]);

  const saveAddon = useCallback(async (a: Addon) => {
    requirePerm("addons");
    const exists = state.addons.some((x) => x.id === a.id);
    if (exists) await supabase.from("addons").update(a).eq("id", a.id);
    else { const row: any = { ...a }; delete row.id; await supabase.from("addons").insert(row); }
    await logAudit("addon.save", "addon", a.id, a.name);
    await loadPublicData();
  }, [state.addons, me, can, loadPublicData]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteAddon = useCallback(async (id: string) => {
    requirePerm("addons");
    await supabase.from("addons").delete().eq("id", id);
    await logAudit("addon.delete", "addon", id);
    await loadPublicData();
  }, [me, can, loadPublicData]); // eslint-disable-line react-hooks/exhaustive-deps

  const setOrderStatus = useCallback(async (id: string, status: Order["status"], paymentStatus?: Order["paymentStatus"]) => {
    requirePerm("orders");
    const patch: any = { status }; if (paymentStatus) patch.paymentStatus = paymentStatus;
    await supabase.from("orders").update(patch).eq("id", id);
    await logAudit("order.status", "order", id, `→ ${status}`);
    if (me) await loadUserData(me.id);
  }, [me, can, loadUserData]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSubStatus = useCallback(async (id: string, status: Subscription["status"]) => {
    requirePerm("subscriptions");
    await supabase.from("subscriptions").update({ status }).eq("id", id);
    await logAudit("subscription.status", "subscription", id, `→ ${status}`);
    if (me) await loadUserData(me.id);
  }, [me, can, loadUserData]); // eslint-disable-line react-hooks/exhaustive-deps

  const setUserStatus = useCallback(async (id: string, status: User["status"]) => {
    requirePerm("customers");
    await supabase.from("profiles").update({ status }).eq("id", id);
    await logAudit(status === "suspended" ? "customer.suspend" : "customer.activate", "user", id);
    if (me) await loadUserData(me.id);
  }, [me, can, loadUserData]); // eslint-disable-line react-hooks/exhaustive-deps

  const setUserRole = useCallback(async (id: string, role: Role) => {
    if (!me || me.role !== "superadmin") throw new Error("Only a Super Admin can change roles.");
    await supabase.from("profiles").update({ role }).eq("id", id);
    await logAudit("role.change", "user", id, `→ ${role}`);
    await loadUserData(me.id);
  }, [me, loadUserData]);

  const addStaff = useCallback(async (_name: string, _email: string, _role: Role) => {
    if (!me || me.role !== "superadmin") throw new Error("Only a Super Admin can add staff.");
    throw new Error("Inviting staff needs a real email invite — create the account from Supabase Dashboard → Authentication, then set its role from Staff management here.");
  }, [me]);

  const saveCoupon = useCallback(async (c: Coupon) => {
    requirePerm("coupons");
    const exists = state.coupons.some((x) => x.code === c.code);
    if (exists) await supabase.from("coupons").update(c).eq("code", c.code);
    else await supabase.from("coupons").insert(c);
    await logAudit("coupon.save", "coupon", c.code, `${c.kind} ${c.value}`);
    if (me) await loadUserData(me.id);
  }, [state.coupons, me, can, loadUserData]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCoupon = useCallback(async (code: string) => {
    requirePerm("coupons");
    await supabase.from("coupons").delete().eq("code", code);
    await logAudit("coupon.delete", "coupon", code);
    if (me) await loadUserData(me.id);
  }, [me, can, loadUserData]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = useCallback(async (settings: Settings) => {
    requirePerm("settings");
    await supabase.from("settings").update(settings).eq("id", 1);
    await logAudit("settings.update", "settings", "platform", settings.brand);
    await loadPublicData();
  }, [me, can, loadPublicData]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePerm = useCallback(async (role: Role, key: PermissionKey) => {
    if (!me || me.role !== "superadmin") throw new Error("Only a Super Admin manages permissions.");
    const current = state.rolePerms[role] ?? [];
    const has = current.includes(key);
    const next = has ? current.filter((k) => k !== key) : [...current, key];
    await supabase.from("role_permissions").update({ perms: next }).eq("role", role);
    await logAudit("permission.toggle", "role", role, key);
    await loadPublicData();
  }, [me, state.rolePerms, loadPublicData]);

  const broadcast = useCallback(async (title: string, body: string) => {
    requirePerm("notifications");
    const customers = state.users.filter((u) => u.role === "customer");
    await supabase.from("notifications").insert(customers.map((u) => ({ userId: u.id, title, body, kind: "system", href: "/dashboard" })));
    await logAudit("notification.broadcast", "notification", "all", title);
    if (me) await loadUserData(me.id);
  }, [state.users, me, can, loadUserData]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetDemo = useCallback(() => {
    toast("info", "Not available", "This build runs on your real Supabase project — there's no local demo data to reset.");
  }, [toast]);

  const value: StoreCtx = {
    state, me, loading, toasts, toast, dismissToast, can, refresh,
    login, register, logout, requestReset, updateProfile, changePassword, sendContact,
    setCart, validateCoupon, checkout,
    recordDownload, createTicket, replyTicket, setTicketStatus, markNotif, markAllNotifs, cancelSubscription,
    saveProduct, deleteProduct, duplicateProduct, saveCategory, deleteCategory, moveCategory, saveAddon, deleteAddon,
    setOrderStatus, setSubStatus, setUserStatus, setUserRole, addStaff, saveCoupon, deleteCoupon,
    saveSettings, togglePerm, broadcast, resetDemo,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>.");
  return ctx;
}
