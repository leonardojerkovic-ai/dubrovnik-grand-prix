# Dizajn sustav

Tokeni su u `lib/design-tokens.ts`, a Tailwind ih čita odande (`tailwind.config.ts`).
Pravila koja se ne mogu izraziti ni tipovima ni linterom čuvaju testovi u
`lib/dizajn/` — svaki ispisuje datoteku, redak i razlog.

## Boje

Paleta je izvedena iz grba kluba. Boje odličja (zlato, srebro, bronca) nisu
dio palete stranice nego prikaz odličja, ali stoje uz nju jer ih dijele
rang-bedž na ljestvici i medaljica na turniru i profilu — vidi
`lib/dizajn/odlicja.ts`.

Ručno upisanih hex vrijednosti u komponentama nema. Ako nešto ne može kroz
Tailwind klasu (SVG atributi u grafu rejtinga), uvozi se `BOJE`.

**`content` u `tailwind.config.ts` pokriva i `lib/`**, jer tamo stoje gotovi
nizovi klasa. Bez toga ih Tailwind izbaci iz izlaznog CSS-a, a ništa ne
pukne — ni build, ni lint, ni testovi. To se jednom dogodilo; čuva ga test u
`lib/dizajn/odlicja.test.ts`.

## Tekst

| | |
|---|---|
| najmanja veličina | `text-xs` (12 px) |
| sporedni tekst | `text-muted` (ink 60 %) i `text-subtle` (ink 75 %) |

Ispod 12 px se uz uppercase, razmaknuta slova i sivu na mobitelu teško čita.
Sporednih nijansi je prije bilo pet; razlika između susjednih se ne
primjećuje, a pri svakoj novoj komponenti trebalo je nagađati koja je prava.

Čuvaju ih `lib/dizajn/velicina-teksta.test.ts` i `lib/dizajn/nijanse-teksta.test.ts`.

## Širine

| | |
|---|---|
| liste i tablice | `max-w-6xl` |
| tekst i obrasci | `max-w-3xl` |

Prije ih je bilo devet imenovanih, pa je zaglavlje (6xl) bilo šire od
ljestvice (4xl) i rub sadržaja je skakao između rubrika iste stranice.

Iznimke su stranice koje su namjerno jedna uska kartica usred zaslona:
prijava, registracija i zaboravljena lozinka (`max-w-sm`), 404 i stranica
greške (`max-w-md`).

Pravilo se tiče samo spremnika stranice, onoga s `mx-auto`. Unutarnja
ograničenja — `max-w-prose` za odlomak, `max-w-xl` za obrazac, `max-w-3xl` za
graf rejtinga — su nešto drugo i slobodna su. Čuva ga
`lib/dizajn/sirine.test.ts`.

## Zajedničke klase

U `@layer components` u `app/globals.css`:

| | |
|---|---|
| `.page-title` | naslov stranice, s razmakom ispod |
| `.btn-primary` / `.btn-secondary` | glavna i sporedna radnja |
| `.btn-prijava` / `.btn-odjava` | prijava na turnir (zlatna) i odjava (crimson) |
| `.btn-sm` / `.btn-lg` | veličine; modifikatori stoje iza osnovnih pravila |
| `.rank-badge` / `.rank-number` | mjesto na ljestvici |
| `.badge-title`, `.input` | oznaka i polje obrasca |

Prije njih je isti gumb na dvije stranice imao različit padding (šest
inačica) i naslov različit razmak ispod sebe (pet inačica). Utility klasa
nadjača klasu iz `@layer components`, pa se iznimka i dalje piše uz samu
komponentu. Čuva ih `lib/dizajn/zajednicke-klase.test.ts`.

## Pristupačnost

- Fokus prsten je dvobojan (navy obrub, papirnati prsten u razmaku) jer jedna
  boja ne može biti vidljiva i na papiru i na tamnoplavim površinama. Stoji
  izvan `@layer base`, na kraju `globals.css`, da ga `shadow-*` ne pregazi.
- Tekst ide na najmanje 4,5:1, elementi koji nisu tekst na 3:1. Kad se boja
  mijenja, kontrast se izračuna, ne procijeni.
- Oznaka ne smije visjeti samo o boji: aktivna stavka izbornika ima i
  podebljanje i `aria-current`, dijeljeno mjesto ima `sr-only` objašnjenje
  uz znak, a ne `title`.
