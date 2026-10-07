# Lint

`npm run lint` pokreće ESLint s postavkama iz `.eslintrc.json`.

## Zašto ova pravila

Tipska provjera (`strict` i `noUncheckedIndexedAccess` u `tsconfig.json`)
hvata pogrešne tipove. ESLint hvata nešto drugo — pogreške u namjeri, koje su
tipski posve ispravne:

- **`react-hooks/exhaustive-deps`** (iz `next/core-web-vitals`) — nedostajuća
  ovisnost u `useEffect`. Najčešći uzrok komponente koja se ne osvježi kad bi
  trebala. Vrijedi i za `components/tournament-countdown.tsx`.
- **`@typescript-eslint/no-unused-vars`** — zaostala varijabla ili uvoz.
  Upravo je takav neiskorišten uvoz zamalo prošao pri dodavanju medalja.
  Prefiks `_` označava da je izostavljanje namjerno.
- **`@next/next/no-img-element`** — `<img>` umjesto `next/image`, čime se
  gubi optimizacija slika.
- **`no-restricted-syntax`** — zabranjuje `text-[10px]`, `text-[11px]` i
  svaki `text-[Npx]` u klasama. Najmanja veličina teksta na stranici je
  `text-xs` (12 px); ispod toga se uz uppercase, razmaknuta slova i
  `text-ink/60` na mobitelu teško čita. Pravilo hvata i obične nizove i
  dijelove template literala. Jedino što ne vidi je `fontSize` atribut u
  SVG-u (graf rejtinga), jer to nije Tailwind klasa.
- **`no-console`** — upozorenje, ne greška. `console.warn` i `console.error`
  su dopušteni svugdje, a puni `console` u skriptama i u `lib/email.ts`, gdje
  je ispis u log namjeran (vidi pričuvu kad `RESEND_API_KEY` nije postavljen).

## Što lint NE provjerava

Raspored ruta. Greška koja je 19.9. srušila build — dva različita naziva
dinamičkog segmenta na istoj razini putanje — ne vidi se ni linterom ni
testovima, nego isključivo kroz `npm run build`. Zato build treba pokrenuti
lokalno prije svakog pusha.
