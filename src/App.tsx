import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { Footer, Navbar } from "./components/chrome";
import { Btn, Spinner, ToastHost } from "./components/ui";
import AuthPage from "./pages/Auth";
import { AddonsPage, PricingPage } from "./pages/Pricing";
import { AboutPage, ContactPage, FaqPage } from "./pages/StaticPages";

/* Code-split heavy route groups (one chunk per module) */
const Home = lazy(() => import("./pages/Home"));
const CatalogPage = lazy(() => import("./pages/Catalog"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CheckoutPage = lazy(() => import("./pages/Checkout"));
const OverviewPage = lazy(() => import("./pages/dashboard/DashboardA").then((m) => ({ default: m.OverviewPage })));
const OwnedProductsPage = lazy(() => import("./pages/dashboard/DashboardA").then((m) => ({ default: m.OwnedProductsPage })));
const WebsitesPage = lazy(() => import("./pages/dashboard/DashboardA").then((m) => ({ default: m.WebsitesPage })));
const DigitalOwnedPage = lazy(() => import("./pages/dashboard/DashboardA").then((m) => ({ default: m.DigitalOwnedPage })));
const AddonsOwnedPage = lazy(() => import("./pages/dashboard/DashboardA").then((m) => ({ default: m.AddonsOwnedPage })));
const OrdersPage = lazy(() => import("./pages/dashboard/DashboardB").then((m) => ({ default: m.OrdersPage })));
const SubscriptionsPage = lazy(() => import("./pages/dashboard/DashboardB").then((m) => ({ default: m.SubscriptionsPage })));
const BillingPage = lazy(() => import("./pages/dashboard/DashboardB").then((m) => ({ default: m.BillingPage })));
const DownloadsPage = lazy(() => import("./pages/dashboard/DashboardB").then((m) => ({ default: m.DownloadsPage })));
const SupportPage = lazy(() => import("./pages/dashboard/DashboardB").then((m) => ({ default: m.SupportPage })));
const SettingsPage = lazy(() => import("./pages/dashboard/DashboardB").then((m) => ({ default: m.SettingsPage })));
const AdminOverview = lazy(() => import("./pages/admin/AdminA").then((m) => ({ default: m.AdminOverview })));
const AdminCustomers = lazy(() => import("./pages/admin/AdminA").then((m) => ({ default: m.AdminCustomers })));
const AdminProducts = lazy(() => import("./pages/admin/AdminA").then((m) => ({ default: m.AdminProducts })));
const AdminCategories = lazy(() => import("./pages/admin/AdminA").then((m) => ({ default: m.AdminCategories })));
const AdminAddons = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminAddons })));
const AdminDeployed = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminDeployed })));
const AdminOrders = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminOrders })));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminSubscriptions })));
const AdminPayments = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminPayments })));
const AdminDownloads = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminDownloads })));
const AdminCoupons = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminCoupons })));
const AdminSupport = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminSupport })));
const AdminContent = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminContent })));
const AdminNotifications = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminNotifications })));
const AdminStaff = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminStaff })));
const AdminRoles = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminRoles })));
const AdminSettings = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminSettings })));
const AdminAudit = lazy(() => import("./pages/admin/AdminB").then((m) => ({ default: m.AdminAudit })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-mist-400">
        <Spinner className="size-6 text-pulse-400" />
        <span className="num text-[11px] uppercase tracking-[0.25em]">Loading</span>
      </div>
    </div>
  );
}

function MaintenanceBanner() {
  const { state } = useStore();
  if (!state.settings.maintenance) return null;
  return (
    <div className="relative z-40 border-b border-solar-400/40 bg-solar-400/12 px-4 py-2 text-center text-[12.5px] font-semibold text-solar-300">
      Scheduled maintenance in progress — new purchases are briefly paused. Dashboards stay available.
    </div>
  );
}

function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <MaintenanceBanner />
      <Navbar />
      <div key={pathname} className="page-enter flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function RequireCustomer() {
  const { me } = useStore();
  const loc = useLocation();
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (me.role !== "customer") return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function RequireStaff() {
  const { me } = useStore();
  const loc = useLocation();
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (me.role === "customer") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="num text-[11px] font-bold tracking-[0.3em] text-pulse-300">ERROR 404</p>
      <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">This aisle doesn't exist</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist-400">The page moved, expired, or was never stocked. The catalog, however, is very much alive.</p>
      <Link to="/" className="mt-7"><Btn icon="home">Back to home</Btn></Link>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <div className="bg-noise" aria-hidden />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<CatalogPage mode="all" />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/solutions" element={<CatalogPage mode="solutions" />} />
              <Route path="/digital-products" element={<CatalogPage mode="digital" />} />
              <Route path="/ebooks" element={<CatalogPage mode="ebooks" />} />
              <Route path="/addons" element={<AddonsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route element={<RequireCustomer />}>
              <Route path="/dashboard" element={<OverviewPage />} />
              <Route path="/dashboard/products" element={<OwnedProductsPage />} />
              <Route path="/dashboard/websites" element={<WebsitesPage />} />
              <Route path="/dashboard/systems" element={<OwnedProductsPage filterType="system" />} />
              <Route path="/dashboard/digital-products" element={<DigitalOwnedPage />} />
              <Route path="/dashboard/addons" element={<AddonsOwnedPage />} />
              <Route path="/dashboard/orders" element={<OrdersPage />} />
              <Route path="/dashboard/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/dashboard/billing" element={<BillingPage />} />
              <Route path="/dashboard/downloads" element={<DownloadsPage />} />
              <Route path="/dashboard/support" element={<SupportPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
            </Route>

            <Route element={<RequireStaff />}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/addons" element={<AdminAddons />} />
              <Route path="/admin/websites" element={<AdminDeployed kind="websites" />} />
              <Route path="/admin/systems" element={<AdminDeployed kind="systems" />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/digital-products" element={<AdminDeployed kind="digital" />} />
              <Route path="/admin/downloads" element={<AdminDownloads />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/support" element={<AdminSupport />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/staff" element={<AdminStaff />} />
              <Route path="/admin/roles" element={<AdminRoles />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/audit-logs" element={<AdminAudit />} />
            </Route>
          </Routes>
        </Suspense>
        <ToastHost />
      </HashRouter>
    </StoreProvider>
  );
}
