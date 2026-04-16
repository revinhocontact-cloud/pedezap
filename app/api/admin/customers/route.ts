import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function customerStatus(customer: { totalOrders: number; totalSpent: number }) {
  if (customer.totalOrders >= 25 || customer.totalSpent >= 1000) return "VIP";
  return "Ativo";
}

export async function GET(request: Request) {
  const store = await readStore();
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const statusFilter = (url.searchParams.get("status") ?? "all").trim();

  const restaurantsBySlug = new Map(store.restaurants.map((item) => [item.slug, item]));
  const enrichedCustomers = store.customers
    .map((customer) => {
      const restaurant = restaurantsBySlug.get(customer.restaurantSlug);
      const status = customerStatus(customer);
      return {
        id: customer.id,
        name: customer.name,
        email: null,
        whatsapp: customer.whatsapp,
        restaurantSlug: customer.restaurantSlug,
        restaurantName: restaurant?.name ?? customer.restaurantSlug,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        lastOrderAt: customer.lastOrderAt ?? null,
        createdAt: customer.createdAt,
        status
      };
    })
    .filter((customer) => {
      const matchesQuery =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.whatsapp.toLowerCase().includes(query) ||
        customer.id.toLowerCase().includes(query) ||
        customer.restaurantName.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      return matchesQuery && matchesStatus;
    })
    .sort((left, right) => {
      const rightDate = new Date(right.lastOrderAt ?? right.createdAt).getTime();
      const leftDate = new Date(left.lastOrderAt ?? left.createdAt).getTime();
      return rightDate - leftDate;
    });

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const active30d = store.customers.filter((customer) => {
    const lastOrderAt = customer.lastOrderAt ? new Date(customer.lastOrderAt) : null;
    return !!lastOrderAt && lastOrderAt >= thirtyDaysAgo;
  }).length;
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = store.customers.filter((customer) => new Date(customer.createdAt) >= currentMonthStart).length;
  const vip = store.customers.filter((customer) => customerStatus(customer) === "VIP").length;
  const avgLtv =
    store.customers.length > 0
      ? store.customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / store.customers.length
      : 0;

  return NextResponse.json({
    success: true,
    summary: {
      total: store.customers.length,
      active30d,
      activePercent: store.customers.length ? Math.round((active30d / store.customers.length) * 100) : 0,
      newThisMonth,
      avgLtv,
      vip,
      blocked: 0
    },
    customers: enrichedCustomers
  });
}
