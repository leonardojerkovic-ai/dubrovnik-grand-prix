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
