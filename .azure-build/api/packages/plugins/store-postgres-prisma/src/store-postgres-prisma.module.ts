import { Module } from '@nestjs/common';
import { PostgresPrismaJobStore } from './store-postgres-prisma.service';

/**
 * NestJS module exporting {@link PostgresPrismaJobStore} for use in
 * `StoreModule.forActive('postgres', { backends: [PostgresPrismaJobStore] })`
 * (Spec 004 / Phase 4 / T10).
 *
 * Mirrors {@link import('@ever-jobs/store-sqlite-drizzle').StoreSqliteDrizzleModule}:
 * the module does NOT bind the service under `JOB_STORE_TOKEN` itself —
 * that binding is `StoreModule.forActive`'s responsibility. Importing
 * this module without `StoreModule.forActive(...)` gives you the class
 * as an injectable provider but does NOT make it the active store.
 *
 * The Prisma client itself is read by the service constructor via the
 * `STORE_POSTGRES_PRISMA_CONFIG` injection token. Production deployments
 * MUST bind a config provider in `apps/api`'s root module:
 *
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import {
 *   PostgresPrismaJobStore,
 *   STORE_POSTGRES_PRISMA_CONFIG,
 * } from '@ever-jobs/store-postgres-prisma';
 *
 * const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
 *
 * @Module({
 *   imports: [
 *     StoreModule.forActive(process.env.EVER_JOBS_STORE ?? 'postgres', {
 *       backends: [PostgresPrismaJobStore],
 *     }),
 *   ],
 *   providers: [
 *     { provide: STORE_POSTGRES_PRISMA_CONFIG, useValue: { client: prisma } },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * Why no in-module Prisma factory? Constructing the `PrismaClient` here
 * would force this package to runtime-import `@prisma/client`, which is
 * a code-gen artefact (created by `prisma generate`) — not present in
 * environments that haven't run the generator. Keeping the factory in
 * the consuming app's root module sidesteps that constraint and lets
 * test harnesses inject a structural fake (or a Testcontainers-backed
 * real client) via the same DI token.
 */
@Module({
  providers: [PostgresPrismaJobStore],
  exports: [PostgresPrismaJobStore],
})
export class StorePostgresPrismaModule {}
