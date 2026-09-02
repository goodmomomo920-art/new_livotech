/* ------------------------------------------------------------------
   LivoTech client store.
   Demo build: mimics the production API surface (Supabase + RLS) with a
   local, persisted dataset. All prices/statuses are recomputed here —
   never trusted from the UI — mirroring server-side validation rules.
------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { seedState, SEED_V } from "./seed";
import type {
  Addon, AppNotification, AuditLog, BillingInterval, CartState, Category, ContactMsg, Coupon, Order, OrderItem,
  Ownership, PermissionKey, Product, Role, RolePerms, Settings, StoreState, Subscription, Ticket, User,
} from "./types";

const LS_KEY = `livotech.store.v${SEED_V}`;

export const wait = (ms = 420) => new Promise<void>((r) => setTimeout(r, ms));
let counter = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}${(counter++).toString(36)}`;
const now = () => new Date().toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 864e5).toISOString();

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (parsed && parsed.v === SEED_V && Array.isArray(parsed.products)) return parsed;
    }
  } catch {
    /* corrupted storage → reseed */
  }
  return seedState();
}

export interface Toast {
  id: string;
  kind: "success" | "error" | "info";
  title: string;
  body?: string;
}

export interface CheckoutInput {
  couponCode?: string;
  method: string;
}

interface StoreCtx {
  state: StoreState;
  me: User | null;
  toasts: Toast[];
  toast: (kind: Toast["kind"], title: string, body?: string) => void;
  dismissToast: (id: string) => void;
  can: (perm: PermissionKey) => boolean;
  /* auth */
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  requestReset: (email: string) => Promise<string>;
  updateProfile: (name: string, company: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  sendContact: (name: string, email: string, subject: string, body: string) => Promise<void>;
  /* cart & checkout */
  setCart: (cart: CartState | null) => void;
  validateCoupon: (code: string, subtotal: number) => Promise<Coupon & { discount: number }>;
  checkout: (input: CheckoutInput) => Promise<Order>;
  /* customer actions */
  recordDownload: (productId: string, fileId: string, fileName: string) => Promise<void>;
  createTicket: (subject: string, category: string, body: string) => Promise<Ticket>;
  replyTicket: (ticketId: string, body: string, author: "customer" | "support", authorName: string) => Promise<void>;
  setTicketStatus: (ticketId: string, status: Ticket["status"]) => Promise<void>;
  markNotif: (id: string) => void;
  markAllNotifs: (userId: string) => void;
  cancelSubscription: (subId: string) => Promise<void>;
  /* admin */
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* storage full/blocked — demo continues in memory */
    }
  }, [state]);

  const me = useMemo(() => state.users.find((u) => u.id === state.sessionUserId) ?? null, [state.users, state.sessionUserId]);

  const toast = useCallback((kind: Toast["kind"], title: string, body?: string) => {
    const id = nid("t");
    setToasts((t) => [...t.slice(-3), { id, kind, title, body }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const can = useCallback(
    (perm: PermissionKey) => {
      if (!me) return false;
      const perms: RolePerms = state.rolePerms;
      return (perms[me.role] ?? []).includes(perm);
    },
    [me, state.rolePerms],
  );

  const audit = useCallback((actor: User, action: string, resource: string, resourceId: string, meta?: string) => {
    const entry: AuditLog = { id: nid("a"), actorId: actor.id, actorName: actor.name, action, resource, resourceId, meta, at: now() };
    setState((s) => ({ ...s, audit: [entry, ...s.audit] }));
  }, []);

  const notif = (userId: string, n: Omit<AppNotification, "id" | "read" | "at" | "userId">): AppNotification => ({
    id: nid("n"), userId, read: false, at: now(), ...n,
  });

  /* ------------------------------- auth ------------------------------- */

  const login = useCallback(async (email: string, password: string) => {
    await wait(600);
    const user = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) throw new Error("Email or password is incorrect.");
    if (user.status === "suspended") throw new Error("This account is suspended. Contact support@livotech.io.");
    setState((s) => ({ ...s, sessionUserId: user.id }));
    return user;
  }, [state.users]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await wait(700);
    if (state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
      throw new Error("An account with this email already exists. Try logging in.");
    const user: User = {
      id: nid("u"), name: name.trim(), email: email.trim().toLowerCase(), password,
      role: "customer", status: "active", createdAt: now(),
    };
    setState((s) => ({
      ...s,
      users: [...s.users, user],
      sessionUserId: user.id,
      notifications: [notif("admin", { title: "New customer", body: `${user.name} (${user.email}) just created an account.`, kind: "system", href: "/admin/customers" }), ...s.notifications],
    }));
    return user;
  }, [state.users]);

  const logout = useCallback(() => setState((s) => ({ ...s, sessionUserId: null })), []);

  const requestReset = useCallback(async (email: string) => {
    await wait(800);
    if (!state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()))
      throw new Error("No account found for that email.");
    return `Password reset link sent to ${email.trim()} (demo — no email is actually sent).`;
  }, [state.users]);

  const updateProfile = useCallback(async (name: string, company: string) => {
    await wait(500);
    if (!me) throw new Error("You must be logged in.");
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === me.id ? { ...u, name, company } : u)) }));
  }, [me]);

  const changePassword = useCallback(async (current: string, next: string) => {
    await wait(600);
    if (!me) throw new Error("You must be logged in.");
    if (me.password !== current) throw new Error("Current password is incorrect.");
    if (next.length < 8) throw new Error("New password must be at least 8 characters.");
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === me.id ? { ...u, password: next } : u)) }));
  }, [me]);

  const sendContact = useCallback(async (name: string, email: string, subject: string, body: string) => {
    await wait(650);
    const msg: ContactMsg = { id: nid("ct"), name, email, subject, body, at: now() };
    setState((s) => ({
      ...s,
      contacts: [msg, ...s.contacts],
      notifications: [notif("admin", { title: "New contact message", body: `${name} — ${subject}`, kind: "system", href: "/admin/content" }), ...s.notifications],
    }));
  }, []);

  /* ---------------------------- cart & checkout ---------------------------- */

  const setCart = useCallback((cart: CartState | null) => setState((s) => ({ ...s, cart })), []);

  const validateCoupon = useCallback(async (code: string, subtotal: number) => {
    await wait(500);
    const clean = code.trim().toUpperCase();
    if (!clean) throw new Error("Enter a coupon code first.");
    const c = state.coupons.find((x) => x.code === clean);
    if (!c || !c.active) throw new Error("This coupon is invalid or no longer active.");
    const t = Date.now();
    if (t < new Date(c.startsAt).getTime()) throw new Error("This coupon isn't active yet.");
    if (t > new Date(c.expiresAt).getTime()) throw new Error("This coupon has expired.");
    if (subtotal < c.minOrder) throw new Error(`Requires a minimum order of $${c.minOrder}.`);
    if (c.used >= c.usageLimit) throw new Error("This coupon has reached its usage limit.");
    if (me) {
      const perCustomer = state.orders.filter((o) => o.customerId === me.id && o.couponCode === clean).length;
      if (perCustomer >= c.perCustomer) throw new Error("You've already used this coupon.");
    }
    let discount = c.kind === "percent" ? (subtotal * c.value) / 100 : c.value;
    if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
    discount = Math.min(discount, subtotal);
    return { ...c, discount: Math.round(discount * 100) / 100 };
  }, [state.coupons, state.orders, me]);

  const checkout = useCallback(async (input: CheckoutInput): Promise<Order> => {
    await wait(1400);
    if (!me) throw new Error("You must be logged in to complete a purchase.");
    const cart = state.cart;
    if (!cart) throw new Error("Your cart is empty.");
    const product = state.products.find((p) => p.id === cart.productId);
    if (!product || !product.active) throw new Error("This product is no longer available.");
    const ownedBase = state.ownerships.some((o) => o.customerId === me.id && o.productId === product.id && o.status === "active");
    if (ownedBase && cart.addonIds.length === 0)
      throw new Error("You already own this product — attach add-ons to it instead.");

    const interval: BillingInterval = cart.interval;
    const unit =
      interval === "monthly" ? product.monthlyPrice ?? product.price
      : interval === "yearly" ? product.yearlyPrice ?? product.price
      : product.price;

    const items: OrderItem[] = ownedBase
      ? []
      : [{ productId: product.id, name: product.name, type: product.type, qty: 1, unitPrice: unit, interval, total: unit }];
    const addons: Addon[] = [];
    for (const aid of cart.addonIds) {
      const ad = state.addons.find((a) => a.id === aid);
      if (ad && ad.active) {
        addons.push(ad);
        items.push({ productId: ad.id, name: `${ad.name} · ${product.name}`, type: "addon", qty: 1, unitPrice: ad.price, interval: ad.interval, total: ad.price });
      }
    }
    const subtotal = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;

    let discount = 0;
    let couponCode: string | undefined;
    if (input.couponCode) {
      const v = await validateCoupon(input.couponCode, subtotal);
      discount = v.discount;
      couponCode = v.code;
    }
    const total = Math.round((subtotal - discount) * 100) / 100;

    const orderNumber = `LVO-${(Math.max(0, ...state.orders.map((o) => parseInt(o.number.replace("LVO-", ""), 10) || 0)) + 1).toString()}`;
    const orderId = nid("o");
    const order: Order = {
      id: orderId, number: orderNumber, customerId: me.id, items, subtotal, discount, couponCode, total,
      currency: state.settings.currency, status: "completed", paymentStatus: "paid",
      paymentMethod: input.method, createdAt: now(),
    };

    const isRecurring = !ownedBase && interval !== "once";
    const subId = isRecurring ? nid("sub") : undefined;
    const sub: Subscription | null = isRecurring
      ? {
          id: subId!, customerId: me.id, productId: product.id, orderId,
          plan: `${product.name} ${interval === "monthly" ? "Monthly" : "Yearly"}`,
          price: unit, interval: interval as "monthly" | "yearly", status: "active",
          startDate: now(), nextBillingAt: daysFromNow(interval === "monthly" ? 30 : 365),
        }
      : null;

    const ownership: Ownership | null = ownedBase
      ? null
      : {
          id: nid("own"), customerId: me.id, productId: product.id, orderId, status: "active" as const,
          purchasedAt: now(), activatedAt: now(),
          expiresAt: sub ? sub.nextBillingAt : undefined, subscriptionId: sub?.id,
        };

    const addonRecords = addons.map((ad) => ({
      id: nid("ca"), customerId: me.id, addonId: ad.id, attachedProductId: product.id, attachedProductName: product.name,
      orderId, interval: ad.interval, price: ad.price, status: "active" as const, startedAt: now(),
      renewsAt: ad.interval === "monthly" ? daysFromNow(30) : undefined,
    }));
    const addonSubs: Subscription[] = addons
      .filter((ad) => ad.interval === "monthly")
      .map((ad) => ({
        id: nid("sub"), customerId: me.id, productId: ad.id, orderId, plan: ad.name, price: ad.price,
        interval: "monthly" as const, status: "active" as const, startDate: now(), nextBillingAt: daysFromNow(30),
      }));

    const website =
      !ownedBase && product.type === "website"
        ? {
            id: nid("w"), name: `${product.name} — ${me.company || me.name}`, productId: product.id, customerId: me.id,
            domain: `${product.slug.split("-")[0]}-${me.id.slice(-4)}.livo.site`,
            url: `https://${product.slug.split("-")[0]}-${me.id.slice(-4)}.livo.site`,
            plan: "Owned license", status: "pending" as const, createdAt: now(),
          }
        : null;

    const userNotifs: AppNotification[] = [
      notif(me.id, {
        title: "Purchase confirmed",
        body: `Order ${orderNumber} — ${product.name} is now ${product.downloadable ? "in your downloads" : "in your products"}.`,
        kind: "purchase", href: product.downloadable ? "/dashboard/downloads" : "/dashboard/products",
      }),
    ];
    if (sub) userNotifs.push(notif(me.id, { title: "Subscription started", body: `${sub.plan} — next billing ${new Date(sub.nextBillingAt).toLocaleDateString()}.`, kind: "renewal", href: "/dashboard/subscriptions" }));
    if (product.downloadable && !ownedBase)
      userNotifs.push(notif(me.id, { title: "Files unlocked", body: `${product.files.length} file${product.files.length > 1 ? "s" : ""} for ${product.name} are ready — a download guide is included.`, kind: "download", href: "/dashboard/downloads" }));

    const adminNotif = notif("admin", {
      title: `New order ${orderNumber}`,
      body: `${me.name} purchased ${product.name}${addons.length ? ` + ${addons.length} add-on${addons.length > 1 ? "s" : ""}` : ""} — $${total}${interval !== "once" ? `/${interval === "monthly" ? "mo" : "yr"}` : ""}.`,
      kind: "purchase", href: "/admin/orders",
    });

    setState((s) => ({
      ...s,
      orders: [order, ...s.orders],
      ownerships: ownership ? [ownership, ...s.ownerships] : s.ownerships,
      subscriptions: [...(sub ? [sub] : []), ...addonSubs, ...s.subscriptions],
      customerAddons: [...addonRecords, ...s.customerAddons],
      websites: website ? [website, ...s.websites] : s.websites,
      notifications: [...userNotifs, adminNotif, ...s.notifications],
      coupons: couponCode ? s.coupons.map((c) => (c.code === couponCode ? { ...c, used: c.used + 1 } : c)) : s.coupons,
      cart: null,
    }));
    return order;
  }, [me, state, validateCoupon]);

  /* ---------------------------- customer actions ---------------------------- */

  const recordDownload = useCallback(async (productId: string, fileId: string, fileName: string) => {
    if (!me) throw new Error("You must be logged in.");
    const owns = state.ownerships.some((o) => o.customerId === me.id && o.productId === productId && o.status !== "cancelled");
    if (!owns) throw new Error("You don't have access to this file — purchase the product first.");
    await wait(650);
    setState((s) => ({
      ...s,
      downloads: [{ id: nid("dl"), userId: me.id, productId, fileId, fileName, at: now() }, ...s.downloads],
      notifications: [notif(me.id, { title: "Download recorded", body: `${fileName} — the signed URL was issued after verifying your ownership.`, kind: "download", href: "/dashboard/downloads" }), ...s.notifications],
    }));
    const product = state.products.find((p) => p.id === productId);
    const body = [
      "LivoTech — Secure delivery",
      "==================================",
      `File     : ${fileName}`,
      `Product  : ${product?.name ?? productId} (v${product?.version ?? "?"})`,
      `Licensed : ${me.name} <${me.email}>`,
      `Issued   : ${new Date().toLocaleString()}`,
      "",
      "How to access your files",
      "------------------------",
      "1. Every purchase unlocks its files instantly — right on the payment",
      "   success screen and forever in Dashboard → Downloads.",
      "2. Each download click issues a signed URL after an ownership check,",
      "   so paid files are never publicly accessible.",
      "3. Updates ship to the same place, free — re-download any time.",
      "",
      ...(product?.downloadNote ? ["From the LivoTech team", "----------------------", product.downloadNote, ""] : []),
      "Demo build: this document stands in for the real binary. In production,",
      "Supabase Storage streams the actual file from a private bucket after",
      "server-side authorization (RLS + Edge Function).",
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [me, state.ownerships, state.products]);

  const createTicket = useCallback(async (subject: string, category: string, body: string) => {
    if (!me) throw new Error("You must be logged in.");
    await wait(600);
    const num = `TKT-${1046 + state.tickets.length}`;
    const ticket: Ticket = {
      id: nid("tk"), number: num, customerId: me.id, subject, category, priority: "normal", status: "open", createdAt: now(),
      messages: [{ id: nid("m"), author: "customer", authorName: me.name, body, at: now() }],
    };
    setState((s) => ({
      ...s,
      tickets: [ticket, ...s.tickets],
      notifications: [notif("admin", { title: `New ticket ${num}`, body: `${me.name}: ${subject}`, kind: "support", href: "/admin/support" }), ...s.notifications],
    }));
    return ticket;
  }, [me, state.tickets]);

  const replyTicket = useCallback(async (ticketId: string, body: string, author: "customer" | "support", authorName: string) => {
    await wait(500);
    setState((s) => {
      const t = s.tickets.find((x) => x.id === ticketId);
      if (!t) return s;
      const updated: Ticket = {
        ...t,
        status: author === "support" ? "waiting" : t.status === "waiting" ? "open" : t.status,
        messages: [...t.messages, { id: nid("m"), author, authorName, body, at: now() }],
      };
      const n =
        author === "support"
          ? notif(t.customerId, { title: `New reply on ${t.number}`, body: `${authorName} replied: “${body.slice(0, 90)}${body.length > 90 ? "…" : ""}”`, kind: "support", href: "/dashboard/support" })
          : notif("admin", { title: `Customer replied on ${t.number}`, body: `${authorName}: ${body.slice(0, 90)}`, kind: "support", href: "/admin/support" });
      return { ...s, tickets: s.tickets.map((x) => (x.id === ticketId ? updated : x)), notifications: [n, ...s.notifications] };
    });
  }, []);

  const setTicketStatus = useCallback(async (ticketId: string, status: Ticket["status"]) => {
    await wait(350);
    setState((s) => ({ ...s, tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, status } : t)) }));
  }, []);

  const markNotif = useCallback((id: string) => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  }, []);
  const markAllNotifs = useCallback((userId: string) => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }));
  }, []);

  const cancelSubscription = useCallback(async (subId: string) => {
    if (!me) throw new Error("You must be logged in.");
    await wait(600);
    setState((s) => {
      const sub = s.subscriptions.find((x) => x.id === subId);
      if (!sub || sub.customerId !== me.id) return s;
      return {
        ...s,
        subscriptions: s.subscriptions.map((x) => (x.id === subId ? { ...x, status: "cancelled" as const, cancelledAt: now() } : x)),
        ownerships: s.ownerships.map((o) => (o.subscriptionId === subId ? { ...o, status: "expired" as const } : o)),
        notifications: [notif("admin", { title: "Subscription cancelled", body: `${me.name} cancelled ${sub.plan}.`, kind: "system", href: "/admin/subscriptions" }), ...s.notifications],
      };
    });
    toast("info", "Subscription cancelled", "Access continues until the end of the billing period.");
  }, [me, toast]);

  /* -------------------------------- admin -------------------------------- */

  const requirePerm = (perm: PermissionKey) => {
    if (!me || me.role === "customer" || !can(perm))
      throw new Error("Your role isn't authorized for this action. The attempt was blocked server-side.");
  };

  const saveProduct = useCallback(async (p: Product) => {
    requirePerm("products");
    await wait(500);
    const exists = state.products.some((x) => x.id === p.id);
    const next = { ...p, updatedAt: now(), slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") };
    setState((s) => ({ ...s, products: exists ? s.products.map((x) => (x.id === p.id ? next : x)) : [next, ...s.products] }));
    audit(me!, exists ? "product.update" : "product.create", "product", p.id, next.name);
  }, [state.products, me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteProduct = useCallback(async (id: string) => {
    requirePerm("products");
    await wait(400);
    const p = state.products.find((x) => x.id === id);
    setState((s) => ({ ...s, products: s.products.filter((x) => x.id !== id) }));
    audit(me!, "product.delete", "product", id, p?.name);
  }, [state.products, me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const duplicateProduct = useCallback(async (id: string) => {
    requirePerm("products");
    await wait(400);
    const p = state.products.find((x) => x.id === id);
    if (!p) throw new Error("Product not found.");
    const copy: Product = {
      ...JSON.parse(JSON.stringify(p)), id: nid("p"), slug: `${p.slug}-copy`, name: `${p.name} (Copy)`,
      active: false, featured: false, createdAt: now(), updatedAt: now(),
    };
    setState((s) => ({ ...s, products: [copy, ...s.products] }));
    audit(me!, "product.duplicate", "product", copy.id, `from ${p.name}`);
    return copy;
  }, [state.products, me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCategory = useCallback(async (c: Category) => {
    requirePerm("categories");
    await wait(350);
    setState((s) => {
      const exists = s.categories.some((x) => x.id === c.id);
      return { ...s, categories: exists ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, { ...c, order: s.categories.length + 1 }] };
    });
    audit(me!, "category.save", "category", c.id, c.name);
  }, [me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCategory = useCallback(async (id: string) => {
    requirePerm("categories");
    await wait(350);
    if (state.products.some((p) => p.categoryId === id)) throw new Error("Category has products — move them first.");
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
    audit(me!, "category.delete", "category", id);
  }, [state.products, me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveCategory = useCallback((id: string, dir: -1 | 1) => {
    setState((s) => {
      const sorted = [...s.categories].sort((a, b) => a.order - b.order);
      const i = sorted.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= sorted.length) return s;
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      return { ...s, categories: sorted.map((c, k) => ({ ...c, order: k + 1 })) };
    });
  }, []);

  const saveAddon = useCallback(async (a: Addon) => {
    requirePerm("addons");
    await wait(400);
    setState((s) => {
      const exists = s.addons.some((x) => x.id === a.id);
      return { ...s, addons: exists ? s.addons.map((x) => (x.id === a.id ? a : x)) : [...s.addons, a] };
    });
    audit(me!, "addon.save", "addon", a.id, `${a.name} — linked to ${a.productIds.length} product(s)`);
  }, [me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteAddon = useCallback(async (id: string) => {
    requirePerm("addons");
    await wait(350);
    const a = state.addons.find((x) => x.id === id);
    setState((s) => ({ ...s, addons: s.addons.filter((x) => x.id !== id) }));
    audit(me!, "addon.delete", "addon", id, a?.name);
  }, [state.addons, me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const setOrderStatus = useCallback(async (id: string, status: Order["status"], paymentStatus?: Order["paymentStatus"]) => {
    requirePerm("orders");
    await wait(400);
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, status, paymentStatus: paymentStatus ?? o.paymentStatus } : o)),
    }));
    audit(me!, "order.status", "order", id, `→ ${status}${paymentStatus ? ` / ${paymentStatus}` : ""}`);
  }, [me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSubStatus = useCallback(async (id: string, status: Subscription["status"]) => {
    requirePerm("subscriptions");
    await wait(400);
    setState((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, status } : x)) }));
    audit(me!, "subscription.status", "subscription", id, `→ ${status}`);
  }, [me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const setUserStatus = useCallback(async (id: string, status: User["status"]) => {
    requirePerm("customers");
    await wait(400);
    const u = state.users.find((x) => x.id === id);
    setState((s) => ({ ...s, users: s.users.map((x) => (x.id === id ? { ...x, status } : x)) }));
    audit(me!, status === "suspended" ? "customer.suspend" : "customer.activate", "user", id, u?.name);
  }, [state.users, me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const setUserRole = useCallback(async (id: string, role: Role) => {
    if (!me || me.role !== "superadmin") throw new Error("Only a Super Admin can change roles.");
    await wait(400);
    setState((s) => ({ ...s, users: s.users.map((x) => (x.id === id ? { ...x, role } : x)) }));
    audit(me, "role.change", "user", id, `→ ${role}`);
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const addStaff = useCallback(async (name: string, email: string, role: Role) => {
    if (!me || me.role !== "superadmin") throw new Error("Only a Super Admin can add staff.");
    await wait(600);
    if (state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) throw new Error("That email is already registered.");
    const u: User = { id: nid("u"), name, email: email.trim().toLowerCase(), password: "invite-pending", role, status: "active", createdAt: now() };
    setState((s) => ({ ...s, users: [...s.users, u] }));
    audit(me, "staff.invite", "user", u.id, `${name} — ${role}`);
  }, [state.users, me]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCoupon = useCallback(async (c: Coupon) => {
    requirePerm("coupons");
    await wait(400);
    setState((s) => {
      const exists = s.coupons.some((x) => x.code === c.code);
      return { ...s, coupons: exists ? s.coupons.map((x) => (x.code === c.code ? c : x)) : [c, ...s.coupons] };
    });
    audit(me!, "coupon.save", "coupon", c.code, `${c.kind} ${c.value}`);
  }, [me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteCoupon = useCallback(async (code: string) => {
    requirePerm("coupons");
    await wait(350);
    setState((s) => ({ ...s, coupons: s.coupons.filter((c) => c.code !== code) }));
    audit(me!, "coupon.delete", "coupon", code);
  }, [me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = useCallback(async (settings: Settings) => {
    requirePerm("settings");
    await wait(500);
    setState((s) => ({ ...s, settings }));
    audit(me!, "settings.update", "settings", "platform", settings.brand);
  }, [me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePerm = useCallback(async (role: Role, key: PermissionKey) => {
    if (!me || me.role !== "superadmin") throw new Error("Only a Super Admin manages permissions.");
    await wait(300);
    setState((s) => {
      const has = s.rolePerms[role].includes(key);
      const list = has ? s.rolePerms[role].filter((k) => k !== key) : [...s.rolePerms[role], key];
      return { ...s, rolePerms: { ...s.rolePerms, [role]: list } };
    });
    audit(me, "permission.toggle", "role", role, key);
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const broadcast = useCallback(async (title: string, body: string) => {
    requirePerm("notifications");
    await wait(500);
    setState((s) => ({
      ...s,
      notifications: [
        ...s.users.filter((u) => u.role === "customer").map((u) => notif(u.id, { title, body, kind: "system" as const, href: "/dashboard" })),
        ...s.notifications,
      ],
    }));
    audit(me!, "notification.broadcast", "notification", "all", title);
  }, [state.users, me, can]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetDemo = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setState(seedState());
    toast("success", "Demo data reset", "The platform was reseeded with fresh demo data.");
  }, [toast]);

  const value: StoreCtx = {
    state, me, toasts, toast, dismissToast, can,
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
