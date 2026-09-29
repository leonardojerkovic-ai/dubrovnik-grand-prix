import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fieldErrorsFrom } from "./errors";

const shema = z
  .object({
    a: z.string().min(1, "a je obavezno"),
    b: z.boolean(),
    c: z.boolean(),
  })
  .refine((v) => !v.c || v.b, { message: "c traži b", path: ["c"] })
  .refine((v) => v.a !== "zabranjeno", { message: "a ne smije biti zabranjeno" });

function greske(input: unknown) {
  const r = shema.safeParse(input);
  if (r.success) throw new Error("očekivana greška");
  return fieldErrorsFrom(r.error);
}

describe("fieldErrorsFrom", () => {
  it("greška polja ostaje pod imenom polja", () => {
    expect(greske({ a: "", b: true, c: false }).a).toEqual(["a je obavezno"]);
  });

  it("refine s putanjom ide pod to polje", () => {
    expect(greske({ a: "x", b: false, c: true }).c).toEqual(["c traži b"]);
  });

  it("refine bez putanje ide pod _form umjesto da nestane", () => {
    expect(greske({ a: "zabranjeno", b: true, c: false })._form).toEqual([
      "a ne smije biti zabranjeno",
    ]);
  });

  it("prazna polja se izostavljaju", () => {
    const g = greske({ a: "", b: true, c: false });
    expect(Object.keys(g)).toEqual(["a"]);
  });
});
