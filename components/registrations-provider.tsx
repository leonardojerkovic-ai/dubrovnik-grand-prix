"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";

/**
 * Stanje vlastitih prijava, dohvaćeno jednom za cijelu stranicu.
 *
 * Bez ovoga bi svaki gumb radio vlastiti upit, a na kalendaru ih zna biti
 * dvadesetak. Ovako je jedan zahtjev po učitavanju stranice.
 */
type Ctx = {
  ready: boolean;
  isRegistered: (tournamentId: string) => boolean;
  setRegistered: (tournamentId: string, value: boolean) => void;
};

const RegistrationsContext = createContext<Ctx>({
  ready: false,
  isRegistered: () => false,
  setRegistered: () => {},
});

export function RegistrationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const [ids, setIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setIds(status === "unauthenticated" ? new Set() : null);
      return;
    }

    let cancelled = false;
    fetch("/api/moje-prijave")
      .then((r) => (r.ok ? r.json() : { tournamentIds: [] }))
      .then((data: { tournamentIds: string[] }) => {
        if (!cancelled) setIds(new Set(data.tournamentIds));
      })
      .catch(() => {
        if (!cancelled) setIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const isRegistered = useCallback(
    (id: string) => ids?.has(id) ?? false,
    [ids]
  );

  const setRegistered = useCallback((id: string, value: boolean) => {
    setIds((prev) => {
      const next = new Set(prev ?? []);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  return (
    <RegistrationsContext.Provider
      value={{ ready: ids !== null, isRegistered, setRegistered }}
    >
      {children}
    </RegistrationsContext.Provider>
  );
}

export function useRegistrations() {
  return useContext(RegistrationsContext);
}
