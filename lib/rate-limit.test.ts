import { describe, expect, it } from "vitest";
import { RATE_LIMITS, izvuciAdresu, kljucPrijave, rateLimitMessage } from "./rate-limit-rules";

describe("rateLimitMessage", () => {
  const now = new Date("2026-09-30T10:00:00Z");

  it("zaokružuje naviše, da se ne javi prerano", () => {
    const retryAt = new Date("2026-09-30T10:04:20Z");
    expect(rateLimitMessage(retryAt, now)).toBe("Previše pokušaja. Pokušaj ponovno za 5 min.");
  });

  it("jedninu piše riječju", () => {
    const retryAt = new Date("2026-09-30T10:00:30Z");
    expect(rateLimitMessage(retryAt, now)).toBe("Previše pokušaja. Pokušaj ponovno za minutu.");
  });

  it("dulje čekanje izražava u satima", () => {
    const retryAt = new Date("2026-09-30T11:00:00Z");
    expect(rateLimitMessage(retryAt, now)).toBe(
      "Previše pokušaja. Pokušaj ponovno za sat vremena."
    );
  });

  it("ne otkriva ni adresu ni broj pokušaja", () => {
    const text = rateLimitMessage(new Date("2026-09-30T10:05:00Z"), now);
    expect(text).not.toMatch(/@|\bpostoji\b|\bračun\b/);
  });

  it("radi i bez poznatog roka", () => {
    expect(rateLimitMessage(undefined, now)).toBe("Previše pokušaja. Pokušaj kasnije.");
  });
});

describe("RATE_LIMITS", () => {
  it("svako pravilo ima smislen prozor i granicu", () => {
    for (const [action, rule] of Object.entries(RATE_LIMITS)) {
      expect(rule.limit, action).toBeGreaterThan(0);
      expect(rule.windowMs, action).toBeGreaterThanOrEqual(60_000);
    }
  });

  it("reset lozinke je stroži od prijave, jer svaki pokušaj šalje e-mail", () => {
    expect(RATE_LIMITS.resetLozinke.limit).toBeLessThan(RATE_LIMITS.prijava.limit);
  });
});

describe("kljucPrijave", () => {
  it("razdvaja isti račun s različitih strojeva", () => {
    expect(kljucPrijave("ana@primjer.hr", "1.2.3.4")).not.toBe(
      kljucPrijave("ana@primjer.hr", "5.6.7.8"),
    );
  });

  it("razdvaja različite račune s istog stroja", () => {
    expect(kljucPrijave("ana@primjer.hr", "1.2.3.4")).not.toBe(
      kljucPrijave("ivo@primjer.hr", "1.2.3.4"),
    );
  });

  it("ne razlikuje velika i mala slova ni razmake u adresi", () => {
    expect(kljucPrijave("  Ana@Primjer.hr ", "1.2.3.4")).toBe(
      kljucPrijave("ana@primjer.hr", "1.2.3.4"),
    );
  });

  it("bez IP-a se svodi na adresu, kao i prije", () => {
    expect(kljucPrijave("ana@primjer.hr", "")).toBe("ana@primjer.hr|nepoznato");
  });
});

describe("izvuciAdresu", () => {
  it("uzima prvog iz lanca posrednika", () => {
    expect(izvuciAdresu("1.2.3.4, 10.0.0.1, 10.0.0.2")).toBe("1.2.3.4");
  });

  it("podnosi razmake i jedan jedini član", () => {
    expect(izvuciAdresu("  1.2.3.4  ")).toBe("1.2.3.4");
  });

  it("pada na x-real-ip kad lanca nema", () => {
    expect(izvuciAdresu(null, "9.9.9.9")).toBe("9.9.9.9");
    expect(izvuciAdresu("", "9.9.9.9")).toBe("9.9.9.9");
  });

  it("bez ijednog zaglavlja vraća nepoznato", () => {
    expect(izvuciAdresu(null)).toBe("nepoznato");
    expect(izvuciAdresu("  ", "  ")).toBe("nepoznato");
  });
});

describe("granice", () => {
  it("ograničenje po IP-u je blaže od onoga po računu", () => {
    expect(RATE_LIMITS.prijavaIp.limit).toBeGreaterThan(RATE_LIMITS.prijava.limit);
  });

  it("oba prozora su jednako dugačka, pa se ne razilaze", () => {
    expect(RATE_LIMITS.prijavaIp.windowMs).toBe(RATE_LIMITS.prijava.windowMs);
  });
});
