import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { readStore, writeStore } from "@/lib/store";
import type { AdminUser } from "@/lib/store-data";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().max(40).optional().nullable(),
  document: z.string().trim().max(40).optional().nullable(),
  jobTitle: z.string().trim().max(80).optional().nullable(),
  bio: z.string().trim().max(240).optional().nullable(),
  avatarUrl: z.string().max(600000).optional().nullable()
});

async function resolveCurrentAdmin() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") return null;
  return payload;
}

function toProfile(user: AdminUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: user.permissions ?? [],
    avatarUrl: user.avatarUrl ?? null,
    phone: user.phone ?? "",
    document: user.document ?? "",
    jobTitle: user.jobTitle ?? "",
    bio: user.bio ?? "",
    lastAccessAt: user.lastAccessAt ?? null,
    createdAt: user.createdAt
  };
}

export async function GET() {
  const admin = await resolveCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const store = await readStore();
  const user = store.adminUsers.find((item) => item.email.toLowerCase() === admin.email.toLowerCase());
  if (!user) {
    return NextResponse.json({ success: false, message: "Usuario nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ success: true, profile: toProfile(user) });
}

export async function PUT(request: Request) {
  const admin = await resolveCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: "Sessao invalida." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dados invalidos." }, { status: 400 });
  }

  const store = await readStore();
  const index = store.adminUsers.findIndex((item) => item.email.toLowerCase() === admin.email.toLowerCase());
  if (index === -1) {
    return NextResponse.json({ success: false, message: "Usuario nao encontrado." }, { status: 404 });
  }

  store.adminUsers[index] = {
    ...store.adminUsers[index],
    name: parsed.data.name,
    phone: parsed.data.phone?.trim() || null,
    document: parsed.data.document?.trim() || null,
    jobTitle: parsed.data.jobTitle?.trim() || null,
    bio: parsed.data.bio?.trim() || null,
    avatarUrl: parsed.data.avatarUrl || null
  };

  await writeStore(store);
  return NextResponse.json({ success: true, profile: toProfile(store.adminUsers[index]) });
}
