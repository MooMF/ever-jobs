import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Lever Postings API credentials.
 *
 * When provided, the Lever scraper will use the authenticated API
 * which can return additional posting data and access private listings.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.lever`
 * or configured globally via environment variables.
 *
 * @see https://hire.lever.co/developer/documentation
 */
export class LeverAuthDto {
  @ApiPropertyOptional({ description: 'Lever API key (overrides LEVER_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  constructor(partial?: Partial<LeverAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
