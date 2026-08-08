import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Personio Recruiting API credentials.
 *
 * When provided, the Personio scraper will use the authenticated
 * Recruiting API instead of the public XML feed.
 * This provides structured JSON with richer metadata.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.personio`
 * or configured globally via environment variables.
 *
 * @see https://developer.personio.de/reference/get_v1-recruiting-applications
 */
export class PersonioAuthDto {
  @ApiPropertyOptional({ description: 'Personio Client ID (overrides PERSONIO_CLIENT_ID env var)' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Personio Client Secret (overrides PERSONIO_CLIENT_SECRET env var)' })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  constructor(partial?: Partial<PersonioAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
