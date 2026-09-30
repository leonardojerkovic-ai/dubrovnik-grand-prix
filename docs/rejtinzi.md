# FIDE rejtinzi

Rejtinzi se uvoze jednom mjesečno, s tekuće FIDE liste. Iz njih se računaju
F_R (čl. 24) i rejtinška kategorija (čl. 22), pa zastarjela lista tiho
mijenja bodove — ne ruši ništa, samo daje krive brojke.

## Zašto se uvoz ne radi sam

FIDE odbija promet iz podatkovnih centara. Veza na `ratings.fide.com:443` s
GitHubovih poslužitelja istekne prije nego se uspostavi:

```
Connect Timeout Error (attempted address: ratings.fide.com:443,
timeout: 10000ms) (UND_ERR_CONNECT_TIMEOUT)
```

Tri pokušaja zaredom daju isto. S kućnog priključka isti uvoz prolazi bez
problema, pa uzrok nije ni adresa ni skripta — nego odakle se zove.

Zato zadatak „Uvoz FIDE rejtinga" na GitHubu **nema raspored**. Ostaje samo
ručno pokretanje, za slučaj da FIDE jednom prestane blokirati.

## Mjesečni postupak

Prvog u mjesecu, na vlastitom računalu:

```powershell
cd C:\Users\leona\Desktop\dubrovnik-grand-prix-app
git pull
npm run fide:import -- --dry-run
```

Probni prolaz ništa ne upisuje — pokaže koliko bi se vrijednosti
promijenilo. Ako izgleda razumno:

```powershell
npm run fide:import
```

Provjeri zatim u `/admin/ratings` da datum liste odgovara tekućem mjesecu.

Za jedan tempo posebno:

```powershell
npm run fide:import -- --type=RAPID
```

## Datum liste

Vrijednosti se u bazu spremaju pod datumom liste, a taj datum odlučuje koji
je rejting vrijedio na dan turnira. Zadano je prvi dan tekućeg mjeseca.

Problem je što FIDE listu za idući mjesec objavljuje **prije** njegova
početka — listopadska je izašla 29. rujna. Tko uvoz pokrene tih dana,
preuzme listopadsku listu, a skripta bi je datirala kao rujansku i time
pregazila vrijednosti po kojima su već računati bodovi za rujanske turnire.
Brojevi bi ostali razumni, samo krivi, i to se ne bi vidjelo.

Zato od 25. u mjesecu skripta odbija pogađati i traži izričit datum:

```powershell
npm run fide:import -- --date=2026-10-01
```

Najjednostavnije je uvoz pokrenuti prvog u mjesecu ili poslije, kad zadana
vrijednost ionako odgovara.

## Podsjetnik

Zadatak „Podsjetnik — rejtinzi" prvog u mjesecu u 07:00 UTC pogleda datum
najnovije liste u bazi. Ništa ne preuzima i ništa ne mijenja.

**Zadatak namjerno PADA kad su rejtinzi zastarjeli.** GitHub tada pošalje
obavijest, i ta obavijest znači: pokreni uvoz kod kuće. Zeleno znači da je
lista tekuća i da nema što raditi.

Isto se može pokrenuti i lokalno:

```powershell
npm run fide:provjeri
```

## Ako uvoz jednom zatreba automatski

Tri su puta, po rastućoj složenosti:

1. **Zakazani zadatak na vlastitom računalu** (Task Scheduler). Radi dok je
   računalo upaljeno, što je za mjesečni posao nepouzdano.
2. **Posrednik s kućnom adresom** kroz koji bi GitHub zvao FIDE. Radi, ali
   uvodi uslugu koju treba plaćati i održavati.
3. **Drugi izvor liste.** Postoje zrcala, ali za njih ne jamči FIDE, pa im
   se ne bi smjelo vjerovati bez provjere.

Dok je uvoz jednom mjesečno, prva opcija iz ovog popisa nije bolja od
ručnog pokretanja uz podsjetnik.
