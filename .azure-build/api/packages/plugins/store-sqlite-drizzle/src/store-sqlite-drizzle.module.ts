import { Module } from '@nestjs/common';
import { SqliteDrizzleJobStore } from './store-sqlite-drizzle.service';

/**
 * NestJS module exporting {@link SqliteDrizzleJobStore} for use in
 * `StoreModule.forActive('sqlite', { backends: [SqliteDrizzleJobStore] })`
 * (Spec 004 / T07 / T08).
 *
 * Mirrors {@link import('@ever-jobs/store-memory').StoreMemoryModule}:
 * the module does NOT bind the service under `JOB_STORE_TOKEN` itself —
 * that binding is `StoreModule.forActive`'s responsibility. Importing
 * this module without `StoreModule.forActive(...)` gives you the class
 * as an injectable provider but does NOT make it the active store.
 *
 * The `databaseUrl` is read by the service constructor; pass it via a
 * config provider in `apps/api`. The dev-default is `:memory:`, suitable
 * only for tests — production deployments MUST set
 * `EVER_JOBS_SQLITE_PATH=/var/lib/ever-jobs/jobs.db` or equivalent.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     StoreModule.forActive(process.env.EVER_JOBS_STORE ?? 'sqlite', {
 *       backends: [SqliteDrizzleJobStore],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  providers: [SqliteDrizzleJobStore],
  exports: [SqliteDrizzleJobStore],
})
export class StoreSqliteDrizzleModule {}
