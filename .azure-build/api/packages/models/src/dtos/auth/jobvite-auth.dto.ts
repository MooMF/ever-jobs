import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Jobvite API credentials.
 *
 * When provided, the Jobvite scraper will use the authenticated API
 * which provides access to extended job data and private requisitions.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.jobvite`
 * or configured globally via environment variables.
 *
 * @see https://developer.jobvite.com
 */
export class JobviteAuthDto {
  @ApiPropertyOptional({ description: 'Jobvite API key (overrides JOBVITE_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Jobvite API secret (overrides JOBVITE_API_SECRET env var)' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  constructor(partial?: Partial<JobviteAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
