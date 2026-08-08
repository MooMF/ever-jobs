import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Teamtailor API credentials.
 *
 * When provided, the Teamtailor scraper will use the authenticated API
 * which provides structured JSON:API data with relationships,
 * full descriptions, and access to additional job metadata.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.teamtailor`
 * or configured globally via environment variables.
 *
 * @see https://docs.teamtailor.com
 */
export class TeamtailorAuthDto {
  @ApiPropertyOptional({ description: 'Teamtailor API token (overrides TEAMTAILOR_API_TOKEN env var)' })
  @IsOptional()
  @IsString()
  apiToken?: string;

  constructor(partial?: Partial<TeamtailorAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
