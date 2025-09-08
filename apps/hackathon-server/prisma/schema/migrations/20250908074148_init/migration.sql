-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "wrtnlabs"."autobe_hackathons" (
    "id" UUID NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "opened_at" TIMESTAMPTZ NOT NULL,
    "closed_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "autobe_hackathons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrtnlabs"."autobe_hackathon_participants" (
    "id" UUID NOT NULL,
    "autobe_hackathon_id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "autobe_hackathon_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrtnlabs"."autobe_hackathon_sessions" (
    "id" UUID NOT NULL,
    "autobe_hackathon_id" UUID NOT NULL,
    "autobe_hackathon_participant_id" UUID NOT NULL,
    "model" VARCHAR NOT NULL,
    "timezone" VARCHAR NOT NULL,
    "review_article_url" VARCHAR(2048),
    "created_at" TIMESTAMPTZ NOT NULL,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "autobe_hackathon_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrtnlabs"."autobe_hackathon_session_connections" (
    "id" UUID NOT NULL,
    "autobe_hackathon_session_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "disconnected_at" TIMESTAMPTZ,

    CONSTRAINT "autobe_hackathon_session_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrtnlabs"."autobe_hackathon_session_histories" (
    "id" UUID NOT NULL,
    "autobe_hackathon_session_id" UUID NOT NULL,
    "autobe_hackathon_session_connection_id" UUID NOT NULL,
    "type" VARCHAR NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "autobe_hackathon_session_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrtnlabs"."autobe_hackathon_session_events" (
    "id" UUID NOT NULL,
    "autobe_hackathon_session_id" UUID NOT NULL,
    "autobe_hackathon_session_connection_id" UUID NOT NULL,
    "type" VARCHAR NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "autobe_hackathon_session_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wrtnlabs"."autobe_hackathon_session_aggregates" (
    "id" UUID NOT NULL,
    "autobe_hackathon_session_id" UUID NOT NULL,
    "state" VARCHAR,
    "enabled" BOOLEAN NOT NULL,
    "token_usage" JSONB NOT NULL,

    CONSTRAINT "autobe_hackathon_session_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "autobe_hackathons_name_idx" ON "wrtnlabs"."autobe_hackathons"("name");

-- CreateIndex
CREATE INDEX "autobe_hackathons_created_at_idx" ON "wrtnlabs"."autobe_hackathons"("created_at");

-- CreateIndex
CREATE INDEX "autobe_hackathons_opened_at_closed_at_idx" ON "wrtnlabs"."autobe_hackathons"("opened_at", "closed_at");

-- CreateIndex
CREATE UNIQUE INDEX "autobe_hackathons_code_key" ON "wrtnlabs"."autobe_hackathons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "autobe_hackathon_participants_autobe_hackathon_id_email_key" ON "wrtnlabs"."autobe_hackathon_participants"("autobe_hackathon_id", "email");

-- CreateIndex
CREATE INDEX "autobe_hackathon_sessions_autobe_hackathon_id_created_at_idx" ON "wrtnlabs"."autobe_hackathon_sessions"("autobe_hackathon_id", "created_at");

-- CreateIndex
CREATE INDEX "autobe_hackathon_sessions_autobe_hackathon_participant_id_c_idx" ON "wrtnlabs"."autobe_hackathon_sessions"("autobe_hackathon_participant_id", "created_at");

-- CreateIndex
CREATE INDEX "autobe_hackathon_session_connections_autobe_hackathon_sessi_idx" ON "wrtnlabs"."autobe_hackathon_session_connections"("autobe_hackathon_session_id", "created_at");

-- CreateIndex
CREATE INDEX "autobe_hackathon_session_histories_session_idx" ON "wrtnlabs"."autobe_hackathon_session_histories"("autobe_hackathon_session_id", "created_at");

-- CreateIndex
CREATE INDEX "autobe_hackathon_session_histories_connection_idx" ON "wrtnlabs"."autobe_hackathon_session_histories"("autobe_hackathon_session_connection_id", "created_at");

-- CreateIndex
CREATE INDEX "autobe_hackathon_session_events_autobe_hackathon_session_id_idx" ON "wrtnlabs"."autobe_hackathon_session_events"("autobe_hackathon_session_id", "created_at");

-- CreateIndex
CREATE INDEX "autobe_hackathon_session_events_autobe_hackathon_session_co_idx" ON "wrtnlabs"."autobe_hackathon_session_events"("autobe_hackathon_session_connection_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "autobe_hackathon_session_aggregates_autobe_hackathon_sessio_key" ON "wrtnlabs"."autobe_hackathon_session_aggregates"("autobe_hackathon_session_id");

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_participants" ADD CONSTRAINT "autobe_hackathon_participants_autobe_hackathon_id_fkey" FOREIGN KEY ("autobe_hackathon_id") REFERENCES "wrtnlabs"."autobe_hackathons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_sessions" ADD CONSTRAINT "autobe_hackathon_sessions_autobe_hackathon_id_fkey" FOREIGN KEY ("autobe_hackathon_id") REFERENCES "wrtnlabs"."autobe_hackathons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_sessions" ADD CONSTRAINT "autobe_hackathon_sessions_autobe_hackathon_participant_id_fkey" FOREIGN KEY ("autobe_hackathon_participant_id") REFERENCES "wrtnlabs"."autobe_hackathon_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_session_connections" ADD CONSTRAINT "autobe_hackathon_session_connections_autobe_hackathon_sess_fkey" FOREIGN KEY ("autobe_hackathon_session_id") REFERENCES "wrtnlabs"."autobe_hackathon_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_session_histories" ADD CONSTRAINT "autobe_hackathon_session_histories_session_fkey" FOREIGN KEY ("autobe_hackathon_session_id") REFERENCES "wrtnlabs"."autobe_hackathon_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_session_histories" ADD CONSTRAINT "autobe_hackathon_session_histories_connection_fkey" FOREIGN KEY ("autobe_hackathon_session_connection_id") REFERENCES "wrtnlabs"."autobe_hackathon_session_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_session_events" ADD CONSTRAINT "autobe_hackathon_session_events_autobe_hackathon_session_i_fkey" FOREIGN KEY ("autobe_hackathon_session_id") REFERENCES "wrtnlabs"."autobe_hackathon_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_session_events" ADD CONSTRAINT "autobe_hackathon_session_events_autobe_hackathon_session_c_fkey" FOREIGN KEY ("autobe_hackathon_session_connection_id") REFERENCES "wrtnlabs"."autobe_hackathon_session_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wrtnlabs"."autobe_hackathon_session_aggregates" ADD CONSTRAINT "autobe_hackathon_session_aggregates_autobe_hackathon_sessi_fkey" FOREIGN KEY ("autobe_hackathon_session_id") REFERENCES "wrtnlabs"."autobe_hackathon_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
