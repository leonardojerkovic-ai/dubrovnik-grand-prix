"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Sesija se čita na klijentu, a ne u korijenskom layoutu.
 *
 * Kad bi je layout dohvaćao poslužiteljski, sve bi stranice postale
 * dinamičke i izgubila bi se predmemorija koju smo namjerno uveli. Ovako
 * stranice ostaju statične i brze, a zaglavlje samo dopuni podatke o
 * prijavljenom korisniku čim se sesija učita.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
