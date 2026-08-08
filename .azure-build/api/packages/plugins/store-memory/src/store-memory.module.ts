import { Module } from '@nestjs/common';
import { InMemoryJobStore } from './store-memory.service';

/**
 * NestJS module exporting the {@link InMemoryJobStore} class for use in
 * `StoreModule.forActive('memory', { backends: [InMemoryJobStore] })`
 * (Spec 004 / T05 / T06).
 *
 * The module deliberately does NOT bind the service under
 * `JOB_STORE_TOKEN` itself — that binding is `StoreModule.forActive`'s
 * responsibility, because the active backend is selected at bootstrap
 * by `EVER_JOBS_STORE` and may not be the in-memory one. Importing
 * this module without also importing `StoreModule.forActive(...)`
 * gives you the class as an injectable provider but does NOT make it
 * the active store.
 *
 * Most consumers don't need to import this module at all — they pass
 * the bare `InMemoryJobStore` class to `StoreModule.forActive` and let
 * the dynamic module instantiate it. The wrapper module exists for
 * symmetry with the source-plugin convention (every plugin package
 * exports a NestJS `Module`) and for future feature additions
 * (lifecycle hooks, debug endpoints) that need a module-level seam.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     StoreModule.forActive(process.env.EVER_JOBS_STORE ?? 'memory', {
 *       backends: [InMemoryJobStore],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  providers: [InMemoryJobStore],
  exports: [InMemoryJobStore],
})
export class StoreMemoryModule {}
