import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Bullhorn authentication credentials.
 * Provides optional corp token override for the Bullhorn REST API.
 */
export class BullhornAuthDto {
  @ApiPropertyOptional({
    description: 'Bullhorn corp token — overrides BULLHORN_CORP_TOKEN env var',
    example: 'abc123def456',
  })
  @IsOptional()
  @IsString()
  corpToken?: string;

  constructor(partial?: Partial<BullhornAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
