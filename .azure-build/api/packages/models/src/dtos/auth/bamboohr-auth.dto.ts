import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * BambooHR API credentials.
 *
 * When provided, the BambooHR scraper will use the authenticated REST API
 * which provides structured JSON data with full descriptions,
 * compensation info, and access to all job openings.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.bamboohr`
 * or configured globally via environment variables.
 *
 * @see https://documentation.bamboohr.com/reference/get-job-summaries
 */
export class BambooHRAuthDto {
  @ApiPropertyOptional({ description: 'BambooHR API key (overrides BAMBOOHR_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  constructor(partial?: Partial<BambooHRAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
