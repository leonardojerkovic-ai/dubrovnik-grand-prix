# Dubrovnik Grand Prix

Web sustav za ljestvice i turnire ŠK Dubrovnik (glavni Dubrovnik GP + zaseban
GP Akademije).

## Pokretanje lokalno

```bash
npm install
cp .env.example .env.local   # popuni DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, Google OAuth
npx prisma migrate dev       # kreira tablice u Supabase bazi
npx prisma generate
npm run dev
```

Testovi bodovnog enginea:

```bash
npm run test
```

## Struktura

```
prisma/schema.prisma       — shema baze (Postgres/Supabase)
lib/scoring/                — bodovni engine (čist TS, testiran protiv pravilnika)
  gp/formulas.ts             — GP bodovi po turniru (čl. 5-9)
  gp/standings.ts            — GP ljestvice, kvote, tie-break (čl. 16-18)
  gp/categories.ts           — dobne/veteranske/U1800 kategorije (čl. 22)
  akademija/formulas.ts      — Akademija bodovi po turniru (čl. 7-9, 13)
  akademija/standings.ts     — Akademija ljestvica, tie-break (čl. 14-15)
lib/auth.ts                 — NextAuth (email/lozinka + Google)
lib/prisma.ts                — Prisma client singleton
app/                         — javne stranice + admin panel (App Router)
  admin/players/              — CRUD igrača (prvi gotov modul)
  api/auth/[...nextauth]/     — auth endpoint
components/                  — dijeljene UI komponente
```

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
- [ ] RLS u produkciji (Supabase) — još nije uključeno
- [x] Naslovnica prikazuje sve aktivne sezone (GP i/ili Akademija)
- [x] Self-registracija se spaja s postojećim admin-unesenim Player zapisom kad je podudaranje jednoznačno (ime+prezime+godište)
- [x] Provjera prava na bodove za Akademiju (čl. 3) sad se automatski provjerava pri unosu rezultata (zahtijeva postavljen birthDate)
- [ ] Snapshot pripadnosti kategoriji na dan turnira (čl. 22 st. 3) — trenutno se računa live
