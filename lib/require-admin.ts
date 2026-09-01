import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type AdminRole = "ADMIN" | "GP_MANAGER";

const ALL_ADMIN_ROLES: AdminRole[] = ["ADMIN", "GP_MANAGER"];

/**
 * Provjera ovlasti za server actione.
 *
 * VAŽNO: `app/admin/layout.tsx` štiti samo PRIKAZ admin stranica. Server
 * actioni su zasebni POST endpointi čiji je identifikator ugrađen u
 * klijentski bundle i mogu se pozvati izravno, zaobilazeći sučelje. Zato
 * svaki admin server action mora sam provjeriti ovlasti — layout to ne radi
 * umjesto njega.
 *
 * Baca iznimku umjesto da vraća grešku: radnja se prekida prije bilo kakvog
 * upisa u bazu (fail-closed). Legitiman admin ovo nikad ne vidi.
 *
 * @param allowed role kojima je radnja dopuštena; zadano su obje admin role.
 */
export async function requireAdmin(
  allowed: AdminRole[] = ALL_ADMIN_ROLES
): Promise<{ role: AdminRole; email: string }> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const email = session?.user?.email;

  if (!role || !email || !allowed.includes(role as AdminRole)) {
    throw new Error("Nemate ovlasti za ovu radnju.");
  }

  return { role: role as AdminRole, email };
}
