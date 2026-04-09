import { Outlet } from "react-router-dom";
import { Sidebar } from "@/design-system/components/sidebar";
import { Topbar } from "@/design-system/components/topbar";

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-surface-primary p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
