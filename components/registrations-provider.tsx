"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";

export type ManagedPlayer = { id: string; name: string; isSelf: boolean };

/**
 * Igrači kojima korisnik upravlja i njihove prijave, dohvaćeni jednom za
 * cijelu stranicu.
 *
 * Bez ovoga bi svaki gumb radio vlastiti upit, a na kalendaru ih zna biti
 * dvadesetak.
 */
type Ctx = {
  ready: boolean;
  players: ManagedPlayer[];
  /** Igrači koji su prijavljeni na zadani turnir. */
  registeredFor: (tournamentId: string) => string[];
  setRegistered: (
    tournamentId: string,
    playerId: string,
    value: boolean
  ) => void;
};

const RegistrationsContext = createContext<Ctx>({
  ready: false,
  players: [],
  registeredFor: () => [],
  setRegistered: () => {},
});

export function RegistrationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const [players, setPlayers] = useState<ManagedPlayer[]>([]);
  const [map, setMap] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") {
        setPlayers([]);
        setMap({});
      }
      return;
    }

    let cancelled = false;
    fetch("/api/moje-prijave")
      .then((r) => (r.ok ? r.json() : { players: [], registrations: {} }))
      .then((data) => {
        if (cancelled) return;
        setPlayers(data.players ?? []);
        setMap(data.registrations ?? {});
      })
      .catch(() => {
        if (!cancelled) setMap({});
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const registeredFor = useCallback(
    (tournamentId: string) => map?.[tournamentId] ?? [],
    [map]
  );

  const setRegistered = useCallback(
    (tournamentId: string, playerId: string, value: boolean) => {
      setMap((prev) => {
        const next = { ...(prev ?? {}) };
        const list = new Set(next[tournamentId] ?? []);
        if (value) list.add(playerId);
        else list.delete(playerId);
        next[tournamentId] = [...list];
        return next;
      });
    },
    []
  );

  return (
    <RegistrationsContext.Provider
      value={{ ready: map !== null, players, registeredFor, setRegistered }}
    >
      {children}
    </RegistrationsContext.Provider>
  );
}

export function useRegistrations() {
  return useContext(RegistrationsContext);
}
