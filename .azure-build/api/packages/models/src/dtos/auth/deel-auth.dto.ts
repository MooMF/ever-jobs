import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Deel ATS API credentials.
 *
 * When provided, the Deel scraper will use the authenticated REST API
 * to fetch job postings from the Deel ATS module.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.deel`
 * or configured globally via the DEEL_API_TOKEN environment variable.
 *
 * @see https://developer.letsdeel.com
 */
export class DeelAuthDto {
  @ApiPropertyOptional({ description: 'Deel API token (overrides DEEL_API_TOKEN env var)' })
  @IsOptional()
  @IsString()
  apiToken?: string;

  constructor(partial?: Partial<DeelAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
