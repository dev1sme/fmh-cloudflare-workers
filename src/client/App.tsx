import { Center, Loader } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { auth, type SessionUser } from "./api";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { MyInvoiceDetailPage } from "./pages/nguoithue/MyInvoiceDetailPage";
import { MyInvoicesPage } from "./pages/nguoithue/MyInvoicesPage";
import { MyReadingsPage } from "./pages/nguoithue/MyReadingsPage";
import { InvoiceDetailPage } from "./pages/quanly/InvoiceDetailPage";
import { InvoicesPage } from "./pages/quanly/InvoicesPage";
import { ReadingsPage } from "./pages/quanly/ReadingsPage";
import { RoomsPage } from "./pages/quanly/RoomsPage";
import { SettingsPage } from "./pages/quanly/SettingsPage";

type AuthState = { status: "loading" } | { status: "out" } | { status: "in"; user: SessionUser };

export function App() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    auth
      .me()
      .then(({ user }) => setState({ status: "in", user }))
      .catch(() => setState({ status: "out" }));
  }, []);

  const logout = useCallback(async () => {
    await auth.logout().catch(() => undefined);
    setState({ status: "out" });
  }, []);

  if (state.status === "loading") {
    return (
      <Center mih="100dvh">
        <Loader />
      </Center>
    );
  }

  if (state.status === "out") {
    return <LoginPage onLogin={(user) => setState({ status: "in", user })} />;
  }

  const quanLy = state.user.vai_tro === "quan_ly";

  return (
    <Routes>
      <Route element={<AppLayout user={state.user} onLogout={logout} />}>
        {quanLy ? (
          <>
            <Route path="/phong" element={<RoomsPage />} />
            <Route path="/chi-so" element={<ReadingsPage />} />
            <Route path="/hoa-don" element={<InvoicesPage />} />
            <Route path="/hoa-don/:id" element={<InvoiceDetailPage />} />
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
