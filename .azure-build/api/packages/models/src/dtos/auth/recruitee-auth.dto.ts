import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Recruitee API credentials.
 *
 * When provided, the Recruitee scraper will use the authenticated API
 * which provides access to full offer details including pipeline stages,
 * custom fields, and non-published offers.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.recruitee`
 * or configured globally via environment variables.
 *
 * @see https://docs.recruitee.com/reference/getting-started
 */
export class RecruiteeAuthDto {
  @ApiPropertyOptional({ description: 'Recruitee API token (overrides RECRUITEE_API_TOKEN env var)' })
  @IsOptional()
  @IsString()
  apiToken?: string;

  constructor(partial?: Partial<RecruiteeAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
