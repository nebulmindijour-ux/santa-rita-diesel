import { Routes, Route } from "react-router-dom";
import { AppShell } from "./app-shell";
import { DashboardPage } from "@/modules/dashboard/page";
import { LoginPage } from "@/modules/auth/login-page";
import { ProtectedRoute } from "@/modules/auth/protected-route";
import { CustomersPage } from "@/modules/customers/page";
import { SuppliersPage } from "@/modules/suppliers/page";
import { FleetPage } from "@/modules/fleet/page";
import { DriversPage } from "@/modules/drivers/page";
import { OperationsPage } from "@/modules/operations/page";
import { MaintenancePage } from "@/modules/maintenance/page";
import { FinancePage } from "@/modules/finance/page";
import { DocumentsPage } from "@/modules/documents/page";
import { UsersPage } from "@/modules/users/page";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="fleet" element={<FleetPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}
