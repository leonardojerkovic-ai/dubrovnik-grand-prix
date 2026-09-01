"use server";

import { requireAdmin } from "@/lib/require-admin";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateUserRole(userId: string, role: "PLAYER" | "ADMIN" | "GP_MANAGER") {
  // Samo ADMIN smije mijenjati role — GP_MANAGER ima pristup admin panelu
  // za svoj posao (turniri, rezultati) ali ne smije dijeliti admin prava.
  await requireAdmin(["ADMIN"]);

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}
