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
