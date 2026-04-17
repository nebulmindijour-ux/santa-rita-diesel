import { api } from "@/shared/lib/api-client";

export interface FleetStats {
  total: number;
  available: number;
  in_route: number;
  in_maintenance: number;
  inactive: number;
}

export interface DriverStats {
  total: number;
  available: number;
  in_route: number;
  vacation_or_leave: number;
}

export interface OperationStats {
  total_month: number;
  in_transit: number;
  completed_month: number;
  cancelled_month: number;
  pending: number;
  delayed: number;
}

export interface MaintenanceStats {
  open_orders: number;
  in_progress_orders: number;
  due_schedules: number;
  month_cost: number;
}

export interface DocumentAlert {
  entity_type: string;
  entity_id: string;
  entity_label: string;
  document_type: string;
  expires_at: string;
  days_remaining: number;
  is_expired: boolean;
}

export interface OperationTimelineItem {
  id: string;
  code: string;
  status: string;
  customer_name: string;
  vehicle_plate: string | null;
  origin_city: string | null;
  destination_city: string | null;
  scheduled_start: string | null;
}

export interface DashboardData {
  fleet: FleetStats;
  drivers: DriverStats;
  operations: OperationStats;
  maintenance: MaintenanceStats;
  alerts: DocumentAlert[];
  recent_operations: OperationTimelineItem[];
}

export const dashboardService = {
  async getOverview(): Promise<DashboardData> {
    return api.get("dashboard/overview").json();
  },
};
