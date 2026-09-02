"use server";

import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateUserRole(userId: string, role: "PLAYER" | "ADMIN" | "GP_MANAGER") {
  // Samo ADMIN smije mijenjati role — GP_MANAGER ima pristup admin panelu
  // za svoj posao (turniri, rezultati) ali ne smije dijeliti admin prava.
  const actor = await requireAdmin(["ADMIN"]);

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });
  await prisma.user.update({ where: { id: userId }, data: { role } });

  await logAudit({
    actor,
    action: "UPDATE",
    entity: "User",
    entityId: userId,
    summary: `Uloga korisnika ${before?.email ?? userId}: ${before?.role ?? "?"} -> ${role}`,
    before,
    after: { email: before?.email, role },
  });

  revalidatePath("/admin/users");
}
