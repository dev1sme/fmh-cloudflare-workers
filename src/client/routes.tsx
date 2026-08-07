import { Navigate, Route, Routes } from "react-router-dom";

import type { SessionUser } from "./api";
import { LoginPage } from "./features/login/LoginPage";
import { AppLayout } from "./components/AppLayout";
import { TenantLayout } from "./components/TenantLayout";
import { QuickSearch } from "./components/QuickSearch";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { ChangePasswordPage } from "./features/change-password/ChangePasswordPage";
import { ReadingsPage } from "./features/readings/ReadingsPage";
import { InvoiceDetailPage } from "./features/invoices/InvoiceDetailPage";
import { InvoicesPage } from "./features/invoices/InvoicesPage";
import { MyHomePage } from "./features/my/MyHomePage";
import { MyInvoiceDetailPage } from "./features/my/MyInvoiceDetailPage";
import { NotFoundPage } from "./features/not-found/NotFoundPage";
import { TenantsPage } from "./features/tenants/TenantsPage";
import { RoomsPage } from "./features/rooms/RoomsPage";
import { AccountsPage } from "./features/accounts/AccountsPage";

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
 */
export function AppRoutes({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const quanLy = user.role === "MANAGER";

  return (
    <>
      {/* Ctrl+K, manager only — a tenant has one room and nothing to jump between. */}
      {quanLy && <QuickSearch />}

      <Routes>
        {/* Signing in leaves `/login` in the address bar; send it to the role's
            own landing screen rather than letting the catch-all 404 it. */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        {quanLy ? (
          <Route element={<AppLayout user={user} onLogout={onLogout} />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/readings" element={<ReadingsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/:code" element={<InvoiceDetailPage />} />
            <Route path="/accounts" element={<AccountsPage user={user} />} />
            <Route path="/settings" element={<SettingsPage />} />
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
