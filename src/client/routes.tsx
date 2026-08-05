import { Navigate, Route, Routes } from "react-router-dom";

import type { SessionUser } from "./api";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { ChangePasswordPage } from "./features/change-password/ChangePasswordPage";
import { ReadingsPage } from "./features/readings/ReadingsPage";
import { InvoiceDetailPage } from "./features/invoices/InvoiceDetailPage";
import { InvoicesPage } from "./features/invoices/InvoicesPage";
import { MyInvoiceDetailPage } from "./features/my/MyInvoiceDetailPage";
import { MyInvoicesPage } from "./features/my/MyInvoicesPage";
import { MyReadingsPage } from "./features/my/MyReadingsPage";
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
  const home = quanLy ? "/dashboard" : "/my-invoices";

  return (
    <Routes>
      <Route element={<AppLayout user={user} onLogout={onLogout} />}>
        {/* Available to both roles. */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Only the bare root redirects. Everything else unknown is a 404 —
            silently bouncing a mistyped or stale link hides the mistake. */}
        <Route path="/" element={<Navigate to={home} replace />} />

        {quanLy ? (
          <>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/readings" element={<ReadingsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/accounts" element={<AccountsPage user={user} />} />
            <Route path="/settings" element={<SettingsPage />} />
          </>
        ) : (
          <>
            <Route path="/my-invoices" element={<MyInvoicesPage />} />
            <Route path="/my-invoices/:id" element={<MyInvoiceDetailPage />} />
            <Route path="/my-readings" element={<MyReadingsPage />} />
          </>
        )}

        <Route path="*" element={<NotFoundPage home={home} />} />
      </Route>
    </Routes>
  );
}
