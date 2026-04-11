import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appendAuditLog } from "@/lib/audit";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { AppStore } from "@/lib/store-data";
import { normalizeStore, readStore, writeStore } from "@/lib/store";
import { buildSystemBackupSummary, createSystemBackupPayload } from "@/lib/system-backup";

async function requireAdmin() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") return null;
  return payload;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function extractStoreCandidate(payload: unknown): Partial<AppStore> | null {
  if (!isObject(payload)) return null;
  if (isObject(payload.backup) && isObject(payload.backup.store)) {
    return payload.backup.store as Partial<AppStore>;
  }
  if (isObject(payload.store)) {
    return payload.store as Partial<AppStore>;
  }
  return payload as Partial<AppStore>;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const store = await readStore();
  await appendAuditLog(store, {
    request,
    action: "admin.backup.export",
    targetType: "system_backup",
    targetId: "full_export",
    actor: { actorType: "admin", actorId: admin.email, actorName: admin.name }
  });
  await writeStore(store);

  const backup = createSystemBackupPayload(store);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedezap-backup-${backup.generatedAt.slice(0, 19).replace(/[:T]/g, "-")}.json"`
    }
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const storeCandidate = extractStoreCandidate(payload);
  if (!storeCandidate || !Array.isArray(storeCandidate.restaurants)) {
    return NextResponse.json({ success: false, message: "Arquivo de backup invalido." }, { status: 400 });
  }

  const normalizedStore = normalizeStore(storeCandidate);
  await appendAuditLog(normalizedStore, {
    request,
    action: "admin.backup.import",
    targetType: "system_backup",
    targetId: "full_import",
    actor: { actorType: "admin", actorId: admin.email, actorName: admin.name },
    metadata: {
      restaurants: normalizedStore.restaurants.length,
      orders: normalizedStore.orders.length,
      customers: normalizedStore.customers.length
    }
  });
  await writeStore(normalizedStore);

  return NextResponse.json({
    success: true,
    message: "Backup importado com sucesso.",
    summary: buildSystemBackupSummary(normalizedStore)
  });
}

