# FIDE rejtinzi

Rejtinzi se uvoze jednom mjesečno, s tekuće FIDE liste. Iz njih se računaju
F_R (čl. 24) i rejtinška kategorija (čl. 22), pa zastarjela lista tiho
mijenja bodove — ne ruši ništa, samo daje krive brojke.

## Dva izvora istih podataka

**Lichess (zadano).** Uvoz ide preko `lichess.org/api/fide/player/{id}`,
jedan kratak poziv po igraču. Lichess iste službene FIDE liste povlači sam,
a njega ne blokira nitko, pa ovo radi i s GitHubovih poslužitelja.

**Službene FIDE liste.** `ratings.fide.com` nudi zip od 7–13 MB po tempu.
FIDE odbija promet iz podatkovnih centara, pa to radi samo s kućnog
priključka:

```
Connect Timeout Error (attempted address: ratings.fide.com:443,
timeout: 10000ms) (UND_ERR_CONNECT_TIMEOUT)
```

Lichess je **izvedeni** izvor. Službena lista ostaje mjerodavna i put do nje
se namjerno čuva — za slučaj da Lichess ukine endpoint, promijeni oblik
odgovora, ili da treba provjeriti koja je brojka prava.

## Automatski uvoz

Zadatak „Uvoz FIDE rejtinga" pokreće se prvog u mjesecu u 06:00 UTC i koristi
Lichess. Ne treba ga ništa pratiti dok prolazi.

Ručno, iz kartice Actions → Run workflow, uz kvačicu za probni prolaz.

## Ručni uvoz

```powershell
npm run fide:import -- --dry-run     # provjera, bez upisa
npm run fide:import                  # upis, preko Lichessa
npm run fide:import -- --izvor=fide  # sa službenih lista, samo od kuće
npm run fide:import -- --type=RAPID  # jedan tempo
```

## Datum liste

Vrijednosti se u bazu spremaju pod datumom liste, a taj datum odlučuje koji
je rejting vrijedio na dan turnira. Zadano je prvi dan tekućeg mjeseca.

FIDE listu za idući mjesec objavljuje **prije** njegova početka — listopadska
je izašla 29. rujna. Tko uvoz pokrene tih dana, preuzme listopadske
vrijednosti, a skripta bi ih datirala kao rujanske i time pregazila one po
kojima su već računati bodovi. Zato od 25. u mjesecu skripta odbija pogađati
i traži izričit datum:

```powershell
npm run fide:import -- --date=2026-10-01
```

## Provjera pokrivenosti

```powershell
npm run fide:lichess
```

Prođe kroz sve igrače s FIDE ID-om i ispiše koliko ih je pronađeno, koliko
ima koji rejting, tko nije pronađen i gdje se godište ne poklapa. Zadnje je
provjera da je FIDE ID točan — uvoz spaja isključivo po ID-u, pa kriv ID
tiho uvozi tuđi rejting.

Stanje 4. listopada 2026.: 111 od 122 igrača pronađeno. Onih 11 nema rejting
ni po službenoj listi, pa ih ni stari način nije nalazio.

## Podsjetnik

Zadatak „Podsjetnik — rejtinzi" prvog u mjesecu u 07:00 UTC, sat nakon
uvoza, pogleda datum najnovije liste u bazi. **Namjerno pada** kad su
rejtinzi zastarjeli — ta obavijest znači da uvoz sat ranije nije prošao.

Isto se može pokrenuti lokalno:

```powershell
npm run fide:provjeri
```

## Održavanje projekta budnim

`.github/workflows/keep-alive.yml` svaka tri dana izvrši jedan upit nad
bazom. Besplatni Supabase plan pauzira projekt nakon tjedan dana
neaktivnosti, a pauziran projekt znači da stranica ne radi.
