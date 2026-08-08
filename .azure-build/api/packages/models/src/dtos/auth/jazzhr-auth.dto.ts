import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * JazzHR API credentials.
 *
 * When provided, the JazzHR scraper will use the authenticated REST API
 * instead of HTML scraping, providing structured JSON job data.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.jazzhr`
 * or configured globally via environment variables.
 *
 * @see https://www.jazzhr.com/api/
 */
export class JazzHRAuthDto {
  @ApiPropertyOptional({ description: 'JazzHR API key (overrides JAZZHR_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  constructor(partial?: Partial<JazzHRAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
