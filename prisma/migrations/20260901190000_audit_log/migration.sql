-- Trag o izmjenama u adminu (čl. 29 — prigovor na izračun)
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorEmail" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_at_idx" ON "audit_log"("at");
CREATE INDEX "audit_log_entity_entityId_idx" ON "audit_log"("entity", "entityId");
CREATE INDEX "audit_log_actorEmail_idx" ON "audit_log"("actorEmail");

-- Nove tablice ne nasljeđuju RLS.
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
