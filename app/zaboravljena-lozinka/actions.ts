"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateResetToken, hashResetToken } from "@/lib/tokens";

export type ForgotPasswordState = { message?: string; error?: string };
export type ResetPasswordState = { message?: string; error?: string };

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 sat

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Unesi email." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // NAPOMENA: namjerno se uvijek vraća ISTA poruka bez obzira postoji li
  // email u bazi ili ne — sprječava enumeraciju registriranih emailova.
  const genericMessage =
    "Ako taj email postoji u sustavu, poslana je poveznica za reset lozinke.";

  if (!user) {
    return { message: genericMessage };
  }

  // Token ide korisniku u poveznici, u bazu ide samo njegov hash.
  const token = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/resetiraj-lozinku/${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch {
    return { error: "Slanje emaila trenutno ne radi — pokušaj kasnije ili kontaktiraj klub." };
  }

  return { message: genericMessage };
}

export async function resetPassword(
  token: string,
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Lozinka mora imati barem 8 znakova." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "Poveznica je nevažeća ili je istekla. Zatraži novu." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { message: "Lozinka je promijenjena. Sad se možeš prijaviti." };
}
