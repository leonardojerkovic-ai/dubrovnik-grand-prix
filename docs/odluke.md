# Svjesne odluke

Mjesta gdje je ponašanje odabrano, a ne propušteno. Bez ovog zapisa svaki
sljedeći pregled koda otvara isto pitanje iznova.

## Registracija kaže postoji li već račun s tom adresom

`app/registracija/actions.ts` na postojeću adresu vraća „Račun s ovim
emailom već postoji." Reset lozinke, naprotiv, uvijek vraća istu poruku bez
obzira postoji li adresa.

Ta nedosljednost je namjerna.

**Što se time otkriva:** tko pogodi nečiju adresu e-pošte može saznati ima
li ta osoba račun na stranici. Ništa više — ni ime, ni je li član, ni kad se
prijavio.

**Zašto je ostavljeno tako.** Popis članova ŠK Dubrovnika nije tajna; igrači
se međusobno poznaju, a imena stoje na javnim ljestvicama. Jedino što se
saznaje jest je li netko otvorio račun na stranici kluba, što nije podatak
koji nekoga izlaže. S druge strane, cijena skrivanja pada na čovjeka koji je
samo zaboravio da već ima račun: umjesto jasne poruke dobio bi „poslali smo
ti e-mail" i morao bi otvoriti poštu da shvati što se dogodilo.

**Zašto reset ipak šuti.** Tamo je omjer obrnut. Zahtjev za reset ne traži
nikakav podatak osim adrese, pa bi razlika u poruci bila besplatan alat za
provjeru adresa u nizu. Uz to, čovjek koji traži reset ionako ide u poštu,
pa ga generička poruka ništa ne košta.

**Što bi promijenilo odluku.** Ako stranica ikad počne držati podatke koji
nisu javni — bilješke voditelja o igraču, nešto o maloljetnicima izvan onoga
što je već na ljestvicama, ili podatke o plaćanju — tada i sama činjenica da
račun postoji postaje podatak vrijedan skrivanja. Tada registracija treba
prijeći na istu generičku poruku kao reset, uz e-mail koji vlasniku adrese
kaže da je netko pokušao otvoriti račun.

Ograničenje broja pokušaja registracije (6 na sat po adresi, vidi
`lib/rate-limit-rules.ts`) u svakom slučaju sprječava da netko kroz ovo
provuče cijeli popis adresa.

## Prijava se ne zaključava po računu

Pokušaji prijave broje se po tri ključa: par adresa + IP, stroj, i račun.
Prva dva odbijaju; brojač po računu samo upisuje upozorenje u trag
izmjena (`/admin/audit`) kad račun u sat vremena dobije 50 pokušaja.

Upozorenje ide u `audit_log`, a ne u log platforme, jer tamo traje koliko
kaže izjava o privatnosti (12.5). Rok čuvanja Vercelova loga određuje
Vercel i mijenja se s planom, pa ga izjava ne bi mogla točno navesti.

**Zašto.** Dok je i on odbijao, dvije IP adrese bile su dovoljne da se
tuđi račun drži zaključanim. Svaka granica po računu je po svojoj prirodi
i način da se račun zaključa, a zaključavanje vlasnika procijenjeno je kao
veći stvarni rizik za ovu stranicu.

**Što to košta.** Raspršeno pogađanje jednog računa nema gornju među:
svaka nova adresa donosi 32 pokušaja na sat. Upozorenje pomaže samo ako
ga netko pogleda. Detalji i brojke stoje uz `prijavaRacun` u
`lib/rate-limit-rules.ts`.

**Što bi promijenilo odluku.** Znak da netko stvarno pogađa (upozorenja u
logu), ili podaci na stranici koji vrijede više od klupske ljestvice. Tada
se blokada vraća, ali uz kolačić poznatog uređaja, da napadač ne može
zaključati vlasnika na njegovim strojevima.

## Pad brojača pri prijavi pokazuje se kao kriva lozinka

Brojač po računu (`prijavaRacun`) ne smije ni iznimkom odlučivati o prijavi,
pa je pad brave ili baze na njemu propušten: vlasnik se prijavi, a upozorenje
se eventualno izgubi. Brojači po paru i po stroju su zatvoreni i pri padu
odbijaju prijavu.

**Što korisnik vidi.** Kad `prijava` ili `prijavaIp` padnu, `authorize()`
vrati `null`, a NextAuth iz toga napiše generičku poruku o pogrešnoj lozinci.
Čovjeku kojem je zastoj baze odbio prijavu to izgleda kao pogrešna lozinka, pa
će je možda pokušati promijeniti. Ovo nije ispravljeno jer bi razlikovanje
zahtijevalo drukčiju poruku, a ona bi mogla otkriti stanje brojača.

**Zašto ostavljeno.** Rokovi (`TRANSAKCIJA_BRAVE` u `lib/rate-limit-rules.ts`)
su 2 s za čekanje konekcije i za bravu, 3 s ukupno. Kraće od ~2 s odbijalo bi
ljude zbog mrežnog štucanja, a ne zbog napada.

**Što bi promijenilo odluku.** Prijave u logu koje se podudaraju s
`prijavaIp`/`prijava` padom baze, ili pritužbe da se ljudi ne mogu prijaviti
dok je baza u redu. Tada se razlikuje poruka za zastoj, uz provjeru da ne
otkriva stanje brojača.

## vite među razvojnim ovisnostima

Projekt je Next.js i vite sam ne koristi. U `devDependencies` stoji samo
zato što ga vitest od verzije 5 traži kao peer ovisnost, umjesto da ga
donosi sam. Bez izravnog navoda npm install odbija razriješiti stablo jer
stari vite iz lockfilea ne odgovara.

Iz istog razloga je `@types/node` na ^24 (vitest 5 traži ^22 ili ≥24), a
Node u workflowima na 24.

**Kad se može maknuti.** Ako vitest ikad ode iz projekta, vite ide s njim.
Pri nadogradnji vitesta treba provjeriti njegov peer raspon za vite
(`npm view vitest@<verzija> peerDependencies`) i podići vite zajedno s njim.

## Rejting 0 postaje prazno, ali samo u tekućoj tablici

Nula u bazi znači „nema rejtinga", ne rejting nula. Tako je zapisuju FIDE
liste i Swiss-Manager, pa je kroz uvoz takva dospjela i ovamo: u listopadu
2026. imalo ju je 86 od 123 igrača u barem jednom tempu, a 43 u sva tri.

**Što je promijenjeno.** `scripts/ocisti-nule-rejtinga.ts`
(`npm run rejtinzi:nule`) nule u `player_ratings_current` zamjenjuje
praznim. Obrazac `/admin/ratings` to ne može za sva tri tempa odjednom:
akcija odbacuje redak u kojem su sve tri vrijednosti prazne, jer je to
nerazlučivo od „igrača nitko nije dirao".

**Zašto je neutralno.** Nijedan izračun ne mijenja ishod. F_R
(`lib/scoring/gp/formulas.ts`) gleda `r == null || r === 0 ? 1400 : r`;
`isInU1800Category` daje isto za 0 i za 1400, oba su pod 1800; nagrade
(`lib/scoring/prizes.ts`) po istom pravilu. Mijenja se samo prikaz —
`/igraci` i `/admin/players` sada pišu crticu.

**Što NIJE dirano i zašto.** Nule u `player_rating_snapshots` ostaju.
`ratingValue` je `Int`, pa tamo nula ne može postati prazno, nego bi se
morala izbrisati — a `lib/ratings/na-datum.ts` traži zadnji snimak do dana
turnira, pa bi izbrisana nula otkrila stariji snimak sa stvarnom vrijednošću
i promijenila F_R na turnirima koji su već objavljeni. Sezone 2025. i 2026.
su zaključane.

**Posljedica koju treba znati pri čitanju povijesti.** Snimci od 3., 9., 10.
i 16.9.2026. imaju nule preko stvarnih vrijednosti (Mateljan je 1.9. imao
rapid 1588, pa nulu, pa 30.9. ponovno 1588). Pravo na bodove u Akademiji
utvrđivalo se 12.9., kad je zadnji snimak bio nula, pa u svim zapisima
`academy_eligibility` za sezonu 2026/27 stoji `rapidRatingAtFirst = null`.
Odluke su ispravne — nijedan igrač s pravom nije imao rapid ≥ 1600 ni tada
ni danas — ali taj `null` ne znači da je igrač bio bez rejtinga.

## Migracije su kompatibilne unatrag; preview ih ne primjenjuje sam

**Odluka.** `scripts/build.mjs` na produkciji (`VERCEL_ENV=production`) prvo
primjenjuje migracije (`prisma migrate deploy`), pa generira klijenta i gradi
aplikaciju. Svaka druga okolina (preview, lokalno) samo provjerava
(`prisma migrate status`) i prekida build ako ima neprimijenjenih migracija.

**Zašto preview ne primjenjuje migracije.** Nema zasebne preview baze: Supabase
ima samo projekt „Grand Prix“, pa preview koristi produkcijski `DATABASE_URL`.
Da preview sam pokreće `migrate deploy`, prva izgradnja bilo koje grane
mijenjala bi produkcijsku shemu prije nego je itko pogleda. Migraciju zato
primjenjuje čovjek, svjesno, s vlastitog računala.

**Posljedica.** `migrate deploy` ide prije `next build`. Ako build padne nakon
migracije, shema je ispred živog koda. Zato migracije moraju biti
kompatibilne unatrag:
- dodavanje stupca s `NULL` ili `DEFAULT` je u redu;
- preimenovanje i brisanje idu u zasebnu migraciju, tek kad kod koji ih
  koristi više nije u produkciji.

**Što je ostalo.** Nema zasebne preview baze. Ako se to promijeni, preview
bi trebao dobiti vlastiti `DATABASE_URL` u Vercel okolini „Preview“.

## Dva motora nagrada su namjerno odvojena

**Odluka.** Novčane nagrade (`lib/nagrade/dodjela.ts`, kalkulator) i nagrade
turnira (`lib/scoring/prizes.ts`, motor) imaju odvojene modele uvjeta. Ne
spajaju se u jedan komparator ni u jedan model.

**Razlike koje već postoje.**
- Kalkulator ima `rejtingDoUkljucivo`, pa gornja granica rejtinga može biti
  i `≤` i `<`. Motor turnira ima samo `ratingMax`, i ona je uvijek strogo
  isključiva.
- Kalkulator ima `titule` (doslovno poklapanje, WIM nije IM) i `oznaku`
  (dobna oznaka za igrače čije godište nije poznato). Motor nema nijedno od
  to dvoje.
- Posebnost: kalkulator ima eksplicitnu zastavicu `posebna`, a motor je
  izvodi iz kriterija (opća = nijedan kriterij).

**Zašto se pravilo izjednačenja ponavlja.** Pravilo „opća ili posebna prva
pri jednakoj vrijednosti“ postoji na oba mjesta. Zajednički komparator bi
morao primati tri pristupnika kao parametre, pa bi bio dulji od onoga što
zamjenjuje. Umjesto toga, `lib/pravilo-izjednacenja.test.ts` izvodi iste
scenarije nad oba motora. Ako test padne na jednom, a prolazi na drugom,
pravilo se razišlo.

**Što bi spajanje značilo.** Spajanje modela uvjeta (rejting ≤/<, titule,
oznake) je odluka o pravilniku, a ne refaktor. Mijenja što se smije tražiti
kao uvjet nagrade. Ide zajedno s razdvajanjem `app/alati/nagrade/alat.tsx`.

**Zašto je to važno.** Razlika u granici rejtinga ne bi se vidjela dok netko
ne dodijeli nagradu igraču s rejtingom točno na granici.

## Ograničenje broja prijava i lista čekanja

Turnir može imati `maxPlayers`; prazno znači bez ograničenja, pa su svi
turniri od prije ove mogućnosti neograničeni. Kad se mjesta popune, nove
samostalne prijave dobivaju status `NA_CEKANJU` i odatle upadaju kad se
netko odjavi ili kad se kvota povisi. Status je u enumu `RegistrationStatus`
postojao od početka, a dosad ga ništa nije koristilo.

**Odluke vlasnika.**
- Kvota **ne vrijedi za administratora**. Ručni upis uvijek ide među
  prijavljene, i preko broja mjesta — sudac na mjestu zna razloge koje
  sustav ne zna.
- **Povišenje kvote** odmah promiče koliko ih stane, po trenutku prijave.
- **Sniženje ispod broja prijavljenih nikoga ne izbacuje.** Oduzeti nekome
  potvrđeno mjesto gore je od prekoračenja; samo nema novih dok se ne
  isprazni.
- **Lista radi dok su prijave otvorene.** Kad turnir prijeđe u `U_TIJEKU`
  ili `ZAVRSEN`, odjava više nikoga ne promiče: parovi su izvučeni, pa bi
  naknadni ulazak značio igrača koji nije za stolom.

**Zašto brava.** Upis i promicanje idu u transakciji s
`pg_advisory_xact_lock` po turniru, istim obrascem kao brojači prijava
(`lib/rate-limit.ts`), uključujući `SET LOCAL lock_timeout`. Bez nje dvije
istodobne prijave na zadnje mjesto obje pročitaju isti broj i obje prođu, a
to se otkrije na dan turnira kad nema ploče.

**Zašto se obavijest šalje izvan transakcije.** Poruka promaknutom ide tek
nakon što transakcija prođe. Slanje unutar nje držalo bi bravu dok traje
poziv poštanskom servisu, pa bi njegov zastoj zaustavio prijave na tom
turniru. Pad slanja ne ruši odjavu koja ga je izazvala: upis je već točan,
a nedostavljena poruka manja je šteta od odjave prekinute na pola.

**Ponovna prijava vraća na kraj reda.** `registeredAt` se pri ponovnoj
prijavi postavlja na sada, inače bi otkazivanje i ponovna prijava bili
način da se preskoči red.

## Dobne oznake iz Swiss-Managera su ugniježđene

Kad konačni poredak nema godište, jedini podatak o dobi je oznaka iz
izvoza (`U16`, `U14`, `U10`, `S65`…). Dotad se tražilo doslovno poklapanje
s oznakom nagrade, uz obrazloženje da se iz oznake ne smije zaključivati.
To obrazloženje nije bilo točno: oznaka JEST granica godišta, pa iz nje
slijedi pripadnost svim širim razredima iste obitelji.

```
U10 = rođen ≥ G−10, dakle i ≥ G−12 i ≥ G−16  →  zadovoljava U12, U16
S65 = rođen ≤ G−65, dakle i ≤ G−60 i ≤ G−50  →  zadovoljava S60, S50
```

Smjer je suprotan za dvije obitelji, a obitelji se ne miješaju: U20 nije
S20. Oznaka koja nije oblika `U<broj>` ili `S<broj>` i dalje se uspoređuje
doslovno — iz nje se doista ne može ništa izvesti. Vidi `oznakaZadovoljava`
u `lib/nagrade/dob.ts`.

**Gdje toga nije bilo.** Samo u kalkulatoru novčanih nagrada, i samo na
putu bez godišta. Kad je godište poznato, usporedba ide preko
`birthYearMin`/`birthYearMax` i uvijek je bila ugniježđena — isto kao
dobne kategorije glavnog GP-a (čl. 22, `lib/scoring/gp/categories.ts`) i
Akademije (čl. 20, `lib/scoring/akademija/categories.ts`). Oba su
provjerena i nisu mijenjana.

## Redoslijed dodjele je potpun i ispisuje se

`redoslijedDodjele` ima i četvrti kriterij, `id`, nakon iznosa, pravila i
objavljenog redoslijeda. Bez njega bi dvije nagrade istog iznosa, iste
vrste i istog objavljenog redoslijeda ovisile o tome kako
`Array.prototype.sort` slaže jednake članove — a o tom poretku ovisi tko
dobiva nagradu.

Redoslijed se prikazuje i u alatu, iz istog poziva koji dodjeljuje, pa se
ispis i dodjela ne mogu razići.

## Nedodijeljena nagrada kaže zašto

`Dodjela.razlog` razlikuje dva ishoda koja su dotad izgledala jednako:

- `NEMA_KANDIDATA` — nitko ne zadovoljava uvjete. Raspis traži nešto čega
  na turniru nema, pa se uz poruku ispisuju i uvjeti (`opisUvjeta`).
  Organizatoru je to signal da uvjet promijeni ili nagradu ukine.
- `SVI_NAGRADENI` — ima tko je zadovoljava, ali su svi već dobili veću.
  Uredan ishod, novac je otišao kroz veće nagrade; nema što popravljati.

Dok se javljalo samo „nije dodijeljena", drugi se slučaj čitao kao greška
u raspisu.
