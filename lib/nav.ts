/**
 * Stavke navigacije. Izdvojene iz komponenti jer ih koriste i zaglavlje
 * (klijentska komponenta) i podnožje (poslužiteljska) — dijeljeni uvoz
 * između to dvoje inače bi cijelu datoteku povukao na klijent.
 *
 * Glavni izbornik namjerno je kratak. S jedanaest stavki lomio se u dva
 * reda i djelovao neuredno; ovo stane u jedan red i pokriva ono zbog čega
 * ljudi dolaze. Ostalo je u podnožju i u mobilnom izborniku, gdje prostor
 * nije problem.
 */

export const PRIMARY_NAV = [
  { href: "/kalendar", label: "Kalendar" },
  { href: "/igraci", label: "Igrači" },
  { href: "/najave", label: "Najave" },
  { href: "/prijave", label: "Prijave" },
  { href: "/o-nama", label: "O nama" },
];

export const SECONDARY_NAV = [
  { href: "/dokumenti", label: "Dokumenti" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/faq", label: "FAQ" },
];

/**
 * "Postani član" ne stoji među ostalim stavkama nego kao istaknut gumb uz
 * prijavu. Jedina je stranica koja klubu donosi nove ljude, a takvu se ne
 * traži pretragom nego se zapazi — kao obična stavka u nizu bila bi manje
 * vidljiva nego ovako, a k tome ne troši mjesto u izborniku.
 */
export const JOIN_LINK = { href: "/postani-clan", label: "Postani član" };
