import { Routes, Route } from "react-router-dom";
import { AppShell } from "./app-shell";
import { DashboardPlaceholder } from "@/modules/dashboard/page";
import { LoginPage } from "@/modules/auth/login-page";
import { ProtectedRoute } from "@/modules/auth/protected-route";
import { CustomersPage } from "@/modules/customers/page";
import { SuppliersPage } from "@/modules/suppliers/page";
import { FleetPage } from "@/modules/fleet/page";
import { DriversPage } from "@/modules/drivers/page";
import { OperationsPage } from "@/modules/operations/page";
import { ModulePlaceholder } from "@/shared/components/module-placeholder";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPlaceholder />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="fleet" element={<FleetPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route
          path="maintenance"
          element={
            <ModulePlaceholder
              title="Manutenção"
              description="Ordens de serviço, preventiva, corretiva, checklist, peças, serviços e custos."
            />
          }
        />
        <Route
          path="finance"
          element={
            <ModulePlaceholder
              title="Financeiro"
              description="Contas a pagar, despesas, centros de custo, conciliação e relatórios."
            />
          }
        />
        <Route
          path="documents"
          element={
            <ModulePlaceholder
              title="Documentos"
              description="Upload de documentos privados, metadados, listagem e exclusão controlada."
            />
          }
        />
      </Route>
    </Routes>
  );
}
