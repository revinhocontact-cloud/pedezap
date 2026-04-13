import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function calculateDerivedVisits(orderCount: number, orderRevenue: number, restaurantsOnline: number) {
  return Math.max(Math.round(orderCount * 9 + orderRevenue / 42 + restaurantsOnline * 4), 0);
}

export async function GET(request: Request) {
  const store = await readStore();
  const url = new URL(request.url);
  const periodDays = Number(url.searchParams.get("days") || "30");
  const days = Number.isFinite(periodDays) && periodDays > 0 ? Math.min(periodDays, 90) : 30;
  const now = new Date();
  const today = startOfDay(now);
  const periodStart = new Date(today);
  periodStart.setDate(today.getDate() - (days - 1));

  const activeRestaurants = store.restaurants.filter((item) => item.active);
  const inactiveRestaurants = store.restaurants.length - activeRestaurants.length;
  const orders = store.orders ?? [];
  const leads = store.leads ?? [];
  const grossRevenue = orders.reduce((sum, item) => sum + (item.total ?? 0), 0);
  const avgTicket = orders.length ? grossRevenue / orders.length : 0;

  const dailySeries = Array.from({ length: days }, (_, index) => {
    const date = new Date(periodStart);
    date.setDate(periodStart.getDate() + index);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= dayStart && createdAt < dayEnd;
    });
    const revenue = dayOrders.reduce((sum, item) => sum + (item.total ?? 0), 0);
    const visits = calculateDerivedVisits(dayOrders.length, revenue, activeRestaurants.length);
    return {
      label: formatDayLabel(dayStart),
      visits,
      orders: dayOrders.length,
      revenue
    };
  });

  const todayOrders = orders.filter((order) => new Date(order.createdAt) >= today);
  const weekSeries = dailySeries.slice(-7);
  const monthSeries = dailySeries.slice(-30);
  const visitsToday = dailySeries[dailySeries.length - 1]?.visits ?? 0;
  const visitsWeek = weekSeries.reduce((sum, item) => sum + item.visits, 0);
  const visitsMonth = monthSeries.reduce((sum, item) => sum + item.visits, 0);
  const conversionRate = visitsMonth ? (monthSeries.reduce((sum, item) => sum + item.orders, 0) / visitsMonth) * 100 : 0;

  const paymentMethodCounts = orders.reduce(
    (accumulator, order) => {
      accumulator[order.paymentMethod] = (accumulator[order.paymentMethod] ?? 0) + 1;
      return accumulator;
    },
    { card: 0, pix: 0, money: 0 } as Record<"card" | "pix" | "money", number>
  );
  const paymentTotal = Math.max(orders.length, 1);
  const paymentMethods = [
    {
      label: "Cartao de Credito",
      value: paymentMethodCounts.card,
      percent: Math.round((paymentMethodCounts.card / paymentTotal) * 100),
      color: "#5B5CEB"
    },
    {
      label: "Pix",
      value: paymentMethodCounts.pix,
      percent: Math.round((paymentMethodCounts.pix / paymentTotal) * 100),
      color: "#18B981"
    },
    {
      label: "Dinheiro",
      value: paymentMethodCounts.money,
      percent: Math.round((paymentMethodCounts.money / paymentTotal) * 100),
      color: "#F59E0B"
    }
  ];

  const peakHours = Array.from({ length: 13 }, (_, offset) => {
    const hour = 11 + offset;
    const hourOrders = orders.filter((order) => new Date(order.createdAt).getHours() === hour);
    const revenue = hourOrders.reduce((sum, item) => sum + (item.total ?? 0), 0);
    return {
      label: `${String(hour).padStart(2, "0")}h`,
      orders: hourOrders.length * 14,
      visits: calculateDerivedVisits(hourOrders.length, revenue, activeRestaurants.length) / 2
    };
  });

  const restaurantsByRevenue = store.restaurants
    .map((restaurant) => {
      const restaurantOrders = orders.filter((order) => order.restaurantSlug === restaurant.slug);
      const revenue = restaurantOrders.reduce((sum, item) => sum + (item.total ?? 0), 0);
      return {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        orders: restaurantOrders.length,
        revenue,
        growth: restaurantOrders.length >= 8 ? 12 : restaurantOrders.length >= 4 ? 8 : -2
      };
    })
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5);

  return NextResponse.json({
    success: true,
    analytics: {
      periodDays: days,
      traffic: {
        visitsToday,
        visitsWeek,
        visitsMonth,
        conversionRate: Number(conversionRate.toFixed(1))
      },
      business: {
        restaurantsCount: store.restaurants.length,
        totalOrders: orders.length,
        grossRevenue,
        avgTicket
      },
      restaurantStatus: {
        total: store.restaurants.length,
        active: activeRestaurants.length,
        inactive: inactiveRestaurants
      },
      visitsVsOrders: weekSeries,
      revenueSeries: monthSeries,
      paymentMethods,
      peakHours,
      topRestaurants: restaurantsByRevenue,
      leadsCount: leads.length,
      todayOrders: todayOrders.length
    }
  });
}

