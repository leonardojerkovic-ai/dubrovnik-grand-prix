# Sigurnosna kopija baze

Besplatni Supabase plan nema pouzdane automatske kopije — sam Supabase
preporučuje projektima na tom planu da redovito izvoze podatke i drže ih
izvan platforme. Uz to, brisanjem projekta trajno nestaju i sve kopije koje
Supabase čuva.

Zato ovaj repozitorij ima vlastitu kopiju: `.github/workflows/backup.yml`
nedjeljom izradi `pg_dump`, šifrira ga i sprema u zaseban privatni
repozitorij.

## Zašto šifrirano i zašto u drugi repozitorij

Dump sadrži imena članova, adrese e-pošte i otiske lozinki. Glavni
repozitorij je javan, a na javnom repozitoriju javni su i artefakti
zadataka. Kopija zato ide u privatni repozitorij i uz to je šifrirana, da
ni curenje pristupa tom repozitoriju samo po sebi ne otkrije podatke.

## Postavljanje (jednokratno)

**1. Napravi privatni repozitorij** za kopije, npr. `dubrovnik-gp-backup`.
Pri stvaranju odaberi **Private**.

**2. Napravi osobni pristupni token.**
GitHub → Settings → Developer settings → Personal access tokens →
Fine-grained tokens. Ograniči ga samo na taj jedan repozitorij, s pravom
**Contents: Read and write**. Rok trajanja postavi na godinu dana i zapiši
si kad istječe — kad istekne, kopije tiho prestanu nastajati.

**3. Smisli lozinku za šifriranje** i spremi je negdje izvan GitHuba
(upravitelj lozinki, papir u ladici). **Bez nje se kopija ne može
otvoriti** — nema načina da je se zaobiđe.

**4. Postavi tajne** u glavnom repozitoriju, Settings → Secrets and
variables → Actions:

| Tajna | Vrijednost |
|---|---|
| `DATABASE_URL` | session pooler adresa, port 5432 (već postoji zbog uvoza rejtinga) |
| `BACKUP_REPO` | `korisnik/dubrovnik-gp-backup` |
| `BACKUP_REPO_TOKEN` | token iz koraka 2 |
| `BACKUP_PASSPHRASE` | lozinka iz koraka 3 |

**5. Pokreni ručno** u kartici Actions → „Sigurnosna kopija baze" → Run
workflow, i provjeri da je datoteka stvarno završila u privatnom
repozitoriju.

## Obnova iz kopije

Ovo napravi **jednom odmah**, dok ništa nije hitno. Kopija koju nikad nisi
obnovio nije kopija nego pretpostavka.

**1. Preuzmi i dešifriraj:**

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in 2026-09-06.sql.enc -out dump.sql
```

Traži lozinku iz koraka 3.

**2. Pogledaj što je unutra** prije nego išta vratiš:

```bash
grep -c "CREATE TABLE" dump.sql
grep "CREATE TABLE public" dump.sql | head -20
```

**3. Vrati u bazu.** Dump je izrađen s `--clean --if-exists`, dakle prvo
briše postojeće objekte pa ih stvara iznova. **Nikad ga ne pokreći na
produkcijskoj bazi bez potrebe.**

Za probu napravi nov Supabase projekt i vrati u njega:

```bash
psql "postgresql://postgres.[ref]:[lozinka]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" \
  -f dump.sql
```

**4. Nakon obnove** uskladi Prismu i provjeri da RLS stoji na svim
tablicama — nove tablice ga ne nasljeđuju:

```bash
npx prisma migrate status
```

```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;
```

## Održavanje projekta budnim

`.github/workflows/keep-alive.yml` svaka tri dana izvrši jedan upit nad
bazom. Besplatni plan pauzira projekt nakon tjedan dana neaktivnosti, a
pauziran projekt znači da stranica ne radi dok se ručno ne obnovi.

Ako ikad pređeš na plaćeni plan, taj zadatak više nije potreban i može se
obrisati.

## Što provjeriti povremeno

- Je li zadnja kopija u privatnom repozitoriju od prošle nedjelje.
- Nije li istekao `BACKUP_REPO_TOKEN`.
- Znaš li još uvijek gdje ti je lozinka za dešifriranje.
