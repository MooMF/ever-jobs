import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Loxo API credentials.
 *
 * When provided, the Loxo scraper will include a Bearer token
 * for authenticated API access to private listings and richer data.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.loxo`
 * or configured globally via the LOXO_API_TOKEN environment variable.
 *
 * @see https://app.loxo.co/api
 */
export class LoxoAuthDto {
  @ApiPropertyOptional({ description: 'Loxo API token (overrides LOXO_API_TOKEN env var)' })
  @IsOptional()
  @IsString()
  apiToken?: string;

  constructor(partial?: Partial<LoxoAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
