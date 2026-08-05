import { Navigate, Route, Routes } from "react-router-dom";

import type { SessionUser } from "./api";
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
