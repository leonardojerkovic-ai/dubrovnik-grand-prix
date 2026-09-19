/**
 * Regresijski test na stvarnom turniru — Uvodni kup, 12.9.2026., 26 igrača.
 *
 * Medalje su na tom turniru dodijeljene i uručene prije nego je ovaj motor
 * napisan, pa je popis dobitnika neovisan od koda. Ako neka buduća izmjena
 * čl. 19 ili redoslijeda priznanja promijeni ovaj ishod, test pada i izmjenu
 * treba svjesno potvrditi — ne tiho prihvatiti.
 *
 * Primijeti da Jančić Ana (2013.) i Franković Mia (2012.) nisu ni u jednoj
 * dobnoj kategoriji po čl. 20, pa im je medalja najbolje igračice jedina
 * dostupna; upravo je zato pripala Jančić, a ne drugoplasiranoj Matić.
 */
import { describe, expect, it } from "vitest";
import { assignMedals, type MedalCandidate } from "./medals";
import { getAkademijaAgeCategories } from "./categories";

const G = 2026; // sezona 2026/27 pocinje 1.9.2026.

const rows: [number, string, number, "M" | "F"][] = [
  [1, "Končarević Dominik", 2015, "M"], [2, "Matić Lucija", 2014, "F"],
  [3, "Perak Ana", 2014, "F"], [4, "Ružić Ivan", 2014, "M"],
  [5, "Soče Ivan", 2014, "M"], [6, "Uljarević Viktor", 2016, "M"],
  [7, "Mateljan Moreno", 2017, "M"], [8, "Jančić Ana", 2013, "F"],
  [9, "Franković Mia", 2012, "F"], [10, "Ambulija Lazar", 2016, "M"],
  [11, "Čičković Luka", 2016, "M"], [12, "Pranjić Stipe", 2014, "M"],
  [13, "Falkoni Luko", 2016, "M"], [14, "Drašković Todor", 2017, "M"],
  [15, "Smoljan Hrvoje", 2017, "M"], [16, "Barač Maris", 2014, "F"],
  [17, "Mataga Luka", 2014, "M"], [18, "Brajak Toma", 2019, "M"],
  [19, "Matić Luka", 2016, "M"], [20, "Dubretić Leo", 2017, "M"],
  [21, "Prkačin Gabriel", 2015, "M"], [22, "Stjepović Maro", 2016, "M"],
  [23, "Bošković Antun", 2018, "M"], [24, "Zec Lucija", 2018, "F"],
  [25, "Drašković Draško", 2018, "M"], [26, "Vojvodić Frana", 2016, "F"],
];

const ranking: MedalCandidate[] = rows.map(([rank, name, by, g]) => ({
  playerId: name,
  rank,
  ageCategories: getAkademijaAgeCategories(by, G),
  isFemale: g === "F",
}));

describe("Uvodni kup 12.9.2026. — stvarna dodjela", () => {
  it("reproducira sedam dodijeljenih medalja", () => {
    const awards = assignMedals(ranking, "KVALIFIKACIJSKI");
    const got = awards.map((a) => `${a.category}${a.place > 1 ? a.place : ""}: ${a.playerId}`);
    expect(got).toEqual([
      "UKUPNO: Končarević Dominik",
      "UKUPNO2: Matić Lucija",
      "UKUPNO3: Perak Ana",
      "U12: Ružić Ivan",
      "U10: Uljarević Viktor",
      "U08: Brajak Toma",
      "ZENE: Jančić Ana",
    ]);
  });
});
