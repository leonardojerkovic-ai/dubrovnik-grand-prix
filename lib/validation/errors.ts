import type { ZodError } from "zod";

/**
 * Pretvara zodovu grešku u oblik koji obrasci očekuju.
 *
 * `flatten().fieldErrors` sadrži samo greške vezane uz pojedino polje. Pravila
 * koja se odnose na cijeli objekt — u zodu `.refine()` bez `path` — završavaju
 * u `formErrors` i dosad su tiho nestajala: akcija bi odbila spremanje, a
 * obrazac ne bi prikazao ništa.
 *
 * Takve se poruke ovdje smještaju pod ključ `_form`, koji sažetak na vrhu
 * obrasca ispisuje zajedno s ostalima.
 */
export function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const flat = error.flatten();
  const out: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (messages && messages.length > 0) out[key] = messages;
  }
  if (flat.formErrors.length > 0) out._form = flat.formErrors;
  return out;
}

/**
 * Skuplja poslana polja obrasca da ih se nakon neuspjelog spremanja može
 * vratiti na ekran.
 *
 * React 19 sam prazni obrazac čim server akcija završi, pa bi se inače sav
 * unos izgubio i kad je odbijeno jedno jedino polje. Vrijednosti se čuvaju
 * kao popis po ključu jer više polja može dijeliti isto ime (skupine
 * potvrdnih okvira).
 *
 * Lozinke se namjerno ne vraćaju: nema razloga da putuju natrag do
 * preglednika, a korisnik ih ionako upisuje iz glave.
 */
const OMITTED_FIELDS = ["password", "confirmPassword", "currentPassword"];

export function formValuesFrom(formData: FormData): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (OMITTED_FIELDS.includes(key)) continue;
    (out[key] ??= []).push(value);
  }
  return out;
}
