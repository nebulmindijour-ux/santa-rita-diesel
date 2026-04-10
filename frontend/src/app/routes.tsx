import { Routes, Route } from "react-router-dom";
import { AppShell } from "./app-shell";
import { DashboardPlaceholder } from "@/modules/dashboard/page";
import { LoginPage } from "@/modules/auth/login-page";
import { ProtectedRoute } from "@/modules/auth/protected-route";
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
        <Route
          path="fleet"
          element={
            <ModulePlaceholder
              title="Frota"
              description="Gestão de caminhões, reboques, veículos de apoio, status operacional, odômetro, horímetro e disponibilidade."
            />
          }
        />
        <Route
          path="drivers"
          element={
            <ModulePlaceholder
              title="Motoristas"
              description="Cadastro de motoristas, documentos, CNH, vencimentos, jornada e histórico operacional."
            />
          }
        />
        <Route
          path="operations"
          element={
            <ModulePlaceholder
              title="Operações"
              description="Entregas, rotas, status, previsões, ocorrências e link de rastreio externo."
            />
          }
        />
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
