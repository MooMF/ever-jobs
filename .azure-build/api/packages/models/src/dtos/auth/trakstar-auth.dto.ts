import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Trakstar Hire API credentials.
 *
 * When provided, the Trakstar scraper will use the API key for
 * Basic Auth to access the Trakstar Hire API.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.trakstar`
 * or configured globally via the TRAKSTAR_API_KEY environment variable.
 *
 * @see https://hire.trakstar.com/api
 */
export class TrakstarAuthDto {
  @ApiPropertyOptional({ description: 'Trakstar Hire API key (overrides TRAKSTAR_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  constructor(partial?: Partial<TrakstarAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
