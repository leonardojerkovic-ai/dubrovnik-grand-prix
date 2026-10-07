# Dubrovnik Grand Prix

Web sustav za ljestvice i turnire ŠK Dubrovnik (glavni Dubrovnik GP + zaseban
GP Akademije).

## Pokretanje lokalno

```bash
npm install
cp .env.example .env.local   # popuni DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma migrate dev       # kreira tablice u Supabase bazi
npx prisma generate
npm run dev
```

Testovi bodovnog enginea i ostatka:

```bash
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
```

Isto troje pokreće i GitHub Actions na svaki push i PR
(`.github/workflows/provjere.yml`), pa se ne oslanja samo na ruku.

## Struktura

```
prisma/schema.prisma        — shema baze (Postgres/Supabase)
prisma/migrations/          — migracije, uključujući RLS i parcijalne indekse
lib/scoring/                — bodovni engine (čist TS, testiran protiv pravilnika)
  gp/formulas.ts              — GP bodovi po turniru (čl. 5–9)
  gp/standings.ts             — GP ljestvice, kvote, tie-break (čl. 16–18)
  gp/categories.ts            — dobne/veteranske/U1800 kategorije (čl. 22)
  akademija/formulas.ts       — Akademija bodovi po turniru (čl. 7–9, 13)
  akademija/standings.ts      — Akademija ljestvica, tie-break (čl. 14–15)
  akademija/medals.ts         — medalje i posebne medalje (čl. 19)
lib/standings/              — ljestvice spojene s bazom (GP, Akademija, slugovi)
lib/akademija/              — pravo na bodove (čl. 3) i preračun pri izmjeni
lib/nagrade/                — raspodjela novčanih nagrada, čitanje Swiss Managera
lib/dodjela/                — razlike pri dodjeli, za poruke adminu
lib/fide/, lib/ratings/     — uvoz i vrijednost rejtinga
lib/dizajn/                 — pravila dizajn sustava i testovi koji ih čuvaju
lib/auth.ts                 — NextAuth (email i lozinka)
lib/rate-limit*.ts          — ograničenje broja pokušaja (prijava, reset, registracija)
lib/prisma.ts               — Prisma client singleton
app/                        — javne stranice + admin panel (App Router)
  admin/                      — CRUD: igrači, sezone, turniri, rezultati, medalje,
                                nagrade, dokumenti, hall of fame, pristupni kodovi
  alati/nagrade/              — alat za raspodjelu nagrada (uloga SUDAC)
  api/auth/[...nextauth]/     — auth endpoint
components/                 — dijeljene UI komponente
docs/                       — dizajn sustav, lint, rejtinzi, sigurnosna kopija,
                              nadogradnja Nexta
.github/workflows/          — provjere, sigurnosna kopija, uvoz rejtinga
```

## Uloge

| Uloga | Što može |
|---|---|
| `PLAYER` | svoj račun, povezane igrače, prijavu na turnire |
| `ADMIN` | sve |
| `GP_MANAGER` | voditelj GP-a / voditelj natjecanja Akademije (čl. 26 / čl. 21) |
| `SUDAC` | isključivo alat za raspodjelu novčanih nagrada — ništa ne čita iz baze ni ne upisuje u nju; nagrade na turniru dijeli sudac, a njemu nema razloga davati pristup igračima i rezultatima |

## Napomena o formuli GP-a (glavni sustav)

Engine slijedi formulu iz čl. 5–6 pravilnika v1.1 (usvojen, rujan 2026.) i
slaže se s kontrolnim primjerom iz Priloga u svakom redu (N=19, prosječni
rapid 1676,4: 87, 75, 63, 37, 2 boda). Radna verzija pravilnika imala je u
tom primjeru 64 i 38 za 5. i 10. mjesto; usvojena ih je ispravila.

## Status razvoja

- [x] Faza 1 — bodovni engine (obje formule, standings, kategorije), testiran
- [x] Faza 0 — Next.js scaffolding, dizajn sustav, Prisma + Supabase, auth
- [x] Admin CRUD: Igrači, Sezone, Turniri + unos rezultata, Dokumenti, Hall of Fame
- [x] Javne ljestvice (Opći GP + kategorijske + Akademija)
- [x] Online prijave na turnire (igrački računi, registracija, prijava/odjava)
- [x] Kalendar, Dokumenti, FAQ, O nama, Postani član, Hall of Fame stranice
- [x] RLS u produkciji (Supabase) — uključen migracijama (sedam ih dira RLS)
- [x] Naslovnica prikazuje sve aktivne sezone (GP i/ili Akademija)
- [x] Self-registracija se spaja s postojećim admin-unesenim Player zapisom kad je podudaranje jednoznačno (ime+prezime+godište)
- [x] Provjera prava na bodove za Akademiju (čl. 3) sad se automatski provjerava pri unosu rezultata (zahtijeva postavljen birthDate)
- [x] Pripadnost kategoriji na dan turnira (čl. 22 st. 3) — snapshot nije
      potreban, i to ne zato što je odgođen nego zato što nema što snimiti:
      dobne i veteranske kategorije ovise samo o godištu igrača i godini
      početka sezone, a oboje je nepromjenjivo tijekom sezone, pa izračun
      daje isti rezultat u siječnju i u prosincu. Jedina promjenjiva je
      U1800, i za nju se koristi rejting zabilježen uz rezultat turnira
      (`ratingUsedOnTournament`), ne današnji. Vidi komentare u
      `lib/scoring/gp/categories.ts` i `lib/standings/gp.ts`.
