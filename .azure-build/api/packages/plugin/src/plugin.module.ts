import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PluginRegistry } from './registry/plugin-registry.service';
import { PluginDiscoveryService } from './discovery/plugin-discovery.service';

/**
 * Global module that provides the plugin infrastructure.
 *
 * Import this module once in the root (or JobsModule) so that:
 * 1. PluginRegistry is available for injection everywhere
 * 2. PluginDiscoveryService runs at bootstrap to auto-register all @SourcePlugin() services
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [PluginModule, ...ALL_SOURCE_MODULES],
 * })
 * export class JobsModule {}
 * ```
 */
@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [PluginRegistry, PluginDiscoveryService],
  exports: [PluginRegistry],
})
export class PluginModule {}
