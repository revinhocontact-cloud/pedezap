import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import { readStore, writeStore } from "@/lib/store";
import { isActiveSessionValid, touchActiveSession } from "@/lib/session-registry";

export async function GET() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload || payload.kind !== "admin") {
    return NextResponse.json(
      { success: false, message: "Sessao invalida." },
      { status: 401 }
    );
  }
  const store = await readStore();
  const user = store.adminUsers.find((item) => item.email.toLowerCase() === payload.email.toLowerCase());
  if (token) {
    if (!isActiveSessionValid(store, token)) {
      return NextResponse.json(
        { success: false, message: "Sessao encerrada remotamente." },
        { status: 401 }
      );
    }
    if (touchActiveSession(store, token)) {
      await writeStore(store);
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      email: payload.email,
      name: user?.name ?? payload.name,
      role: user?.role ?? payload.role,
      permissions: user?.permissions ?? payload.permissions ?? [],
      avatarUrl: user?.avatarUrl ?? null,
      phone: user?.phone ?? "",
      document: user?.document ?? "",
      jobTitle: user?.jobTitle ?? "",
      bio: user?.bio ?? "",
      twoFactorEnabled: !!user?.twoFactorEnabled
    }
  });
}
