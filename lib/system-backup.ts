import { AppStore } from "@/lib/store-data";

export const SYSTEM_BACKUP_SCHEMA_VERSION = 1;

export type SystemBackupSummary = {
  restaurants: number;
  categories: number;
  products: number;
  masterUsers: number;
  orders: number;
  customers: number;
  leads: number;
  adminUsers: number;
  adminRoles: number;
  auditLogs: number;
  supportTickets: number;
  supportMessages: number;
};

export type SystemBackupPayload = {
  schemaVersion: number;
  source: "pedezap-admin";
  generatedAt: string;
  summary: SystemBackupSummary;
  store: AppStore;
};

export function buildSystemBackupSummary(store: Partial<AppStore> | null | undefined): SystemBackupSummary {
  const restaurants = store?.restaurants ?? [];
  return {
    restaurants: restaurants.length,
    categories: restaurants.reduce((sum, item) => sum + (item.categories?.length ?? 0), 0),
    products: restaurants.reduce((sum, item) => sum + (item.products?.length ?? 0), 0),
    masterUsers: restaurants.reduce((sum, item) => sum + (item.panelUsers?.length ?? 0), 0),
    orders: store?.orders?.length ?? 0,
    customers: store?.customers?.length ?? 0,
    leads: store?.leads?.length ?? 0,
    adminUsers: store?.adminUsers?.length ?? 0,
    adminRoles: store?.adminRoles?.length ?? 0,
    auditLogs: store?.auditLogs?.length ?? 0,
    supportTickets: store?.supportTickets?.length ?? 0,
    supportMessages: store?.supportMessages?.length ?? 0
  };
}

export function createSystemBackupPayload(store: AppStore): SystemBackupPayload {
  return {
    schemaVersion: SYSTEM_BACKUP_SCHEMA_VERSION,
    source: "pedezap-admin",
    generatedAt: new Date().toISOString(),
    summary: buildSystemBackupSummary(store),
    store
  };
}

