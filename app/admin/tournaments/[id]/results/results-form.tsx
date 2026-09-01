"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { saveTournamentResults, type ResultRow } from "./actions";
import { finalizeTournamentResults } from "./finalize";

type PlayerOption = { id: string; label: string };
type ValidationIssue = { row: number; message: string };

function parseCsv(text: string): ResultRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const first = lines[0].toLowerCase();
  const start = /player|igra|rank|mjesto/.test(first) ? 1 : 0;
  return lines.slice(start).map((line, index) => {
    const c = line.split(delimiter).map((x) => x.trim().replace(/^"|"$/g, ""));
    const games = c[4] ?? "1";
    return { playerId: c[1] ?? "", rank: Number(c[0]) || index + 1, rating: c[2] ? Number(c[2]) || null : null, gamesPlayed: !["0", "false", "ne", "no"].includes(games.toLowerCase()) };
  });
}

export function ResultsForm({ tournamentId, players, initialRows, locked = false }: { tournamentId: string; players: PlayerOption[]; initialRows: ResultRow[]; locked?: boolean }) {
  const [rows, setRows] = useState<ResultRow[]>(initialRows.length ? initialRows : [{ playerId: "", rank: 1, rating: null, gamesPlayed: true }]);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const issues = useMemo<ValidationIssue[]>(() => {
    const out: ValidationIssue[] = [];
    const played = rows.filter((r) => r.playerId && r.gamesPlayed);
    if (played.length < 6) out.push({ row: 0, message: `Za zaključavanje GP turnira potrebno je najmanje 6 igrača s odigranom partijom (trenutno ${played.length}).` });
    const ranks = new Map<number, number[]>();
    rows.forEach((r, i) => { if (r.playerId && r.gamesPlayed) ranks.set(r.rank, [...(ranks.get(r.rank) ?? []), i]); });
    ranks.forEach((idxs, rank) => { if (rank < 1 || idxs.length > 1) idxs.forEach((i) => out.push({ row: i, message: rank < 1 ? "Plasman mora biti ≥ 1." : `Dupli plasman: ${rank}. mjesto.` })); });
    const seen = new Set<string>();
    rows.forEach((r, i) => {
      if (!r.playerId) return;
      if (seen.has(r.playerId)) out.push({ row: i, message: "Igrač je unesen više puta." });
      seen.add(r.playerId);
      if (r.gamesPlayed && (!r.rating || r.rating <= 0)) out.push({ row: i, message: "Za odigran rezultat unesi valjan rejting." });
    });
    return out;
  }, [rows]);

  function updateRow(index: number, patch: Partial<ResultRow>) { setRows((prev) => prev.map((r, i) => i === index ? { ...r, ...patch } : r)); }
  function addRow() { setRows((prev) => [...prev, { playerId: "", rank: prev.length + 1, rating: null, gamesPlayed: true }]); }
  function removeRow(index: number) { setRows((prev) => prev.filter((_, i) => i !== index)); }
  function importCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => { try { const imported = parseCsv(String(reader.result ?? "")); if (!imported.length) throw new Error("CSV je prazan."); setRows(imported); setFeedback({ ok: true, text: `Uvezeno ${imported.length} redaka. Provjeri validaciju prije spremanja.` }); } catch (e) { setFeedback({ ok: false, text: e instanceof Error ? e.message : "Neispravan CSV." }); } };
    reader.readAsText(file, "UTF-8");
  }
  function submit(e: React.FormEvent) {
    e.preventDefault(); setFeedback(null);
    if (locked) return setFeedback({ ok: false, text: "Turnir je zaključan. Rezultati se više ne mogu mijenjati." });
    if (issues.length) return setFeedback({ ok: false, text: `Nije moguće spremiti: ${issues.length} validacijskih upozorenja.` });
    startTransition(async () => { const result = await saveTournamentResults(tournamentId, rows.filter((r) => r.playerId)); setFeedback(result.error ? { ok: false, text: result.error } : { ok: true, text: result.message ?? "Rezultati spremljeni." }); });
  }
  function finalize() {
    if (locked) return;
    const ok = window.confirm("Zaključati turnir i obračunati GP bodove? Nakon potvrde rezultati više neće biti moguće mijenjati.");
    if (!ok) return;
    setFeedback(null);
    startTransition(async () => { const result = await finalizeTournamentResults(tournamentId); setFeedback(result.error ? { ok: false, text: result.error } : { ok: true, text: result.message ?? "Turnir je zaključen." }); if (!result.error) window.location.reload(); });
  }

  if (locked) return <div className="grid gap-4"><div className="rounded-lg border border-academy/30 bg-academy/5 p-4"><div className="font-semibold text-academy">✓ Turnir je zaključan</div><p className="mt-1 text-sm text-ink/70">Rezultati i obračun GP bodova su zaključani. Uređivanje više nije dostupno.</p></div><div className="overflow-x-auto rounded-lg border border-navy/10 bg-white"><table className="w-full text-sm"><thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60"><tr><th className="px-3 py-2">Mjesto</th><th className="px-3 py-2">Igrač</th><th className="px-3 py-2">Rejting</th><th className="px-3 py-2">Odigrao</th></tr></thead><tbody className="divide-y divide-navy/10">{rows.map((r, i) => <tr key={i}><td className="px-3 py-2">{r.rank}</td><td className="px-3 py-2">{players.find((p) => p.id === r.playerId)?.label ?? r.playerId}</td><td className="px-3 py-2">{r.rating ?? "—"}</td><td className="px-3 py-2">{r.gamesPlayed ? "Da" : "Ne"}</td></tr>)}</tbody></table></div></div>;

  return <form onSubmit={submit} className="grid gap-4">
    {feedback && <p className={`rounded-md px-3 py-2 text-sm ${feedback.ok ? "bg-academy/10 text-academy" : "bg-crimson/10 text-crimson"}`}>{feedback.text}</p>}
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-navy/10 bg-white p-3"><button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5">Uvezi CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} /><span className="text-xs text-ink/50">CSV: mjesto, playerId, rejting, [W/D/L], odigrao</span></div>
    <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white"><table className="w-full text-sm"><thead className="bg-navy/5 text-left text-xs uppercase tracking-wide text-ink/60"><tr><th className="px-3 py-2 w-16">Mjesto</th><th className="px-3 py-2 min-w-56">Igrač</th><th className="px-3 py-2 w-32">Rejting</th><th className="px-3 py-2 w-24">Odigrao</th><th className="px-3 py-2">Validacija</th><th className="px-3 py-2 w-16" /></tr></thead><tbody className="divide-y divide-navy/10">{rows.map((row, i) => { const rowIssues = issues.filter((x) => x.row === i); return <tr key={i} className={rowIssues.length ? "bg-crimson/5" : ""}><td className="px-3 py-2"><input type="number" min={1} value={row.rank} onChange={(e) => updateRow(i, { rank: Number(e.target.value) })} className="input w-16" /></td><td className="px-3 py-2"><select value={row.playerId} onChange={(e) => updateRow(i, { playerId: e.target.value })} className="input w-full"><option value="">— odaberi igrača —</option>{players.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></td><td className="px-3 py-2"><input type="number" min={1} value={row.rating ?? ""} onChange={(e) => updateRow(i, { rating: e.target.value ? Number(e.target.value) : null })} className="input w-28" /></td><td className="px-3 py-2"><input type="checkbox" checked={row.gamesPlayed} onChange={(e) => updateRow(i, { gamesPlayed: e.target.checked })} className="h-4 w-4 rounded border-navy/30" /></td><td className="px-3 py-2 text-xs text-crimson">{rowIssues.map((x, j) => <div key={j}>{x.message}</div>)}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => removeRow(i)} className="text-crimson hover:underline text-xs">Ukloni</button></td></tr>; })}</tbody></table></div>
    <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={addRow} className="rounded-md border border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5">+ Dodaj red</button><button type="submit" disabled={isPending || issues.length > 0} className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-paper hover:bg-navy-light disabled:opacity-50">{isPending ? "Spremam…" : "Spremi rezultate"}</button><button type="button" onClick={finalize} disabled={isPending || issues.length > 0} className="rounded-md bg-crimson px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{isPending ? "Obrađujem…" : "Zaključi turnir i obračunaj GP"}</button></div>
    <div className={`rounded-lg border p-3 text-sm ${issues.length ? "border-crimson/30 bg-crimson/5 text-crimson" : "border-academy/30 bg-academy/5 text-academy"}`}><strong>{issues.length ? `⚠ ${issues.length} problema` : "✓ Osnovna validacija prolazi"}</strong><p className="mt-1 text-xs">Spremanje ne zaključava turnir. Gumb za zaključavanje pokreće novu serversku provjeru, ponovno računa bodove i tek nakon uspjeha trajno zaključava rezultate.</p></div>
    <p className="text-xs text-ink/50">Zaključavanje je namjerno odvojeno od spremanja kako bi administrator mogao ispraviti rezultat prije konačne objave.</p>
  </form>;
}
