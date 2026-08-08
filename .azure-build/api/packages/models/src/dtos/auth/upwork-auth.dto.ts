import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * OAuth2 grant types supported by the Upwork API.
 *
 * - `client_credentials` — server-to-server; requires only clientId + clientSecret.
 * - `authorization_code` — user-delegated; requires clientId, clientSecret, accessToken, refreshToken.
 *
 * When omitted the grant type is auto-detected:
 *   accessToken + refreshToken present → authorization_code
 *   otherwise → client_credentials
 */
export enum UpworkGrantType {
  CLIENT_CREDENTIALS = 'client_credentials',
  AUTHORIZATION_CODE = 'authorization_code',
}

/**
 * Upwork OAuth2 credentials.
 *
 * Can be supplied per-request via `ScraperInputDto.auth.upwork`
 * or configured globally via environment variables.
 */
export class UpworkAuthDto {
  @ApiPropertyOptional({
    enum: UpworkGrantType,
    description:
      'OAuth2 grant type. Auto-detected if omitted: ' +
      'authorization_code when accessToken is present, client_credentials otherwise.',
  })
  @IsOptional()
  @IsEnum(UpworkGrantType)
  grantType?: UpworkGrantType;

  @ApiPropertyOptional({ description: 'Upwork OAuth2 client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Upwork OAuth2 client secret' })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Pre-obtained OAuth2 access token (authorization_code flow only)' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'Pre-obtained OAuth2 refresh token (authorization_code flow only)' })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  constructor(partial?: Partial<UpworkAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
