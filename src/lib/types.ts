/* ------------------------------ LivoTech types ------------------------------ */

export type Role = "customer" | "admin" | "superadmin";
export type PermissionKey =
  | "products" | "categories" | "addons" | "orders" | "subscriptions" | "payments"
  | "customers" | "support" | "content" | "downloads" | "coupons" | "websites"
  | "notifications" | "staff" | "roles" | "settings" | "audit";
export type RolePerms = Record<Role, PermissionKey[]>;

export type ProductType = "website" | "system" | "saas" | "digital" | "ebook" | "other";
export type BillingInterval = "once" | "monthly" | "yearly";

export interface ProductFile { id: string; name: string; size: string; type: string; version: string }
export interface ProductFaq { q: string; a: string }

export interface Product {
  id: string; slug: string; name: string; tagline: string; description: string;
  type: ProductType; categoryId: string;
  image: string; gallery: string[];
  price: number; compareAt?: number; monthlyPrice?: number; yearlyPrice?: number;
  currency: "USD" | "EGP";
  billing: "once" | "subscription";
  rating: number; reviews: number;
  features: string[]; tags: string[]; faqs: ProductFaq[];
  files: ProductFile[]; downloadNote?: string; downloadable: boolean;
  active: boolean; featured: boolean; version: string;
  createdAt: string; updatedAt: string;
}

export interface Category { id: string; slug: string; name: string; description: string; active: boolean; order: number }

export interface Addon {
  id: string; slug: string; name: string; description: string;
  price: number; interval: "monthly" | "once"; icon: string; active: boolean;
  features: string[]; compat: ProductType[];
  /** Products this add-on is explicitly linked to (managed by admin). */
  productIds: string[];
}

export interface Ownership {
  id: string; customerId: string; productId: string; orderId: string;
  status: "active" | "expired" | "cancelled" | "suspended";
  purchasedAt: string; activatedAt?: string; expiresAt?: string; subscriptionId?: string;
}

export interface CustomerAddon {
  id: string; customerId: string; addonId: string;
  attachedProductId: string; attachedProductName: string;
  orderId: string; interval: "monthly" | "once"; price: number;
  status: "active" | "cancelled"; startedAt: string; renewsAt?: string;
}

export interface Website {
  id: string; name: string; productId: string; customerId: string;
  domain: string; url: string; plan: string;
  status: "pending" | "active" | "suspended" | "expired"; createdAt: string;
}

export interface OrderItem {
  productId: string; name: string; type: string; qty: number;
  unitPrice: number; interval: BillingInterval; total: number;
}

export interface Order {
  id: string; number: string; customerId: string; items: OrderItem[];
  subtotal: number; discount: number; couponCode?: string; total: number; currency: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string; createdAt: string;
}

export interface Subscription {
  id: string; customerId: string; productId: string; orderId: string;
  plan: string; price: number; interval: "monthly" | "yearly";
  status: "trial" | "active" | "past_due" | "paused" | "cancelled" | "expired";
  startDate: string; nextBillingAt: string; cancelledAt?: string;
}

export interface Download { id: string; userId: string; productId: string; fileId: string; fileName: string; at: string }

export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export interface TicketMessage { id: string; author: "customer" | "support"; authorName: string; body: string; at: string }
export interface Ticket {
  id: string; number: string; customerId: string; subject: string; category: string;
  priority: TicketPriority; status: TicketStatus; assignee?: string;
  createdAt: string; messages: TicketMessage[];
}

export interface AppNotification {
  id: string; userId: string; title: string; body: string;
  kind: "purchase" | "renewal" | "payment" | "update" | "download" | "support" | "system";
  read: boolean; href?: string; at: string;
}

export interface AuditLog {
  id: string; actorId: string; actorName: string; action: string;
  resource: string; resourceId: string; meta?: string; at: string;
}

export interface Coupon {
  code: string; kind: "percent" | "fixed"; value: number; minOrder: number; maxDiscount?: number;
  startsAt: string; expiresAt: string; usageLimit: number; used: number; perCustomer: number; active: boolean;
}

export interface Settings {
  brand: string; tagline: string; announcement: string; currency: string;
  contactEmail: string; supportEmail: string;
  twitter: string; github: string; linkedin: string;
  maintenance: boolean;
}

export interface ContactMsg { id: string; name: string; email: string; subject: string; body: string; at: string }

export interface CartState { productId: string; interval: BillingInterval; addonIds: string[] }

export interface User {
  id: string; name: string; email: string; password: string;
  role: Role; status: "active" | "suspended"; company?: string; createdAt: string;
}

export interface StoreState {
  v: number;
  sessionUserId: string | null;
  users: User[];
  rolePerms: RolePerms;
  categories: Category[];
  products: Product[];
  addons: Addon[];
  ownerships: Ownership[];
  customerAddons: CustomerAddon[];
  websites: Website[];
  orders: Order[];
  subscriptions: Subscription[];
  downloads: Download[];
  tickets: Ticket[];
  notifications: AppNotification[];
  audit: AuditLog[];
  coupons: Coupon[];
  settings: Settings;
  contacts: ContactMsg[];
  cart: CartState | null;
}
