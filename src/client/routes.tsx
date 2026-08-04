import { Navigate, Route, Routes } from "react-router-dom";

import type { SessionUser } from "./api";
import { AppLayout } from "./components/AppLayout";
import { SettingsPage } from "./features/cai-dat/SettingsPage";
import { ChangePasswordPage } from "./features/doi-mat-khau/ChangePasswordPage";
import { ReadingsPage } from "./features/chi-so/ReadingsPage";
import { InvoiceDetailPage } from "./features/hoa-don/InvoiceDetailPage";
import { InvoicesPage } from "./features/hoa-don/InvoicesPage";
import { MyInvoiceDetailPage } from "./features/cua-toi/MyInvoiceDetailPage";
import { MyInvoicesPage } from "./features/cua-toi/MyInvoicesPage";
import { MyReadingsPage } from "./features/cua-toi/MyReadingsPage";
import { TenantsPage } from "./features/nguoi-thue/TenantsPage";
import { RoomsPage } from "./features/phong/RoomsPage";
import { AccountsPage } from "./features/tai-khoan/AccountsPage";

/**
 * Which screens exist depends on the role. This is navigation convenience,
 * not access control — the API enforces the roles on every request.
 */
export function AppRoutes({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const quanLy = user.vai_tro === "quan_ly";

  return (
    <Routes>
      <Route element={<AppLayout user={user} onLogout={onLogout} />}>
        {/* Available to both roles. */}
        <Route path="/doi-mat-khau" element={<ChangePasswordPage />} />

        {quanLy ? (
          <>
            <Route path="/phong" element={<RoomsPage />} />
            <Route path="/nguoi-thue" element={<TenantsPage />} />
            <Route path="/chi-so" element={<ReadingsPage />} />
            <Route path="/hoa-don" element={<InvoicesPage />} />
            <Route path="/hoa-don/:id" element={<InvoiceDetailPage />} />
            <Route path="/tai-khoan" element={<AccountsPage user={user} />} />
            <Route path="/cai-dat" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/phong" replace />} />
          </>
        ) : (
          <>
            <Route path="/hoa-don-cua-toi" element={<MyInvoicesPage />} />
            <Route path="/hoa-don-cua-toi/:id" element={<MyInvoiceDetailPage />} />
            <Route path="/chi-so-cua-toi" element={<MyReadingsPage />} />
            <Route path="*" element={<Navigate to="/hoa-don-cua-toi" replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
}
