const FAQ = [
  {
    q: "Kako se bodovi računaju?",
    a: "Bodovi se računaju automatski prema pravilniku Dubrovnik Grand Prixa (ili GP Akademije) na temelju broja sudionika, postignutog plasmana i, za glavni GP, jačine i razine turnira. Detaljna formula dostupna je na stranici Dokumenti.",
  },
  {
    q: "Trebam li biti član kluba da bih sudjelovao/la na turnirima?",
    a: "Turniri iz kalendara u pravilu su otvoreni i za igrače izvan kluba, no na službenim ljestvicama prikazuju se isključivo članovi ŠK Dubrovnik.",
  },
  {
    q: "Koliko rezultata ulazi u konačni zbroj sezone?",
    a: "Za Opći GP i kategorijske ljestvice u obzir se uzima polovica broja redovnih turnira iz kalendara (minimalno 5), uz zaštićeni (uvijek uračunat) rezultat završnog turnira. Za GP Akademije broje se najbolja 4 rezultata kvalifikacijske serije plus obavezan rezultat Prvenstva Akademije.",
  },
  {
    q: "Kako se prijavljujem na turnir?",
    a: "Kroz stranicu Prijave na turnire — potreban je korisnički račun (registracija je besplatna). Prijave su moguće samo za turnire kojima su prijave službeno otvorene.",
  },
  {
    q: "Mogu li osporiti izračun bodova?",
    a: "Da — prigovor na izračun podnosi se voditelju natjecanja u roku od 7 dana od objave rezultata. Nakon isteka roka rezultat se smatra konačnim.",
  },
];

import type { Metadata } from "next";
import { SYSTEM_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Odgovori na česta pitanja o Dubrovnik Grand Prixu i GP Akademiji.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-navy mb-8">
        Često postavljena pitanja
      </h1>
      <div className="grid gap-4">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-lg border border-navy/10 bg-white px-4 py-3"
          >
            <summary className="cursor-pointer list-none font-semibold text-navy marker:content-none">
              <span className="flex items-center justify-between">
                {item.q}
                <span className="text-ink/30 transition-transform group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2 text-sm text-ink/70">{item.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-8 max-w-prose text-sm text-ink/70">
        Nisi našao odgovor? Za pitanja o bodovima, ljestvicama i korisničkim
        računima piši na{" "}
        <a
          href={`mailto:${SYSTEM_EMAIL}`}
          className="font-medium text-navy hover:underline"
        >
          {SYSTEM_EMAIL}
        </a>
        . Za učlanjenje, školu šaha i ostale klupske upite adrese su na
        stranici{" "}
        <a href="/postani-clan" className="font-medium text-navy hover:underline">
          Postani član
        </a>
        .
      </p>
    </div>
  );
}
