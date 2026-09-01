"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation/registration";

export type RegistrationState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function registerPlayer(_prevState: RegistrationState, formData: FormData): Promise<RegistrationState> {
  const parsed = registrationSchema.safeParse({
    firstName: formData.get("firstName"), lastName: formData.get("lastName"), email: formData.get("email"), password: formData.get("password"), gender: formData.get("gender"), birthYear: formData.get("birthYear"), gdprConsent: formData.get("gdprConsent"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const { firstName, lastName, email, password, gender, birthYear } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { errors: { email: ["Račun s ovim emailom već postoji."] } };
  const passwordHash = await bcrypt.hash(password, 10);
  const gdprConsentAt = new Date();
  const candidates = await prisma.player.findMany({ where: { userId: null, birthYear, firstName: { equals: firstName, mode: "insensitive" }, lastName: { equals: lastName, mode: "insensitive" } } });
  const player = candidates.length === 1 ? candidates[0] : undefined;
  if (player) {
    await prisma.user.create({ data: { email, passwordHash, role: "PLAYER", gdprConsentAt, player: { connect: { id: player.id } } } });
  } else {
    await prisma.user.create({ data: { email, passwordHash, role: "PLAYER", gdprConsentAt, player: { create: { firstName, lastName, gender, birthYear, isClubMember: false } } } });
  }
  redirect("/prijava?registered=1");
}
