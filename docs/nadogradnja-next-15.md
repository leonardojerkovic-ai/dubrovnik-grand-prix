# Nadogradnja na Next.js 15

Napravljeno 29. rujna 2026. Prethodna verzija bila je 14.2.35.

## Zašto

Niz 14 više ne dobiva sigurnosne zakrpe. Od dvadesetak prijavljenih
ranjivosti dvije su kritične, a obje su zakrpane tek u 15.5.24:

- neautentificirano izvršavanje koda kroz Image Optimization API kad se
  koriste AVIF datoteke — pogađa `next/image`, koji stranica koristi;
- neautentificirano izvršavanje koda na poslužiteljima na Windowsu — ne
  pogađa nas, jer Vercel radi na Linuxu.

14.2.35 je posljednja verzija u nizu 14; zakrpe za nju ne postoje i neće
doći. Zato 15, a ne 16: 15.5.26 pokriva sve prijavljeno, a prijelaz je
neusporedivo manji.

## Što je trebalo promijeniti

**`params` i `searchParams` postali su Promise.** Pogađa 18 stranica i 2
route handlera. Potpis je prepisan tako da tijelo funkcije ostane netaknuto:

```ts
// prije
export default async function Page({ params }: { params: { id: string } }) {
  ... params.id

// poslije
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  ... params.id   // ostatak funkcije nepromijenjen
```

**Klijentske komponente ne smiju biti async.** `resetiraj-lozinku/[token]`
je klijentska jer koristi hookove, pa se ondje `params` odmotava React-ovim
`use()` umjesto `await`. Mehanička zamjena to ne hvata — ESLint hvata
(`react-hooks/rules-of-hooks`).

**React 19: `useFormState` → `useActionState`.** Dvanaest obrazaca. Funkcija
je ista, samo se uvozi iz `react` umjesto iz `react-dom`.

**`next-auth` podignut na 4.24.15**, jer starije verzije ne navode React 19
među podržanima. Migracija na next-auth v5 nije potrebna.

**`<a>` zamijenjen `<Link>`** u admin izborniku i na stranici greške. To nije
zahtjev Nexta 15 nego pravilo koje je novi lint počeo prijavljivati kao
grešku.

## Što nije trebalo mijenjati

Ništa u motoru bodovanja, medaljama, nagradama ni ljestvicama — svih 282
testa prolaze bez ijedne izmjene. `experimental.serverActions` u
`next.config.mjs` ostaje kako jest; Next ga i dalje čita odatle i pri
pokretanju ispisuje napomenu, što je očekivano.

## Prije prvog pokretanja

```powershell
npm install
npx prisma generate
npm run build
```

`npm install` je nužan jer se mijenjaju React, Next i njihovi tipovi.

---

# Nadogradnja na Next.js 16 (i ESLint 9)

Napravljeno 13. listopada 2026. Prethodna verzija bila je 15.5.26.

## Zašto

Next 15 ostaje bez zakrpa za one npm audit stavke koje dolaze iz samog
Nexta (lanac `postcss` unutar `next`). Next 16.4.0 ih zatvara. Ostatak
audita dolazi iz Tailwinda 3 i eslint-config-next-ovog lanca `fast-glob`;
njih ne zatvara ova nadogradnja, nego Tailwind 4 (odgođen).

## Što je promijenjeno

**`next lint` → `eslint .`.** Next 16 više nema `next lint`. `npm run lint`
ostaje isto ime jer ga zove `.github/workflows/provjere.yml`.

**`.eslintrc.json` → `eslint.config.mjs`.** ESLint 9 čita samo flat config.
`extends` je zamijenjen uvozom `eslint-config-next/core-web-vitals` i
`eslint-config-next/typescript`. Oba `overrides` bloka prenesena su
doslovno (vidi `docs/lint.md`).

**Novo pravilo `react-hooks/set-state-in-effect`** dolazi s
eslint-config-next 16 i u 15 nije postojalo. Pravilo je na `error`. Tri mjesta
gdje se stanje namjerno sinkronizira u efektu imaju `eslint-disable-next-line`
s razlogom uz kod: `components/tournament-countdown.tsx` (hydration),
`app/alati/nagrade/alat.tsx` (localStorage ne postoji na poslužitelju) i
`components/registrations-provider.tsx` (brisanje stanja nakon odjave). Svaki
novi nenamjerni setState u efektu sada ruši lint.

**`experimental.serverActions.bodySizeLimit`** ostaje pod `experimental`.
Provjereno u `node_modules/next/dist/server/config-schema.js`: ključ je još
tamo, a Next 16 ga čita iz istog mjesta. Ograničenje od 2 MB time vrijedi.
Stvarno ponašanje (odbijanje veće datoteke) nije provjereno pokretanjem,
nego samo prisutnošću ključa i uspješnim buildom.

**Middleware.** Projekt nema `middleware.ts` ni `proxy.ts`, pa se ništa ne
seli.

**Node.** Next 16 traži Node `>=20.9.0`. Lokalno i u CI-ju je 24. Postavka
na Vercelu se ne može provjeriti iz repozitorija; provjeriti u Vercel
postavkama projekta prije deploya (Settings → Node.js Version).

## Provjere

- `npm run typecheck`: prolazi.
- `npm run lint`: čisto (`react-hooks/set-state-in-effect` je na error, tri namjerna mjesta imaju disable s razlogom).
- `npm test`: 504 prolaze.
- `npm run build`: prolazi, bez upozorenja u logu.

## Redoslijed deploya

Ova nadogradnja ide zasebnim PR-om i zasebnim deployem, prije promjene na
putu prijave. Ako nešto pukne na produkciji, mora biti jasno da je uzrok
ova nadogradnja, a ne prijava.
