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
