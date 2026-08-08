import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * SmartRecruiters API credentials.
 *
 * When provided, the SmartRecruiters scraper will use the authenticated API
 * which can access private postings and provide richer job data
 * including full descriptions and application details.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.smartrecruiters`
 * or configured globally via environment variables.
 *
 * @see https://dev.smartrecruiters.com/customer-api/live-docs/
 */
export class SmartRecruitersAuthDto {
  @ApiPropertyOptional({ description: 'SmartRecruiters API key (overrides SMARTRECRUITERS_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  constructor(partial?: Partial<SmartRecruitersAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
