"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateUserRole(userId: string, role: "PLAYER" | "ADMIN" | "GP_MANAGER") {
  const session = await getServerSession(authOptions);
  const currentRole = (session?.user as { role?: string } | undefined)?.role;

  // Samo ADMIN smije mijenjati role — GP_MANAGER ima pristup admin panelu
  // za svoj posao (turniri, rezultati) ali ne smije dijeliti admin prava.
  if (currentRole !== "ADMIN") {
    throw new Error("Samo administratori mogu mijenjati korisničke role.");
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}
