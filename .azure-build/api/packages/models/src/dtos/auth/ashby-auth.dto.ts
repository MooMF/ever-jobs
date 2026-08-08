import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Ashby API credentials.
 *
 * When provided, the Ashby scraper will use the authenticated API
 * which provides richer job data including compensation details,
 * custom fields, and access to unlisted postings.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.ashby`
 * or configured globally via environment variables.
 *
 * @see https://developers.ashbyhq.com
 */
export class AshbyAuthDto {
  @ApiPropertyOptional({ description: 'Ashby API key (overrides ASHBY_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  constructor(partial?: Partial<AshbyAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
