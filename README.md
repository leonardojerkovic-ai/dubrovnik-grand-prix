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

Kontrolni primjer PRILOG A u izvornom pravilniku sadrži manje računske
nepodudarnosti (vidi komentar u `lib/scoring/gp/formulas.ts`). Engine
slijedi formulu doslovno kako je zapisana u čl. 5-6 — provjeriti s
voditeljem GP-a prije službenog usvajanja pravilnika.

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
