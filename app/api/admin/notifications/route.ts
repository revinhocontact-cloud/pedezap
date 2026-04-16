import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

type NotificationTone = "success" | "warning" | "info" | "danger";

function timeAgo(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(Math.floor(diffMs / 60000), 0);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `ha ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `ha ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `ha ${days} dia${days > 1 ? "s" : ""}`;
}

function notification(
  id: string,
  title: string,
  description: string,
  createdAt: string,
  tone: NotificationTone,
  page: string
) {
  return {
    id,
    title,
    description,
    createdAt,
    timeAgo: timeAgo(createdAt),
    tone,
    page
  };
}

export async function GET() {
  const store = await readStore();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const restaurantNotifications = (store.restaurants ?? [])
    .filter((restaurant) => new Date(restaurant.createdAt) >= sevenDaysAgo)
    .map((restaurant) =>
      notification(
        `restaurant:${restaurant.id}`,
        "Novo restaurante cadastrado",
        `${restaurant.name} entrou na plataforma.`,
        restaurant.createdAt,
        "success",
        "restaurants"
      )
    );

  const ticketNotifications = (store.supportTickets ?? [])
    .filter((ticket) => ticket.status !== "Fechado")
    .map((ticket) =>
      notification(
        `ticket:${ticket.id}`,
        "Novo ticket de suporte",
        `${ticket.requesterName} abriu ou manteve um chamado: ${ticket.subject}.`,
        ticket.lastMessageAt || ticket.createdAt,
        "info",
        "support"
      )
    );

  const invoiceNotifications = (store.invoices ?? [])
    .filter((invoice) => invoice.status !== "Pago" && invoice.status !== "Estornado")
    .map((invoice) => {
      const dueDate = new Date(invoice.dueDate);
      const isOverdue = dueDate < today;
      return notification(
        `invoice:${invoice.id}`,
        isOverdue ? "Fatura vencida" : "Alerta de faturamento",
        `Fatura ${invoice.id} de ${invoice.restaurantName} ${isOverdue ? "esta vencida" : "esta em aberto"}.`,
        invoice.createdAt || invoice.dueDate,
        isOverdue ? "danger" : "warning",
        "financial"
      );
    });

  const backupNotifications = (store.auditLogs ?? [])
    .filter((log) => log.action.includes("backup"))
    .slice(0, 3)
    .map((log) =>
      notification(
        `audit:${log.id}`,
        log.action.includes("import") ? "Backup importado" : "Backup realizado",
        `${log.actorName || "Sistema"} registrou ${log.action.includes("import") ? "uma importacao" : "uma exportacao"} de backup.`,
        log.createdAt,
        "success",
        "settings"
      )
    );

  const notifications = [
    ...restaurantNotifications,
    ...ticketNotifications,
    ...invoiceNotifications,
    ...backupNotifications
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 20);

  return NextResponse.json({
    success: true,
    notifications
  });
}
