import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import type { SessionUser } from "./api";
import { AppLayout } from "./components/AppLayout";
import { TenantLayout } from "./components/TenantLayout";
import { LoginPage } from "./features/login/LoginPage";
import { NotFoundPage } from "./features/not-found/NotFoundPage";

/**
 * Every screen behind the login is its own chunk; the login form, the two
 * shells and the 404 are not.
 *
 * The route table is where the two roles already diverge, so it is the only
 * honest split boundary in the app. Statically imported, a tenant opening one
 * invoice on a phone downloaded the whole manager panel — including Recharts,
 * which `DashboardPage` alone pulls in and which is the single largest thing in
 * the bundle. Nothing a tenant can reach renders a chart.
 *
 * The shells stay eager on purpose. Making them lazy costs a waterfall — React
 * cannot start the page's import until the layout has resolved and rendered its
 * `<Outlet />` — and buys almost nothing, because their weight is Mantine, which
 * both roles load anyway.
 *
 * `lazy` wants a module whose default export is the component and every page
 * here is a named export, hence the `.then`. Written out per page rather than
 * through a helper so each one keeps its real prop types.
 */
const QuickSearch = lazy(() =>
  import("./components/QuickSearch").then((m) => ({ default: m.QuickSearch })),
);
const DashboardPage = lazy(() =>
  import("./features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const BuildingsPage = lazy(() =>
  import("./features/buildings/BuildingsPage").then((m) => ({ default: m.BuildingsPage })),
);
const RoomsPage = lazy(() =>
  import("./features/rooms/RoomsPage").then((m) => ({ default: m.RoomsPage })),
);
const TenantsPage = lazy(() =>
  import("./features/tenants/TenantsPage").then((m) => ({ default: m.TenantsPage })),
);
const ReadingsPage = lazy(() =>
  import("./features/readings/ReadingsPage").then((m) => ({ default: m.ReadingsPage })),
);
const InvoicesPage = lazy(() =>
  import("./features/invoices/InvoicesPage").then((m) => ({ default: m.InvoicesPage })),
);
const InvoiceDetailPage = lazy(() =>
  import("./features/invoices/InvoiceDetailPage").then((m) => ({ default: m.InvoiceDetailPage })),
);
const ReportsPage = lazy(() =>
  import("./features/reports/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const AccountsPage = lazy(() =>
  import("./features/accounts/AccountsPage").then((m) => ({ default: m.AccountsPage })),
);
const NotificationsPage = lazy(() =>
  import("./features/notifications/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const ChangePasswordPage = lazy(() =>
  import("./features/change-password/ChangePasswordPage").then((m) => ({
    default: m.ChangePasswordPage,
  })),
);
const MyHomePage = lazy(() =>
  import("./features/my/MyHomePage").then((m) => ({ default: m.MyHomePage })),
);
const MyInvoiceDetailPage = lazy(() =>
  import("./features/my/MyInvoiceDetailPage").then((m) => ({ default: m.MyInvoiceDetailPage })),
);

/**
 * The signed-out table: one real screen at `/login`, everything else sent
 * there.
 *
 * `/login` exists so the address bar says which screen is on show. Without it
 * the login form rendered over whatever path happened to be there, which broke
 * in two ways. A path from the previous session was handed to the next one —
 * sign out of a tenant account on `/my-invoices/HD3C8EA506`, sign back in as
 * the manager, and the manager's table has no such route, so a successful
 * login landed on a 404. And once signed-out paths were normalised to `/`
 * instead, `/` meant the login screen to a visitor and the tenant's home
 * screen to a tenant — one URL, two screens.
 *
 * The catch-all redirect does the normalising declaratively. Doing it with an
 * effect meant `navigate` ran in the same pass as the state change, with the
 * outgoing role's table still mounted to resolve the new path first.
 *
 * Deliberately no `returnTo`: carrying the attempted path across a login is
 * exactly what produced the 404, since the path belongs to whichever role was
 * signed in before, not to whoever signs in next.
 */
export function LoginRoutes({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

/**
 * Which screens exist depends on the role. This is navigation convenience,
 * not access control — the API enforces the roles on every request.
 *
 * The `<Suspense>` for these routes lives inside each layout, around its
 * `<Outlet />`, so a chunk still downloading leaves the sidebar and header in
 * place instead of blanking the shell as well.
 */
export function AppRoutes({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const isManager = user.role === "MANAGER";

  return (
    <>
      {/* Ctrl+K, manager only — a tenant has one room and nothing to jump
          between, and now does not download it either. No fallback: a search
          box that has not arrived yet should show nothing, not a spinner. */}
      {isManager && (
        <Suspense fallback={null}>
          <QuickSearch />
        </Suspense>
      )}

      <Routes>
        {/* Signing in leaves `/login` in the address bar; send it to the role's
            own landing screen rather than letting the catch-all 404 it. */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        {isManager ? (
          <Route element={<AppLayout user={user} onLogout={onLogout} />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/buildings" element={<BuildingsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/readings" element={<ReadingsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/:code" element={<InvoiceDetailPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/accounts" element={<AccountsPage user={user} />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            {/* "Cài đặt" is what this screen was called before buildings split
                off into their own page and it kept only the Zalo bots — an old
                bookmark or muscle memory should still land somewhere, not 404. */}
            <Route path="/settings" element={<Navigate to="/notifications" replace />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="*" element={<NotFoundPage home="/dashboard" />} />
          </Route>
        ) : (
          <Route element={<TenantLayout user={user} onLogout={onLogout} />}>
            {/* One screen. `/dashboard`, `/my-invoices` and `/my-readings` all
                showed slices of the same table, so they collapse into it and
                the old paths redirect rather than 404 on a stale bookmark. */}
            <Route path="/" element={<MyHomePage />} />
            <Route path="/my-invoices/:code" element={<MyInvoiceDetailPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/my-invoices" element={<Navigate to="/" replace />} />
            <Route path="/my-readings" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage home="/" />} />
          </Route>
        )}
      </Routes>
    </>
  );
}
