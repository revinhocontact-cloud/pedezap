import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function isSameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export async function GET() {
  const store = await readStore();
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = endOfDay(now);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = currentMonthStart;
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - 6);
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);

  const restaurants = store.restaurants ?? [];
  const orders = store.orders ?? [];
  const tickets = store.supportTickets ?? [];
  const invoices = store.invoices ?? [];

  const activeRestaurants = restaurants.filter((restaurant) => restaurant.active);
  const activeRestaurantsPreviousMonth = restaurants.filter((restaurant) => {
    const createdAt = new Date(restaurant.createdAt);
    const canceledAt = restaurant.canceledAt ? new Date(restaurant.canceledAt) : null;
    return createdAt < currentMonthStart && (!canceledAt || canceledAt >= currentMonthStart);
  });
  const currentMonthRevenue = orders
    .filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= currentMonthStart && createdAt < tomorrow;
    })
    .reduce((sum, order) => sum + (order.total ?? 0), 0);
  const previousMonthRevenue = orders
    .filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= previousMonthStart && createdAt < previousMonthEnd;
    })
    .reduce((sum, order) => sum + (order.total ?? 0), 0);
  const orders24h = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return now.getTime() - createdAt.getTime() <= 24 * 60 * 60 * 1000;
  });
  const previous24hStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const previous24hEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const previous24hOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return createdAt >= previous24hStart && createdAt < previous24hEnd;
  });
  const pendingTickets = tickets.filter((ticket) => ticket.status !== "Fechado");
  const currentMonthTickets = pendingTickets.filter((ticket) => new Date(ticket.createdAt) >= currentMonthStart);
  const previousMonthTickets = tickets.filter((ticket) => {
    const createdAt = new Date(ticket.createdAt);
    return ticket.status !== "Fechado" && createdAt >= previousMonthStart && createdAt < previousMonthEnd;
  });

  const growthSeries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + index);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dayOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= dayStart && createdAt < dayEnd;
    });
    const dayRestaurants = restaurants.filter((restaurant) => {
      const createdAt = new Date(restaurant.createdAt);
      return createdAt >= dayStart && createdAt < dayEnd;
    });
    return {
      day: formatDayLabel(dayStart),
      orders: dayOrders.length,
      restaurants: dayRestaurants.length
    };
  });

  const previousWeekOrders = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return createdAt >= previousWeekStart && createdAt < currentWeekStart;
  }).length;
  const currentWeekOrders = growthSeries.reduce((sum, item) => sum + item.orders, 0);

  const invalidWhatsappRestaurants = restaurants.filter((restaurant) => {
    const digits = (restaurant.whatsapp ?? "").replace(/\D/g, "");
    return digits.length > 0 && digits.length < 10;
  });
  const dueTodayInvoices = invoices.filter((invoice) => {
    if (invoice.status === "Pago" || invoice.status === "Estornado") return false;
    return isSameDay(new Date(invoice.dueDate), today);
  });
  const overdueInvoices = invoices.filter((invoice) => {
    if (invoice.status === "Pago" || invoice.status === "Estornado") return false;
    return new Date(invoice.dueDate) < today;
  });
  const backupLogs = store.auditLogs.filter((log) => log.action.includes("backup"));

  const alerts = [
    invalidWhatsappRestaurants.length
      ? {
          id: "invalid-whatsapp",
          tone: "red",
          text: `${invalidWhatsappRestaurants.length} restaurantes com WhatsApp invalido`,
          href: "restaurants"
        }
      : null,
    pendingTickets.length
      ? {
          id: "pending-tickets",
          tone: "amber",
          text: `${pendingTickets.length} tickets pendentes`,
          href: "support"
        }
      : null,
    dueTodayInvoices.length
      ? {
          id: "due-today",
          tone: "amber",
          text: `${dueTodayInvoices.length} assinaturas vencem hoje`,
          href: "financial"
        }
      : null,
    overdueInvoices.length
      ? {
          id: "overdue",
          tone: "red",
          text: `${overdueInvoices.length} faturas vencidas precisam de atencao`,
          href: "financial"
        }
      : null,
    backupLogs.length
      ? {
          id: "backup-log",
          tone: "blue",
          text: "Backup do sistema registrado nos logs",
          href: "settings"
        }
      : {
          id: "backup-missing",
          tone: "blue",
          text: "Backup automatico ainda nao configurado",
          href: "settings"
        }
  ].filter(Boolean);

  const topRestaurants = restaurants
    .map((restaurant) => {
      const restaurantOrders = orders.filter((order) => order.restaurantSlug === restaurant.slug);
      const monthOrders = restaurantOrders.filter((order) => new Date(order.createdAt) >= currentMonthStart);
      const revenue = monthOrders.reduce((sum, order) => sum + (order.total ?? 0), 0);
      return {
        id: restaurant.id,
        name: restaurant.name,
        plan: restaurant.plan,
        status: restaurant.active ? "Ativo" : "Inativo",
        ordersMonth: monthOrders.length,
        revenue
      };
    })
    .sort((left, right) => right.ordersMonth - left.ordersMonth || right.revenue - left.revenue)
    .slice(0, 5);

  return NextResponse.json({
    success: true,
    dashboard: {
      updatedAt: now.toISOString(),
      kpis: {
        activeRestaurants: {
          value: activeRestaurants.length,
          change: percentageChange(activeRestaurants.length, activeRestaurantsPreviousMonth.length)
        },
        monthlyRevenue: {
          value: currentMonthRevenue,
          change: percentageChange(currentMonthRevenue, previousMonthRevenue)
        },
        orders24h: {
          value: orders24h.length,
          change: percentageChange(orders24h.length, previous24hOrders.length)
        },
        pendingTickets: {
          value: pendingTickets.length,
          newThisMonth: currentMonthTickets.length,
          change: percentageChange(currentMonthTickets.length, previousMonthTickets.length)
        }
      },
      growth: {
        periodLabel: "Ultimos 7 dias",
        orderChange: percentageChange(currentWeekOrders, previousWeekOrders),
        series: growthSeries
      },
      alerts,
      topRestaurants
    }
  });
}
