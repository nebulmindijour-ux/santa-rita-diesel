import { api } from "@/shared/lib/api-client";

export type NotificationSeverity = "critical" | "warning" | "info";
export type NotificationCategory = "document" | "maintenance" | "operation";

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link: string;
  date_reference: string | null;
}

export interface NotificationsSummary {
  total: number;
  critical_count: number;
  warning_count: number;
  items: NotificationItem[];
}

export const notificationsService = {
  async getSummary(): Promise<NotificationsSummary> {
    return api.get("notifications/summary").json();
  },
};
