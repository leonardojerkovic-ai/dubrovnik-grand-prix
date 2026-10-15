-- Titula igrača u trenutku spremanja rezultata.
--
-- Tablica odigranog turnira dosad je čitala Player.title, dakle DANAŠNJU
-- titulu. Tko je 2027. bio IV, u 2028. bi i na turniru iz 2027. stajao kao
-- II — povijest se tiho mijenjala, kao što se mijenjao i rejting prije nego
-- je uveden ratingSnapshotUsed.
--
-- NULL znači da je turnir spremljen prije ove izmjene; prikaz tada pada na
-- igračevu trenutnu titulu, pa postojeće tablice ostaju kakve su.
ALTER TABLE "tournament_results" ADD COLUMN "titleSnapshotUsed" "Title";
