-- Ograničenje broja pokušaja za prijavu, registraciju i reset lozinke.
--
-- Brojač je u bazi, a ne u memoriji procesa: na Vercelu svaki zahtjev može
-- završiti na drugoj instanci, pa brojač u memoriji ne bi vrijedio ništa.
--
-- RLS se uključuje odmah, kao i na ostatku sheme. Aplikacija se spaja kao
-- vlasnik pa na nju ne utječe, a javni Supabase ključevi ovdje ne mogu ništa.

CREATE TABLE "rate_limit_hits" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_hits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rate_limit_hits_bucket_createdAt_idx"
    ON "rate_limit_hits"("bucket", "createdAt");

ALTER TABLE "rate_limit_hits" ENABLE ROW LEVEL SECURITY;
