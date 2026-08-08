import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import {
  IStoreMetadata,
  STORE_PLUGIN_METADATA_KEY as KEY_FROM_MODELS,
} from '@ever-jobs/models';
import {
  StorePlugin,
  STORE_PLUGIN_METADATA_KEY as KEY_FROM_PLUGIN,
} from '@ever-jobs/plugin';

/**
 * Spec 004 / T02 — `@StorePlugin()` decorator unit tests.
 *
 * The decorator is a thin `SetMetadata` wrapper. These cases lock the
 * wire surface so a future refactor cannot silently drop the
 * `STORE_PLUGIN_METADATA_KEY` re-export, swap to a different key
 * string, or wrap the metadata object in something the registry
 * (T03) won't recognise.
 */
describe('@StorePlugin() decorator (Spec 004 / T02)', () => {
  const reflector = new Reflector();

  it('re-exports STORE_PLUGIN_METADATA_KEY identical to @ever-jobs/models', () => {
    // Single source of truth — the key string lives in @ever-jobs/models
    // because both `IJobStore` (in models) and `StorePlugin` (in
    // plugin) reference it. If these ever drift, every backend's
    // registration silently breaks.
    expect(KEY_FROM_PLUGIN).toBe(KEY_FROM_MODELS);
    expect(KEY_FROM_PLUGIN).toBe('ever-jobs:store-plugin');
  });

  it('attaches metadata under STORE_PLUGIN_METADATA_KEY (id + description)', () => {
    const metadata: IStoreMetadata = {
      id: 'postgres',
      description: 'Postgres + Prisma',
    };

    @StorePlugin(metadata)
    class PostgresJobStoreStub {}

    const read = reflector.get<IStoreMetadata>(
      KEY_FROM_PLUGIN,
      PostgresJobStoreStub,
    );

    expect(read).toEqual(metadata);
    expect(read.id).toBe('postgres');
    expect(read.description).toBe('Postgres + Prisma');
  });

  it('accepts id-only metadata (description optional per IStoreMetadata)', () => {
    @StorePlugin({ id: 'memory' })
    class MemoryJobStoreStub {}

    const read = reflector.get<IStoreMetadata>(
      KEY_FROM_PLUGIN,
      MemoryJobStoreStub,
    );

    expect(read).toEqual({ id: 'memory' });
    expect(read.description).toBeUndefined();
  });

  it('round-trips via the same key string when read with raw Reflect.getMetadata', () => {
    @StorePlugin({ id: 'sqlite', description: 'SQLite + Drizzle' })
    class SqliteJobStoreStub {}

    // Reflector and Reflect.getMetadata MUST agree — the registry
    // uses Reflector, but consumers occasionally introspect via raw
    // Reflect.getMetadata (e.g. dev tooling that doesn't import Nest).
    const direct = Reflect.getMetadata(KEY_FROM_PLUGIN, SqliteJobStoreStub);
    expect(direct).toEqual({ id: 'sqlite', description: 'SQLite + Drizzle' });
  });

  it('returns undefined for an undecorated class', () => {
    class PlainClass {}

    const read = reflector.get<IStoreMetadata>(KEY_FROM_PLUGIN, PlainClass);
    expect(read).toBeUndefined();
  });

  it('is independent of @SourcePlugin() metadata (different keys)', () => {
    // Ensure a class decorated with @StorePlugin doesn't pick up
    // SOURCE_PLUGIN_METADATA, and vice-versa — the two reflection
    // surfaces must not overlap.
    @StorePlugin({ id: 'postgres' })
    class StoreOnly {}

    const sourceMetadata = Reflect.getMetadata(
      'SOURCE_PLUGIN_METADATA',
      StoreOnly,
    );
    expect(sourceMetadata).toBeUndefined();

    const storeMetadata = Reflect.getMetadata(KEY_FROM_PLUGIN, StoreOnly);
    expect(storeMetadata).toEqual({ id: 'postgres' });
  });

  it('preserves the underlying class identity (no proxy wrap)', () => {
    @StorePlugin({ id: 'postgres' })
    class PostgresJobStoreStub {
      readonly storeId = 'postgres';
    }

    // SetMetadata returns the same constructor — `new` must still
    // work and `instanceof` must hold. This pins us against future
    // contributors swapping in a proxy wrapper that breaks Nest DI.
    const instance = new PostgresJobStoreStub();
    expect(instance).toBeInstanceOf(PostgresJobStoreStub);
    expect(instance.storeId).toBe('postgres');
    expect(PostgresJobStoreStub.name).toBe('PostgresJobStoreStub');
  });

  it('allows two distinct classes to carry distinct metadata side by side', () => {
    @StorePlugin({ id: 'postgres', description: 'pg' })
    class A {}

    @StorePlugin({ id: 'sqlite', description: 'sq' })
    class B {}

    const a = reflector.get<IStoreMetadata>(KEY_FROM_PLUGIN, A);
    const b = reflector.get<IStoreMetadata>(KEY_FROM_PLUGIN, B);

    expect(a.id).toBe('postgres');
    expect(b.id).toBe('sqlite');
    // Belt-and-braces: ensure metadata isn't accidentally shared by
    // reference (e.g. attached on a shared prototype).
    expect(a).not.toBe(b);
  });
});
