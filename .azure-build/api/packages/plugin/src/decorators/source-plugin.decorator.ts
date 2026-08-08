import { SetMetadata } from '@nestjs/common';
import { IPluginMetadata } from '../interfaces/plugin-metadata.interface';

/**
 * Metadata key used internally to store/retrieve plugin metadata
 * from the NestJS Reflector.
 */
export const SOURCE_PLUGIN_METADATA = 'SOURCE_PLUGIN_METADATA';

/**
 * Class decorator that marks a service as a source plugin.
 *
 * This decorator attaches metadata (site, name, category, etc.)
 * to the class so that the PluginDiscoveryService can automatically
 * find and register it at bootstrap.
 *
 * @example
 * ```typescript
 * @SourcePlugin({
 *   site: Site.LINKEDIN,
 *   name: 'LinkedIn',
 *   category: 'job-board',
 * })
 * @Injectable()
 * export class LinkedInService implements IScraper {
 *   async scrape(input: ScraperInputDto): Promise<JobResponseDto> { ... }
 * }
 * ```
 */
export const SourcePlugin = (metadata: IPluginMetadata): ClassDecorator => {
  return SetMetadata(SOURCE_PLUGIN_METADATA, metadata);
};
