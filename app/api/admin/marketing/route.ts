import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";
import type { Order, RestaurantMarketingCampaign } from "@/lib/store-data";

export const dynamic = "force-dynamic";

type OptimizationItem = {
  tag: string;
  impact: "ALTO" | "MEDIO" | "BAIXO";
  title: string;
  description: string;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function isPaidOrder(order: Order) {
  const sourceText = [
    order.trafficSource,
    order.utmSource,
    order.utmMedium,
    order.utmCampaign,
    order.utmContent,
    order.attributionBannerId,
    order.attributionCampaignId
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    !!order.attributionBannerId ||
    !!order.attributionCampaignId ||
    /\b(ads|paid|cpc|ppc|google|meta|facebook|instagram|display|search|trafego pago)\b/.test(sourceText)
  );
}

function resolvePlatform(campaign: RestaurantMarketingCampaign) {
  const sourceText = [campaign.utmSource, campaign.utmMedium, campaign.utmCampaign, campaign.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/meta|facebook|instagram/.test(sourceText)) return "Meta Ads";
  if (/google|search|display|youtube/.test(sourceText)) return "Google Ads";
  if (/whatsapp|crm|cupom|coupon/.test(sourceText)) return "CRM / WhatsApp";
  return campaign.utmSource || campaign.utmMedium || "Origem nao informada";
}

function campaignStatus(campaign: RestaurantMarketingCampaign) {
  const now = new Date();
  if (!campaign.active) return "Pausada";
  if (campaign.endDate && new Date(campaign.endDate) < now) return "Expirada";
  if (campaign.startDate && new Date(campaign.startDate) > now) return "Agendada";
  return "Ativa";
}

function normalizePercent(value: number) {
  return Number(value.toFixed(1));
}

export async function GET(request: Request) {
  const store = await readStore();
  const url = new URL(request.url);
  const periodDays = Number(url.searchParams.get("days") || "14");
  const days = Number.isFinite(periodDays) && periodDays > 0 ? Math.min(periodDays, 90) : 14;
  const now = new Date();
  const today = startOfDay(now);
  const periodStart = new Date(today);
  periodStart.setDate(today.getDate() - (days - 1));

  const restaurants = store.restaurants ?? [];
  const leads = store.leads ?? [];
  const orders = store.orders ?? [];
  const totalLandingVisitors = restaurants.reduce((sum, restaurant) => sum + (restaurant.viewCount ?? 0), 0);
  const campaigns = restaurants.flatMap((restaurant) =>
    (restaurant.marketingCampaigns ?? []).map((campaign) => ({
      ...campaign,
      restaurantName: restaurant.name,
      restaurantSlug: restaurant.slug
    }))
  );
  const banners = restaurants.flatMap((restaurant) =>
    (restaurant.banners ?? []).map((banner) => ({
      ...banner,
      restaurantName: restaurant.name,
      restaurantSlug: restaurant.slug
    }))
  );

  const trafficSeries = Array.from({ length: days }, (_, index) => {
    const date = new Date(periodStart);
    date.setDate(periodStart.getDate() + index);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= dayStart && createdAt < dayEnd;
    });
    const paid = dayOrders.filter(isPaidOrder).length;
    return {
      day: formatDayLabel(dayStart),
      organico: dayOrders.length - paid,
      pago: paid,
      pedidos: dayOrders.length
    };
  });

  const activeCampaigns = campaigns.filter((campaign) => campaignStatus(campaign) === "Ativa");
  const totalCampaignClicks = campaigns.reduce((sum, campaign) => sum + (campaign.clicks ?? 0), 0);
  const totalBannerClicks = banners.reduce((sum, banner) => sum + (banner.clicks ?? 0), 0);
  const totalBannerImpressions = banners.reduce((sum, banner) => sum + (banner.impressions ?? 0), 0);
  const attributedOrders =
    campaigns.reduce((sum, campaign) => sum + (campaign.attributedOrders ?? 0), 0) +
    banners.reduce((sum, banner) => sum + (banner.attributedOrders ?? 0), 0);
  const paidOrders = orders.filter(isPaidOrder).length;

  const adInvestment = 0;
  const cpl = adInvestment > 0 && leads.length > 0 ? adInvestment / leads.length : null;
  const clickRate = totalBannerImpressions > 0 ? (totalBannerClicks / totalBannerImpressions) * 100 : null;

  const optimizationItems: OptimizationItem[] = [];
  if (!campaigns.length) {
    optimizationItems.push({
      tag: "CAMPANHAS",
      impact: "ALTO",
      title: "Nenhuma campanha cadastrada",
      description: "Crie campanhas no painel master dos restaurantes para acompanhar cliques e pedidos atribuidos aqui."
    });
  }
  if (campaigns.length > 0 && activeCampaigns.length === 0) {
    optimizationItems.push({
      tag: "CAMPANHAS",
      impact: "ALTO",
      title: "Campanhas sem ativacao",
      description: "Existem campanhas cadastradas, mas nenhuma esta ativa no periodo atual."
    });
  }
  if (totalBannerImpressions > 0 && clickRate !== null && clickRate < 1) {
    optimizationItems.push({
      tag: "BANNERS",
      impact: "MEDIO",
      title: "CTR dos banners abaixo de 1%",
      description: "Revise imagem, oferta e chamada dos banners com maior impressao e baixo clique."
    });
  }
  if (paidOrders > 0 && attributedOrders === 0) {
    optimizationItems.push({
      tag: "ATRIBUICAO",
      impact: "MEDIO",
      title: "Pedidos pagos sem atribuicao direta",
      description: "Ha pedidos com origem paga, mas sem campanha ou banner atribuido. Padronize UTMs e links rastreados."
    });
  }
  if (!campaigns.some((campaign) => campaign.utmSource || campaign.utmMedium || campaign.utmCampaign)) {
    optimizationItems.push({
      tag: "UTM",
      impact: "MEDIO",
      title: "UTMs ainda nao preenchidas",
      description: "Preencha utm_source, utm_medium e utm_campaign nas campanhas para separar canais reais."
    });
  }

  const restaurantsWithBrand = restaurants.filter((restaurant) => restaurant.logoUrl && restaurant.coverUrl).length;
  const campaignsWithUtm = campaigns.filter((campaign) => campaign.utmSource || campaign.utmMedium || campaign.utmCampaign).length;
  const bannersWithMetrics = banners.filter((banner) => (banner.impressions ?? 0) > 0 || (banner.clicks ?? 0) > 0).length;
  const seoChecks = [
    {
      label: "Restaurantes com logo e capa",
      value: `${restaurantsWithBrand}/${restaurants.length}`,
      status: restaurants.length > 0 && restaurantsWithBrand === restaurants.length ? "ok" : "warn"
    },
    {
      label: "Campanhas com UTM",
      value: `${campaignsWithUtm}/${campaigns.length}`,
      status: campaigns.length > 0 && campaignsWithUtm === campaigns.length ? "ok" : "warn"
    },
    {
      label: "Banners com metricas",
      value: `${bannersWithMetrics}/${banners.length}`,
      status: banners.length > 0 && bannersWithMetrics > 0 ? "ok" : "warn"
    }
  ];
  const seoScore = Math.round(
    ((restaurants.length ? restaurantsWithBrand / restaurants.length : 0) * 45 +
      (campaigns.length ? campaignsWithUtm / campaigns.length : 0) * 35 +
      (banners.length ? bannersWithMetrics / banners.length : 0) * 20)
  );

  const campaignRows = campaigns
    .map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      restaurantName: campaign.restaurantName,
      platform: resolvePlatform(campaign),
      clicks: campaign.clicks ?? 0,
      attributedOrders: campaign.attributedOrders ?? 0,
      couponCodes: campaign.couponCodes?.length ? campaign.couponCodes : campaign.couponCode ? [campaign.couponCode] : [],
      status: campaignStatus(campaign),
      period: campaign.period || [campaign.startDate, campaign.endDate].filter(Boolean).join(" ate ") || "Sem periodo",
      investment: null as number | null,
      cpl: null as number | null
    }))
    .sort((left, right) => right.clicks + right.attributedOrders * 10 - (left.clicks + left.attributedOrders * 10));

  return NextResponse.json({
    success: true,
    marketing: {
      periodDays: days,
      summary: {
        landingVisitors: totalLandingVisitors,
        leadsCaptured: leads.length,
        activeCampaigns: activeCampaigns.length,
        totalCampaigns: campaigns.length,
        totalClicks: totalCampaignClicks + totalBannerClicks,
        attributedOrders,
        adInvestment,
        cpl,
        clickRate: clickRate === null ? null : normalizePercent(clickRate)
      },
      trafficSeries,
      optimizations: optimizationItems.slice(0, 4),
      seo: {
        score: seoScore,
        checks: seoChecks
      },
      keywords: [],
      keywordsConnected: false,
      campaigns: campaignRows
    }
  });
}
