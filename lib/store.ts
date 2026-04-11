import { promises as fs } from "node:fs";
import path from "node:path";
import { AppStore, Restaurant, defaultStore } from "@/lib/store-data";
import { prisma } from "@/lib/prisma";

const defaultSeedPath = path.join(process.cwd(), "data", "store.json");
const DB_STATE_KEY = "app_store";
let dbSchemaReady: Promise<boolean> | null = null;
const requireDatabase =
  process.env.REQUIRE_DATABASE === "true" || process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const shouldStrictRequireDatabase = requireDatabase && !isBuildPhase;
const DEFAULT_MASTER_PLAN_TABS = [
  "dashboard",
  "orders",
  "menu",
  "highlights",
  "clients",
  "billing",
  "promotions",
  "banners",
  "marketing",
  "settings",
  "plans",
  "support"
] as const;

function toDbJsonPayload(store: AppStore): object {
  // Prisma JSON does not accept undefined values in nested objects.
  // This keeps payload compatible for PostgreSQL JSON/JSONB columns.
  return JSON.parse(JSON.stringify(store)) as object;
}
const runtimeStorePath = (() => {
  if (process.env.STORE_FILE_PATH) return process.env.STORE_FILE_PATH;
  if (process.env.STORE_DATA_DIR) return path.join(process.env.STORE_DATA_DIR, "store.json");
  if (process.env.RENDER_DISK_PATH) return path.join(process.env.RENDER_DISK_PATH, "store.json");
  if (process.env.NODE_ENV === "production") {
    // Render and similar hosts keep app dir read-only in runtime; /tmp is writable.
    return path.join("/tmp", "pedezap-data", "store.json");
  }
  return path.join(process.cwd(), "data", "store.json");
})();

export function getNormalizedSubscriptionStatus(
  restaurant: Pick<Restaurant, "subscriptionStatus" | "trialEndsAt" | "nextBillingAt">
): "trial" | "active" | "pending_payment" | "expired" | "canceled" {
  const now = new Date();
  const graceDays = 10;
  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  const status = restaurant.subscriptionStatus ?? "active";
  const trialEndsAt = restaurant.trialEndsAt ? new Date(restaurant.trialEndsAt) : null;
  const nextBillingAt = restaurant.nextBillingAt ? new Date(restaurant.nextBillingAt) : null;

  if (status === "canceled") return "canceled";
  if (status === "trial" && trialEndsAt && trialEndsAt < now) return "expired";
  if (status === "active" && nextBillingAt && nextBillingAt < now) {
    const graceLimit = nextBillingAt.getTime() + graceMs;
    if (now.getTime() > graceLimit) return "expired";
    return "active";
  }
  if (status === "pending_payment") {
    if (trialEndsAt && trialEndsAt < now) return "expired";
    if (nextBillingAt && nextBillingAt < now) {
      const graceLimit = nextBillingAt.getTime() + graceMs;
      if (now.getTime() > graceLimit) return "expired";
    }
  }

  return status;
}

export function isSubscriptionBlocked(
  restaurant: Pick<Restaurant, "subscriptionStatus" | "trialEndsAt" | "nextBillingAt">
) {
  const normalized = getNormalizedSubscriptionStatus(restaurant);
  return normalized === "expired" || normalized === "canceled";
}

export function isRestaurantBlocked(
  restaurant: Pick<Restaurant, "active">
) {
  return restaurant.active === false;
}

async function ensureStoreFile() {
  try {
    await fs.access(runtimeStorePath);
  } catch {
    await fs.mkdir(path.dirname(runtimeStorePath), { recursive: true });
    try {
      const seed = await fs.readFile(defaultSeedPath, "utf8");
      await fs.writeFile(runtimeStorePath, seed, "utf8");
    } catch {
      await fs.writeFile(runtimeStorePath, JSON.stringify(defaultStore, null, 2), "utf8");
    }
  }
}

async function readSeedFromFileOrDefault(): Promise<Partial<AppStore>> {
  try {
    await ensureStoreFile();
    const raw = await fs.readFile(runtimeStorePath, "utf8");
    return JSON.parse(raw) as Partial<AppStore>;
  } catch {
    try {
      const rawSeed = await fs.readFile(defaultSeedPath, "utf8");
      return JSON.parse(rawSeed) as Partial<AppStore>;
    } catch {
      return defaultStore;
    }
  }
}

async function ensureDbSchemaReady(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  if (!dbSchemaReady) {
    dbSchemaReady = (async () => {
      try {
        const db = prisma as any;
        await db.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "SystemState" (
            "key" TEXT PRIMARY KEY,
            "payload" JSONB NOT NULL,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        return true;
      } catch {
        return false;
      }
    })();
  }
  return dbSchemaReady;
}

export function normalizeStore(parsed: Partial<AppStore>): AppStore {
  const now = new Date().toISOString();
  const restaurants = (parsed.restaurants ?? defaultStore.restaurants).map((item) => ({
    ...item,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    createdAt: item.createdAt ?? now,
    openForOrders: item.openForOrders ?? item.active ?? true,
    canceledAt: item.canceledAt ?? null,
    subscribedPlanId:
      item.subscribedPlanId ??
      (item.plan === "Local + Online" ? "plan_local_online" : "plan_local"),
    subscriptionStatus: getNormalizedSubscriptionStatus(item),
    trialStartedAt: item.trialStartedAt ?? null,
    trialEndsAt: item.trialEndsAt ?? null,
    nextBillingAt: item.nextBillingAt ?? null,
    subscriptionStartedAt: item.subscriptionStartedAt ?? null,
    subscriptionEndsAt: item.subscriptionEndsAt ?? null,
    pendingPlanId: item.pendingPlanId ?? null,
    pendingCheckoutExternalId: item.pendingCheckoutExternalId ?? null,
    lastCheckoutUrl: item.lastCheckoutUrl ?? null,
    viewCount: item.viewCount ?? 0,
    lastViewAt: item.lastViewAt ?? null,
    passwordResetToken: item.passwordResetToken ?? null,
    passwordResetExpiresAt: item.passwordResetExpiresAt ?? null,
    banners: (item.banners ?? []).map((banner) => ({
      ...banner,
      abGroup: banner.abGroup ?? "",
      clicks: banner.clicks ?? 0,
      impressions: banner.impressions ?? 0,
      attributedOrders: banner.attributedOrders ?? 0,
      lastClickedAt: banner.lastClickedAt ?? null
    })),
    marketingCampaigns: (item.marketingCampaigns ?? []).map((campaign) => ({
      ...campaign,
      couponCodes: campaign.couponCodes ?? (campaign.couponCode ? [campaign.couponCode] : []),
      bannerIds: campaign.bannerIds ?? [],
      startDate: campaign.startDate ?? "",
      endDate: campaign.endDate ?? "",
      autoActivateByCalendar: campaign.autoActivateByCalendar ?? false,
      utmSource: campaign.utmSource ?? "",
      utmMedium: campaign.utmMedium ?? "",
      utmCampaign: campaign.utmCampaign ?? "",
      utmContent: campaign.utmContent ?? "",
      targetCouponCode: campaign.targetCouponCode ?? ""
      ,
      clicks: campaign.clicks ?? 0,
      attributedOrders: campaign.attributedOrders ?? 0,
      lastClickedAt: campaign.lastClickedAt ?? null
    })),
    coupons: item.coupons ?? [],
    deliveryConfig: {
      radiusKm: item.deliveryConfig?.radiusKm ?? 10,
      feeMode: item.deliveryConfig?.feeMode ?? "flat",
      distanceBands: (item.deliveryConfig?.distanceBands ?? []).map((band, index) => ({
        id: band.id ?? `band_${index + 1}`,
        upToKm: Number.isFinite(band.upToKm) ? band.upToKm : 0,
        fee: Number.isFinite(band.fee) ? band.fee : 0
      })),
      neighborhoodRates: (item.deliveryConfig?.neighborhoodRates ?? []).map((zone, index) => ({
        id: zone.id ?? `zone_${index + 1}`,
        name: zone.name ?? "",
        fee: Number.isFinite(zone.fee) ? zone.fee : 0,
        active: zone.active ?? true
      })),
      pickupEnabled: item.deliveryConfig?.pickupEnabled ?? false,
      pickupInstructions: item.deliveryConfig?.pickupInstructions ?? "",
      dispatchMode: item.deliveryConfig?.dispatchMode ?? "manual",
      autoDispatchEnabled: item.deliveryConfig?.autoDispatchEnabled ?? false
    },
    bioLink: {
      appearance: item.bioLink?.appearance ?? "dark",
      headline: item.bioLink?.headline ?? "Nossos links oficiais",
      whatsappEnabled: item.bioLink?.whatsappEnabled ?? true,
      whatsappValue: item.bioLink?.whatsappValue ?? item.whatsapp ?? "",
      instagramEnabled: item.bioLink?.instagramEnabled ?? false,
      instagramValue: item.bioLink?.instagramValue ?? "",
      customEnabled: item.bioLink?.customEnabled ?? false,
      customLabel: item.bioLink?.customLabel ?? "Meu Site",
      customUrl: item.bioLink?.customUrl ?? ""
    },
    panelUsers: (item.panelUsers ?? []).map((user) => ({
      ...user,
      status: user.status ?? "Ativo",
      permissions: user.permissions ?? [],
      createdAt: user.createdAt ?? now,
      lastAccessAt: user.lastAccessAt ?? null
    }))
  }));
  const adminUsers = (parsed.adminUsers ?? defaultStore.adminUsers).map((user) => ({
    ...user,
    createdAt: user.createdAt ?? now,
    lastAccessAt: user.lastAccessAt ?? null,
    permissions: user.permissions ?? [],
    twoFactorEnabled: user.twoFactorEnabled ?? false,
    twoFactorSecret: user.twoFactorSecret ?? null,
    twoFactorPendingSecret: user.twoFactorPendingSecret ?? null
  }));
  const adminRoles = (parsed.adminRoles ?? defaultStore.adminRoles).map((role) => ({
    ...role,
    createdAt: role.createdAt ?? now,
    permissions: role.permissions ?? []
  }));
  const orders = (parsed.orders ?? []).map((order) => ({
    ...order,
    status: order.status ?? "Recebido",
    discountValue: order.discountValue ?? 0,
    couponCode: order.couponCode ?? undefined,
    source: order.source ?? "catalog",
    fulfillmentType: order.fulfillmentType ?? "delivery",
    customerLatitude: order.customerLatitude ?? null,
    customerLongitude: order.customerLongitude ?? null,
    deliveryDistanceKm: order.deliveryDistanceKm ?? null,
    deliveryZoneName: order.deliveryZoneName ?? null,
    deliveryFeeSource: order.deliveryFeeSource ?? (order.deliveryFee ? "fallback" : "flat"),
    dispatchStatus: order.dispatchStatus ?? "pending",
    dispatchMode: order.dispatchMode ?? "manual",
    trafficSource: order.trafficSource ?? "",
    utmSource: order.utmSource ?? "",
    utmMedium: order.utmMedium ?? "",
    utmCampaign: order.utmCampaign ?? "",
    utmContent: order.utmContent ?? "",
    utmTerm: order.utmTerm ?? "",
    attributionBannerId: order.attributionBannerId ?? "",
    attributionCampaignId: order.attributionCampaignId ?? ""
  }));

  const customers = (parsed.customers ?? []).map((customer) => ({
    ...customer,
    usedCouponCodes: customer.usedCouponCodes ?? []
  }));

  return {
    leads: parsed.leads ?? [],
    restaurants,
    orders,
    customers,
    auditLogs: parsed.auditLogs ?? [],
    activeSessions: (parsed.activeSessions ?? []).map((session) => ({
      ...session,
      userAgent: session.userAgent ?? null,
      revokedAt: session.revokedAt ?? null
    })),
    invoices: parsed.invoices ?? defaultStore.invoices,
    twilioMessages: (parsed.twilioMessages ?? []).map((item) => ({
      ...item,
      templateId: item.templateId ?? null,
      messageSid: item.messageSid ?? null,
      errorMessage: item.errorMessage ?? null
    })),
    adminUsers,
    adminRoles,
    supportTickets: parsed.supportTickets ?? defaultStore.supportTickets,
    supportMessages: parsed.supportMessages ?? defaultStore.supportMessages,
    supportQuickReplies: parsed.supportQuickReplies ?? defaultStore.supportQuickReplies,
    plans: (parsed.plans ?? defaultStore.plans).map((plan) => ({
      ...plan,
      allowedTabs:
        plan.allowedTabs?.length
          ? [...plan.allowedTabs]
          : [...DEFAULT_MASTER_PLAN_TABS],
      manualOrderLimitEnabled: plan.manualOrderLimitEnabled ?? false,
      manualOrderLimitPerMonth:
        plan.manualOrderLimitEnabled === false
          ? null
          : plan.manualOrderLimitPerMonth ?? null,
      updatedAt: plan.updatedAt ?? now,
      createdAt: plan.createdAt ?? now
    })),
    paymentsConfig: {
      ...defaultStore.paymentsConfig,
      ...(parsed.paymentsConfig ?? {}),
      methods: {
        ...defaultStore.paymentsConfig.methods,
        ...(parsed.paymentsConfig?.methods ?? {})
      }
    },
    payouts: parsed.payouts ?? defaultStore.payouts,
    adminSettings: {
      ...defaultStore.adminSettings,
      ...(parsed.adminSettings ?? {}),
      notificationTemplates:
        parsed.adminSettings?.notificationTemplates ?? defaultStore.adminSettings.notificationTemplates,
      integrations: {
        ...defaultStore.adminSettings.integrations,
        ...(parsed.adminSettings?.integrations ?? {})
      },
      securityPolicies: {
        ...defaultStore.adminSettings.securityPolicies,
        ...(parsed.adminSettings?.securityPolicies ?? {})
      }
    }
  };
}

async function readStoreFromDb(): Promise<AppStore | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const schemaReady = await ensureDbSchemaReady();
    if (!schemaReady) return null;
    const db = prisma as any;
    const state = await db.systemState.findUnique({ where: { key: DB_STATE_KEY } });
    if (!state) {
      const initialPayload = await readSeedFromFileOrDefault();
      const normalized = normalizeStore(initialPayload);
      await db.systemState.create({
        data: { key: DB_STATE_KEY, payload: toDbJsonPayload(normalized) }
      });
      return normalized;
    }
    return normalizeStore(state.payload as Partial<AppStore>);
  } catch (error) {
    console.error("[store] Failed reading state from DB:", error);
    return null;
  }
}

async function writeStoreToDb(store: AppStore): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const schemaReady = await ensureDbSchemaReady();
    if (!schemaReady) return false;
    const db = prisma as any;
    await db.systemState.upsert({
      where: { key: DB_STATE_KEY },
      update: { payload: toDbJsonPayload(store) },
      create: { key: DB_STATE_KEY, payload: toDbJsonPayload(store) }
    });
    return true;
  } catch (error) {
    console.error("[store] Failed writing state to DB:", error);
    return false;
  }
}

export async function readStore(): Promise<AppStore> {
  const dbStore = await readStoreFromDb();
  if (dbStore) return dbStore;
  if (shouldStrictRequireDatabase && process.env.DATABASE_URL) {
    throw new Error("Falha ao carregar estado no banco de dados.");
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[store] Using file fallback in production:", runtimeStorePath);
  }
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(runtimeStorePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppStore>;
    return normalizeStore(parsed);
  } catch {
    return normalizeStore(defaultStore);
  }
}

export async function writeStore(store: AppStore): Promise<void> {
  const wroteDb = await writeStoreToDb(store);
  if (wroteDb) return;
  if (shouldStrictRequireDatabase && process.env.DATABASE_URL) {
    throw new Error("Falha ao persistir estado no banco de dados.");
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[store] Writing file fallback in production:", runtimeStorePath);
  }
  await ensureStoreFile();
  await fs.writeFile(runtimeStorePath, JSON.stringify(store, null, 2), "utf8");
}

export function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function withinCampaignCalendar(campaign: {
  startDate?: string;
  endDate?: string;
  autoActivateByCalendar?: boolean;
}) {
  if (!campaign.autoActivateByCalendar) return null;
  const today = todayIsoDate();
  const hasStart = !!campaign.startDate;
  const hasEnd = !!campaign.endDate;
  if (!hasStart && !hasEnd) return null;
  if (campaign.startDate && today < campaign.startDate) return false;
  if (campaign.endDate && today > campaign.endDate) return false;
  return true;
}

export function applyRestaurantCampaignCalendar(restaurant: Restaurant): {
  changed: boolean;
  restaurant: Restaurant;
} {
  const campaigns = restaurant.marketingCampaigns ?? [];
  if (!campaigns.length) return { changed: false, restaurant };

  let changed = false;
  const toggledCouponCodes = new Set<string>();
  const toggledBannerIds = new Set<string>();
  const nextCampaigns = campaigns.map((campaign) => {
    const shouldBeActive = withinCampaignCalendar(campaign);
    if (shouldBeActive === null || campaign.active === shouldBeActive) return campaign;
    changed = true;
    (campaign.couponCodes?.length
      ? campaign.couponCodes
      : campaign.couponCode
      ? [campaign.couponCode]
      : []
    )
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean)
      .forEach((code) => toggledCouponCodes.add(code));
    (campaign.bannerIds ?? []).forEach((id) => toggledBannerIds.add(id));
    return { ...campaign, active: shouldBeActive };
  });

  if (!changed) return { changed: false, restaurant };
  const activeCampaignByCoupon = new Set<string>();
  const activeCampaignByBanner = new Set<string>();
  nextCampaigns.forEach((campaign) => {
    if (!campaign.active) return;
    (campaign.couponCodes?.length
      ? campaign.couponCodes
      : campaign.couponCode
      ? [campaign.couponCode]
      : []
    )
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean)
      .forEach((code) => activeCampaignByCoupon.add(code));
    (campaign.bannerIds ?? []).forEach((id) => activeCampaignByBanner.add(id));
  });

  return {
    changed: true,
    restaurant: {
      ...restaurant,
      marketingCampaigns: nextCampaigns,
      coupons: (restaurant.coupons ?? []).map((coupon) => {
        const normalized = coupon.code.trim().toUpperCase();
        if (!toggledCouponCodes.has(normalized)) return coupon;
        return { ...coupon, active: activeCampaignByCoupon.has(normalized) };
      }),
      banners: (restaurant.banners ?? []).map((banner) => {
        if (!toggledBannerIds.has(banner.id)) return banner;
        return { ...banner, active: activeCampaignByBanner.has(banner.id) };
      })
    }
  };
}
