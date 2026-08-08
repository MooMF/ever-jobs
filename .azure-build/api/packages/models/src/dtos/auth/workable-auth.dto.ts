import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Workable API credentials.
 *
 * When provided, the Workable scraper will use the authenticated API v3
 * which provides full job descriptions, requirements, benefits,
 * and access to draft or internal postings.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.workable`
 * or configured globally via environment variables.
 *
 * @see https://workable.readme.io/reference/overview
 */
export class WorkableAuthDto {
  @ApiPropertyOptional({ description: 'Workable API access token (overrides WORKABLE_API_TOKEN env var)' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'Workable account subdomain (overrides WORKABLE_SUBDOMAIN env var)' })
  @IsOptional()
  @IsString()
  subdomain?: string;

  constructor(partial?: Partial<WorkableAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
