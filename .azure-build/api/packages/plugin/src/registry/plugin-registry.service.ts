import { Injectable, Logger } from '@nestjs/common';
import { Site, IScraper } from '@ever-jobs/models';
import { IPluginMetadata } from '../interfaces/plugin-metadata.interface';

/**
 * Central registry holding all discovered source plugins.
 *
 * This singleton is populated by PluginDiscoveryService at bootstrap
 * and consumed by JobsService for dispatching scrape requests.
 */
@Injectable()
export class PluginRegistry {
  private readonly logger = new Logger(PluginRegistry.name);
  private readonly scraperMap = new Map<Site, IScraper>();
  private readonly metadataMap = new Map<Site, IPluginMetadata>();

  /**
   * Register a plugin with its metadata and scraper implementation.
   */
  register(meta: IPluginMetadata, scraper: IScraper): void {
    if (this.scraperMap.has(meta.site)) {
      this.logger.warn(
        `Overwriting existing scraper for site: ${meta.site} (${meta.name})`,
      );
    }
    this.scraperMap.set(meta.site, scraper);
    this.metadataMap.set(meta.site, meta);
  }

  /**
   * Get the scraper implementation for a given site.
   */
  getScraper(site: Site): IScraper | undefined {
    return this.scraperMap.get(site);
  }

  /**
   * Check if a scraper is registered for a given site.
   */
  has(site: Site): boolean {
    return this.scraperMap.has(site);
  }

  /**
   * Get metadata for a registered plugin.
   */
  getMetadata(site: Site): IPluginMetadata | undefined {
    return this.metadataMap.get(site);
  }

  /**
   * List metadata for all registered plugins.
   */
  listSources(): IPluginMetadata[] {
    return Array.from(this.metadataMap.values());
  }

  /**
   * List all registered site keys.
   */
  listSiteKeys(): Site[] {
    return Array.from(this.scraperMap.keys());
  }

  /**
   * List all ATS sites (those requiring companySlug).
   */
  listAtsSites(): Site[] {
    return this.listSources()
      .filter((m) => m.isAts)
      .map((m) => m.site);
  }

  /**
   * Get the total number of registered plugins.
   */
  get size(): number {
    return this.scraperMap.size;
  }

  /**
   * Dynamically register an external scraper (for community plugins).
   */
  registerExternal(site: string, scraper: IScraper, name?: string): void {
    const siteKey = site.toLowerCase() as Site;
    const meta: IPluginMetadata = {
      site: siteKey,
      name: name ?? site,
      category: 'niche',
    };
    this.register(meta, scraper);
    this.logger.log(`Registered external plugin: ${siteKey}`);
  }
}
