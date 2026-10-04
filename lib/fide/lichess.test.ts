import { describe, expect, it } from "vitest";
import { rejtinziIzOdgovora, type LichessIgrac } from "./lichess";

const osnova: LichessIgrac = { id: 14599775, name: "Sebastijan, Tonko" };

describe("rejtinziIzOdgovora", () => {
  it("čita sva tri tempa", () => {
    // Stvaran odgovor Lichessa za Sebastijan Tonka.
    expect(
      rejtinziIzOdgovora({ ...osnova, standard: 1621, rapid: 1740, blitz: 1684 })
    ).toEqual({ STANDARD: 1621, RAPID: 1740, BLITZ: 1684 });
  });

  it("izostavljeno polje znači bez rejtinga", () => {
    expect(rejtinziIzOdgovora({ ...osnova, rapid: 1450 })).toEqual({
      STANDARD: null,
      RAPID: 1450,
      BLITZ: null,
    });
  });

  it("nula znači bez rejtinga, ne rejting nula", () => {
    // Inače bi takav igrač ulazio u rejtinške kategorije s nulom umjesto
    // da se računa kao neocijenjen (čl. 24).
    expect(
      rejtinziIzOdgovora({ ...osnova, standard: 0, rapid: 0, blitz: 0 })
    ).toEqual({ STANDARD: null, RAPID: null, BLITZ: null });
  });

  it("igrač bez ijednog rejtinga daje tri prazna polja", () => {
    expect(rejtinziIzOdgovora(osnova)).toEqual({
      STANDARD: null,
      RAPID: null,
      BLITZ: null,
    });
  });
});
