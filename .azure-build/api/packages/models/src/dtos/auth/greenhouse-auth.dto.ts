import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Greenhouse Harvest API credentials.
 *
 * When provided, the Greenhouse scraper will use the authenticated Harvest API
 * (`https://harvest.greenhouse.io/v1/...`) instead of the public job board API.
 * This provides richer data including internal fields, confidential jobs,
 * and full application details.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.greenhouse`
 * or configured globally via environment variables.
 *
 * @see https://developers.greenhouse.io/harvest.html
 */
export class GreenhouseAuthDto {
  @ApiPropertyOptional({ description: 'Greenhouse Harvest API key (overrides GREENHOUSE_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  constructor(partial?: Partial<GreenhouseAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
