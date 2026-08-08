import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { IScraper, Site } from '@ever-jobs/models';
import { SOURCE_PLUGIN_METADATA } from '../decorators/source-plugin.decorator';
import { IPluginMetadata } from '../interfaces/plugin-metadata.interface';
import { PluginRegistry } from '../registry/plugin-registry.service';
import { readDisabledSources } from '../config/disabled-sources';

/**
 * Automatically discovers all NestJS providers decorated with @SourcePlugin()
 * and registers them into the PluginRegistry.
 *
 * Sites listed in EVER_JOBS_DISABLED_SOURCES are skipped at registration time
 * (see Spec 001 §FR-6).
 *
 * Runs at bootstrap (OnModuleInit) after all modules are loaded, ensuring every
 * source plugin is available before the first request.
 */
@Injectable()
export class PluginDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(PluginDiscoveryService.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly registry: PluginRegistry,
  ) {}

  onModuleInit() {
    this.discoverPlugins();
  }

  private discoverPlugins(): void {
    const providers = this.discovery.getProviders();
    const disabled = readDisabledSources();
    const seenDisabledHits = new Set<Site>();

    let discovered = 0;
    let skipped = 0;

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || !wrapper.metatype) continue;

      const metadata = this.reflector.get<IPluginMetadata>(
        SOURCE_PLUGIN_METADATA,
        wrapper.metatype,
      );

      if (!metadata) continue;

      // Validate that the instance implements IScraper
      const scraper = instance as IScraper;
      if (typeof scraper.scrape !== 'function') {
        this.logger.warn(
          `Plugin ${metadata.name} (${metadata.site}) is decorated with @SourcePlugin() but does not implement IScraper.scrape()`,
        );
        continue;
      }

      if (disabled.has(metadata.site)) {
        seenDisabledHits.add(metadata.site);
        skipped++;
        this.logger.log(
          `Skipping disabled plugin: ${metadata.name} (${metadata.site}) — listed in EVER_JOBS_DISABLED_SOURCES`,
        );
        continue;
      }

      this.registry.register(metadata, scraper);
      discovered++;
    }

    // Warn about typo'd ids — entries in the env var that didn't match any plugin.
    for (const id of disabled) {
      if (!seenDisabledHits.has(id)) {
        this.logger.warn(
          `EVER_JOBS_DISABLED_SOURCES references unknown site '${id}' — typo? (no plugin matched)`,
        );
      }
    }

    if (skipped > 0) {
      this.logger.log(
        `Discovered and registered ${discovered} source plugins (${skipped} disabled via env)`,
      );
    } else {
      this.logger.log(`Discovered and registered ${discovered} source plugins`);
    }
  }
}
