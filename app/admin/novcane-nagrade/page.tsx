import type { Metadata } from "next";
import { NovcaneNagradeAlat } from "./alat";

export const metadata: Metadata = {
  title: "Novčane nagrade",
};

export default function NovcaneNagradePage() {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-display text-lg font-bold text-navy">
          Raspodjela novčanih nagrada
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-ink/70">
          Zalijepi konačni poredak iz Excela, upiši objavljene nagrade i
          program izračuna kome što pripada. Ništa se ne sprema u bazu —
          ovo je alat za izračun prije isplate.
        </p>
      </div>

      <div className="rounded-md border border-navy/10 bg-paper/60 px-4 py-3 text-sm text-ink/80">
        <p className="font-semibold text-navy">Pravilo koje program provodi</p>
        <p className="mt-1 italic">
          &bdquo;Nagrade nisu kumulativne. U slučaju da jedan igrač osvoji više
          nagrada, igrač će dobiti veću nagradu. Ako su nagrade jednake igrač
          će dobiti posebnu nagradu prema objavljenom redoslijedu posebnih
          nagrada.&rdquo;
        </p>
        <p className="mt-2">
          Nagrada koju igrač ne uzme jer je dobio veću prelazi na sljedećeg
          igrača koji zadovoljava njezine uvjete, pa se fond podijeli u
          cijelosti. Takve su nagrade u ispisu označene.
        </p>
      </div>

      <NovcaneNagradeAlat />
    </div>
  );
}
