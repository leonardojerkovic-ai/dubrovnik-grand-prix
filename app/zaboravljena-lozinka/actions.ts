"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateResetToken, hashResetToken } from "@/lib/tokens";
import { normalizeEmail } from "@/lib/email-address";
import { checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";

export type ForgotPasswordState = { message?: string; error?: string };
export type ResetPasswordState = { message?: string; error?: string };

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 sat

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { error: "Unesi email." };
  }

  // Svaki zahtjev troši jedan e-mail iz Resendove kvote, pa se broji prije
  // nego se uopće gleda postoji li račun.
  const limit = await checkRateLimit("resetLozinke", email);
  if (!limit.allowed) {
    return { error: rateLimitMessage(limit.retryAt) };
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

  const sada = new Date();

  /*
    Token se troši uvjetno, unutar transakcije.

    Provjera gore je samo brza ruta: između nje i upisa može proći drugi
    zahtjev s istim tokenom i tada bi oba prošla. `updateMany` s uvjetom
    `usedAt: null` zato je ono što stvarno odlučuje — tko ga prvi označi,
    njegov je, a drugi dobije count 0 i ne mijenja ništa.
  */
  const promijenjeno = await prisma.$transaction(async (tx) => {
    const zauzet = await tx.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null },
      data: { usedAt: sada },
    });
    if (zauzet.count !== 1) return false;

    await tx.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        /**
         * Promjena lozinke poništava sve postojeće sesije.
         *
         * Sesija je JWT i traje 30 dana, pa promjena lozinke sama po sebi
         * nikoga ne odjavljuje: tko je sesiju preuzeo, ostaje unutra — a
         * reset lozinke je upravo ono što čovjek učini kad posumnja da mu je
         * račun u tuđim rukama. Vidi jwt callback u lib/auth.ts.
         */
        sessionsValidFrom: sada,
      },
    });

    // I svi ostali nepotrošeni tokeni za ovog korisnika prestaju vrijediti:
    // tko je zatražio reset tuđe lozinke, ne smije ga moći ponoviti nakon
    // što je pravi vlasnik lozinku već promijenio.
    await tx.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, usedAt: null },
      data: { usedAt: sada },
    });

    return true;
  });

  if (!promijenjeno) {
    // Poveznica je u međuvremenu iskorištena — ista poruka kao i za istekli
    // token, da se iz odgovora ne vidi koji je od dva razloga.
    return { error: "Poveznica je nevažeća ili je istekla. Zatraži novu." };
  }

  return {
    message:
      "Lozinka je promijenjena, a sve prijave na drugim uređajima su odjavljene. Sad se možeš prijaviti.",
  };
}
