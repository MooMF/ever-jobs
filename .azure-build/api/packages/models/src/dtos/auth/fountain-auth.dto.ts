import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Fountain API credentials.
 *
 * Fountain is a high-volume hourly hiring platform (300+ enterprise companies).
 * The API requires a Bearer token for authentication.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.fountain`
 * or configured globally via the FOUNTAIN_API_KEY environment variable.
 *
 * @see https://developer.fountain.com
 */
export class FountainAuthDto {
  @ApiPropertyOptional({ description: 'Fountain API key (overrides FOUNTAIN_API_KEY env var)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  constructor(partial?: Partial<FountainAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
