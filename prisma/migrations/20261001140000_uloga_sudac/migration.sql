-- Uloga suca.
--
-- Dobiva pristup isključivo alatu za raspodjelu novčanih nagrada. Taj alat
-- radi u pregledniku, ne čita iz baze i ne upisuje u nju, pa ova uloga ne
-- donosi nikakvo pravo nad podacima.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUDAC';
