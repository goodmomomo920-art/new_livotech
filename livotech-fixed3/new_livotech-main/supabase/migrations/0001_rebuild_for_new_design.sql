-- =====================================================================
-- LivoTech — rebuild schema to match the new frontend's data model
-- WARNING: this drops every table from the old project. Old data is
-- gone after this runs. Only run this once, on purpose.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Drop everything from the old schema
-- ---------------------------------------------------------------------
drop table if exists
  admin_activity_logs, announcements, coupon_redemptions, coupons,
  customer_addons, customer_products, downloads, invoices, notifications,
  order_items, orders, payments, permissions, product_addons, product_faqs,
  product_features, product_files, product_images, product_plans,
  product_type_addons, product_types, products, profiles, role_permissions,
  roles, settings, site_content, site_faqs, staff, subscriptions,
  support_messages, support_tickets, websites, categories, addons
  cascade;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 2) profiles — one row per auth user, holds role/status/app fields
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  role text not null default 'customer' check (role in ('customer','admin','superadmin')),
  status text not null default 'active' check (status in ('active','suspended')),
  company text,
  "createdAt" timestamptz not null default now()
);

-- auto-create a profile row whenever someone signs up via supabase auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- helper: current user's role, used by RLS policies below
create or replace function public.current_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function public.is_staff()
returns boolean as $$
  select public.current_role() in ('admin','superadmin');
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------
-- 3) role_permissions — mirrors RolePerms in types.ts
-- ---------------------------------------------------------------------
create table role_permissions (
  role text primary key check (role in ('customer','admin','superadmin')),
  perms jsonb not null default '[]'
);

insert into role_permissions (role, perms) values
  ('customer', '[]'),
  ('admin', '["products","categories","addons","orders","subscriptions","customers","support","content","downloads","coupons","websites","notifications"]'),
  ('superadmin', '["products","categories","addons","orders","subscriptions","payments","customers","support","content","downloads","coupons","websites","notifications","staff","roles","settings","audit"]');

-- ---------------------------------------------------------------------
-- 4) catalog: categories, products, addons
-- ---------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text default '',
  active boolean not null default true,
  "order" int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text default '',
  description text default '',
  type text not null check (type in ('website','system','saas','digital','ebook','other')),
  "categoryId" uuid references categories(id) on delete set null,
  image text default '',
  gallery jsonb not null default '[]',
  price numeric not null default 0,
  "compareAt" numeric,
  "monthlyPrice" numeric,
  "yearlyPrice" numeric,
  billing text not null default 'once' check (billing in ('once','subscription')),
  rating numeric not null default 0,
  reviews int not null default 0,
  features jsonb not null default '[]',
  tags jsonb not null default '[]',
  faqs jsonb not null default '[]',
  files jsonb not null default '[]',
  "downloadNote" text,
  downloadable boolean not null default false,
  active boolean not null default true,
  featured boolean not null default false,
  version text default '1.0',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table addons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text default '',
  price numeric not null default 0,
  interval text not null check (interval in ('monthly','once')),
  icon text default '',
  active boolean not null default true,
  features jsonb not null default '[]',
  compat jsonb not null default '[]',
  "productIds" jsonb not null default '[]'
);

-- ---------------------------------------------------------------------
-- 5) ownership / entitlements
-- ---------------------------------------------------------------------
create table ownerships (
  id uuid primary key default gen_random_uuid(),
  "customerId" uuid not null references profiles(id) on delete cascade,
  "productId" uuid not null references products(id) on delete cascade,
  "orderId" uuid,
  status text not null check (status in ('active','expired','cancelled','suspended')),
  "purchasedAt" timestamptz not null default now(),
  "activatedAt" timestamptz,
  "expiresAt" timestamptz,
  "subscriptionId" uuid
);

create table customer_addons (
  id uuid primary key default gen_random_uuid(),
  "customerId" uuid not null references profiles(id) on delete cascade,
  "addonId" uuid not null references addons(id) on delete cascade,
  "attachedProductId" uuid references products(id) on delete set null,
  "attachedProductName" text,
  "orderId" uuid,
  interval text not null check (interval in ('monthly','once')),
  price numeric not null,
  status text not null check (status in ('active','cancelled')),
  "startedAt" timestamptz not null default now(),
  "renewsAt" timestamptz
);

create table websites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "productId" uuid references products(id) on delete set null,
  "customerId" uuid not null references profiles(id) on delete cascade,
  domain text,
  url text,
  plan text,
  status text not null check (status in ('pending','active','suspended','expired')),
  "createdAt" timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6) orders / subscriptions / coupons
-- ---------------------------------------------------------------------
create table coupons (
  code text primary key,
  kind text not null check (kind in ('percent','fixed')),
  value numeric not null,
  "minOrder" numeric not null default 0,
  "maxDiscount" numeric,
  "startsAt" timestamptz not null default now(),
  "expiresAt" timestamptz not null,
  "usageLimit" int not null default 0,
  used int not null default 0,
  "perCustomer" int not null default 1,
  active boolean not null default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  "customerId" uuid not null references profiles(id) on delete cascade,
  items jsonb not null default '[]',
  subtotal numeric not null,
  discount numeric not null default 0,
  "couponCode" text references coupons(code) on delete set null,
  total numeric not null,
  currency text not null default 'USD',
  status text not null check (status in ('pending','processing','completed','cancelled','refunded')),
  "paymentStatus" text not null check ("paymentStatus" in ('pending','paid','failed','refunded')),
  "paymentMethod" text,
  "createdAt" timestamptz not null default now()
);

alter table ownerships add constraint ownerships_order_fk foreign key ("orderId") references orders(id) on delete set null;
alter table customer_addons add constraint customer_addons_order_fk foreign key ("orderId") references orders(id) on delete set null;

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  "customerId" uuid not null references profiles(id) on delete cascade,
  "productId" uuid references products(id) on delete set null,
  "orderId" uuid references orders(id) on delete set null,
  plan text not null,
  price numeric not null,
  interval text not null check (interval in ('monthly','yearly')),
  status text not null check (status in ('trial','active','past_due','paused','cancelled','expired')),
  "startDate" timestamptz not null default now(),
  "nextBillingAt" timestamptz,
  "cancelledAt" timestamptz
);

alter table ownerships add constraint ownerships_sub_fk foreign key ("subscriptionId") references subscriptions(id) on delete set null;

-- ---------------------------------------------------------------------
-- 7) downloads / support / notifications / audit / contacts / settings
-- ---------------------------------------------------------------------
create table downloads (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references profiles(id) on delete cascade,
  "productId" uuid references products(id) on delete set null,
  "fileId" text,
  "fileName" text,
  at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  "customerId" uuid not null references profiles(id) on delete cascade,
  subject text not null,
  category text,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','waiting','resolved','closed')),
  assignee text,
  "createdAt" timestamptz not null default now(),
  messages jsonb not null default '[]'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  "userId" text not null, -- profile id, or the literal 'admin' for staff-facing notifications
  title text not null,
  body text default '',
  kind text not null check (kind in ('purchase','renewal','payment','update','download','support','system')),
  read boolean not null default false,
  href text,
  at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  "actorId" uuid references profiles(id) on delete set null,
  "actorName" text,
  action text not null,
  resource text not null,
  "resourceId" text,
  meta text,
  at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  body text,
  at timestamptz not null default now()
);

create table settings (
  id int primary key default 1 check (id = 1),
  brand text not null default 'LivoTech',
  tagline text default '',
  announcement text default '',
  currency text not null default 'USD',
  "contactEmail" text default '',
  "supportEmail" text default '',
  twitter text default '',
  github text default '',
  linkedin text default '',
  maintenance boolean not null default false
);
insert into settings (id) values (1);

-- =====================================================================
-- 8) Row Level Security
-- =====================================================================
alter table profiles enable row level security;
alter table role_permissions enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table addons enable row level security;
alter table ownerships enable row level security;
alter table customer_addons enable row level security;
alter table websites enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table subscriptions enable row level security;
alter table downloads enable row level security;
alter table tickets enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table contacts enable row level security;
alter table settings enable row level security;

-- profiles: everyone can read their own; staff can read/update all
create policy "profiles_select_own" on profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles_update_own" on profiles for update using (id = auth.uid() or public.is_staff());
create policy "profiles_staff_insert" on profiles for insert with check (public.is_staff());

-- role_permissions: public read (needed to compute `can()` in the UI), staff write
create policy "role_perms_read" on role_permissions for select using (true);
create policy "role_perms_write" on role_permissions for all using (public.is_staff()) with check (public.is_staff());

-- catalog: anyone (incl. anonymous) can read active items; staff manage all
create policy "categories_read" on categories for select using (active or public.is_staff());
create policy "categories_write" on categories for all using (public.is_staff()) with check (public.is_staff());

create policy "products_read" on products for select using (active or public.is_staff());
create policy "products_write" on products for all using (public.is_staff()) with check (public.is_staff());

create policy "addons_read" on addons for select using (active or public.is_staff());
create policy "addons_write" on addons for all using (public.is_staff()) with check (public.is_staff());

-- ownerships / customer_addons / websites: customer sees own, staff sees all
create policy "ownerships_select" on ownerships for select using ("customerId" = auth.uid() or public.is_staff());
create policy "ownerships_write" on ownerships for all using (public.is_staff()) with check (public.is_staff());

create policy "customer_addons_select" on customer_addons for select using ("customerId" = auth.uid() or public.is_staff());
create policy "customer_addons_write" on customer_addons for all using (public.is_staff()) with check (public.is_staff());

create policy "websites_select" on websites for select using ("customerId" = auth.uid() or public.is_staff());
create policy "websites_write" on websites for all using (public.is_staff()) with check (public.is_staff());

-- coupons: staff only read/write (validated server-side via RPC/Edge Function, not trusted from client select)
create policy "coupons_staff_all" on coupons for all using (public.is_staff()) with check (public.is_staff());

-- orders / subscriptions: customer sees & inserts own, staff sees/manages all
create policy "orders_select" on orders for select using ("customerId" = auth.uid() or public.is_staff());
create policy "orders_insert_own" on orders for insert with check ("customerId" = auth.uid());
create policy "orders_update_staff" on orders for update using (public.is_staff());

create policy "subscriptions_select" on subscriptions for select using ("customerId" = auth.uid() or public.is_staff());
create policy "subscriptions_write" on subscriptions for all using (public.is_staff()) with check (public.is_staff());

-- downloads: customer inserts/reads own, staff read all
create policy "downloads_select" on downloads for select using ("userId" = auth.uid() or public.is_staff());
create policy "downloads_insert_own" on downloads for insert with check ("userId" = auth.uid());

-- tickets: customer manages own, staff manage all
create policy "tickets_select" on tickets for select using ("customerId" = auth.uid() or public.is_staff());
create policy "tickets_insert_own" on tickets for insert with check ("customerId" = auth.uid());
create policy "tickets_update" on tickets for update using ("customerId" = auth.uid() or public.is_staff());

-- notifications: user sees own; 'admin' bucket visible to staff only
create policy "notifications_select" on notifications for select using ("userId" = auth.uid()::text or (public.is_staff() and "userId" = 'admin'));
create policy "notifications_update" on notifications for update using ("userId" = auth.uid()::text or (public.is_staff() and "userId" = 'admin'));
create policy "notifications_insert" on notifications for insert with check (true);

-- audit_logs: staff only
create policy "audit_staff_read" on audit_logs for select using (public.is_staff());
create policy "audit_insert" on audit_logs for insert with check (public.is_staff());

-- contacts: anyone can submit, staff can read
create policy "contacts_insert" on contacts for insert with check (true);
create policy "contacts_staff_read" on contacts for select using (public.is_staff());

-- settings: public read, staff write
create policy "settings_read" on settings for select using (true);
create policy "settings_write" on settings for update using (public.is_staff());
