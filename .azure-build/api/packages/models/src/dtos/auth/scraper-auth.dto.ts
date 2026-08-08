import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpworkAuthDto } from './upwork-auth.dto';
import { UsajobsAuthDto } from './usajobs-auth.dto';
import { AdzunaAuthDto } from './adzuna-auth.dto';
import { ReedAuthDto } from './reed-auth.dto';
import { JoobleAuthDto } from './jooble-auth.dto';
import { CareerjetAuthDto } from './careerjet-auth.dto';
import { ExaAuthDto } from './exa-auth.dto';
import { GreenhouseAuthDto } from './greenhouse-auth.dto';
import { LeverAuthDto } from './lever-auth.dto';
import { AshbyAuthDto } from './ashby-auth.dto';
import { SmartRecruitersAuthDto } from './smartrecruiters-auth.dto';
import { WorkableAuthDto } from './workable-auth.dto';
import { TeamtailorAuthDto } from './teamtailor-auth.dto';
import { RecruiteeAuthDto } from './recruitee-auth.dto';
import { BambooHRAuthDto } from './bamboohr-auth.dto';
import { PersonioAuthDto } from './personio-auth.dto';
import { JazzHRAuthDto } from './jazzhr-auth.dto';
import { JobviteAuthDto } from './jobvite-auth.dto';
import { TrakstarAuthDto } from './trakstar-auth.dto';
import { DeelAuthDto } from './deel-auth.dto';
import { LoxoAuthDto } from './loxo-auth.dto';
import { FountainAuthDto } from './fountain-auth.dto';
import { BullhornAuthDto } from './bullhorn-auth.dto';

/**
 * Per-request authentication credentials for individual sources.
 *
 * When provided in `ScraperInputDto.auth`, these values override
 * the corresponding environment-variable configuration for that source.
 *
 * Each property is keyed by source name and is independently optional —
 * only include credentials for the source(s) you want to override.
 *
 * For ATS sources, providing auth credentials switches the scraper from
 * public board scraping to using the official authenticated API, which
 * typically returns richer data (full descriptions, compensation, etc.).
 */
export class ScraperAuthDto {
  // ─── Job Board Sources ──────────────────────────────────────────

  @ApiPropertyOptional({
    type: () => UpworkAuthDto,
    description: 'Upwork OAuth2 credentials (overrides UPWORK_* env vars)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpworkAuthDto)
  upwork?: UpworkAuthDto;

  @ApiPropertyOptional({
    type: () => UsajobsAuthDto,
    description: 'USAJobs API credentials (overrides USAJOBS_* env vars)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UsajobsAuthDto)
  usajobs?: UsajobsAuthDto;

  @ApiPropertyOptional({
    type: () => AdzunaAuthDto,
    description: 'Adzuna API credentials (overrides ADZUNA_* env vars)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdzunaAuthDto)
  adzuna?: AdzunaAuthDto;

  @ApiPropertyOptional({
    type: () => ReedAuthDto,
    description: 'Reed API credentials (overrides REED_API_KEY env var)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReedAuthDto)
  reed?: ReedAuthDto;

  @ApiPropertyOptional({
    type: () => JoobleAuthDto,
    description: 'Jooble API credentials (overrides JOOBLE_API_KEY env var)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => JoobleAuthDto)
  jooble?: JoobleAuthDto;

  @ApiPropertyOptional({
    type: () => CareerjetAuthDto,
    description: 'CareerJet API credentials (overrides CAREERJET_AFFID env var)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CareerjetAuthDto)
  careerjet?: CareerjetAuthDto;

  @ApiPropertyOptional({
    type: () => ExaAuthDto,
    description: 'Exa API credentials (overrides EXA_API_KEY env var)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExaAuthDto)
  exa?: ExaAuthDto;

  // ─── ATS Sources (official API auth) ────────────────────────────

  @ApiPropertyOptional({
    type: () => GreenhouseAuthDto,
    description: 'Greenhouse Harvest API key — switches to authenticated API with richer data',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GreenhouseAuthDto)
  greenhouse?: GreenhouseAuthDto;

  @ApiPropertyOptional({
    type: () => LeverAuthDto,
    description: 'Lever API key — switches to authenticated Postings API',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LeverAuthDto)
  lever?: LeverAuthDto;

  @ApiPropertyOptional({
    type: () => AshbyAuthDto,
    description: 'Ashby API key — switches to authenticated API with extended data',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AshbyAuthDto)
  ashby?: AshbyAuthDto;

  @ApiPropertyOptional({
    type: () => SmartRecruitersAuthDto,
    description: 'SmartRecruiters API key — enables access to private postings',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmartRecruitersAuthDto)
  smartrecruiters?: SmartRecruitersAuthDto;

  @ApiPropertyOptional({
    type: () => WorkableAuthDto,
    description: 'Workable API token + subdomain — switches to API v3 with full descriptions',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkableAuthDto)
  workable?: WorkableAuthDto;

  @ApiPropertyOptional({
    type: () => TeamtailorAuthDto,
    description: 'Teamtailor API token — switches to authenticated JSON:API',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TeamtailorAuthDto)
  teamtailor?: TeamtailorAuthDto;

  @ApiPropertyOptional({
    type: () => RecruiteeAuthDto,
    description: 'Recruitee API token — enables access to full offer details',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecruiteeAuthDto)
  recruitee?: RecruiteeAuthDto;

  @ApiPropertyOptional({
    type: () => BambooHRAuthDto,
    description: 'BambooHR API key — switches to authenticated REST API',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BambooHRAuthDto)
  bamboohr?: BambooHRAuthDto;

  @ApiPropertyOptional({
    type: () => PersonioAuthDto,
    description: 'Personio API credentials — switches to authenticated Recruiting API',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonioAuthDto)
  personio?: PersonioAuthDto;

  @ApiPropertyOptional({
    type: () => JazzHRAuthDto,
    description: 'JazzHR API key — switches from HTML scraping to REST API',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => JazzHRAuthDto)
  jazzhr?: JazzHRAuthDto;

  @ApiPropertyOptional({
    type: () => JobviteAuthDto,
    description: 'Jobvite API key + secret — switches to authenticated API',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => JobviteAuthDto)
  jobvite?: JobviteAuthDto;

  @ApiPropertyOptional({
    type: () => TrakstarAuthDto,
    description: 'Trakstar Hire API key — enables access to job openings via authenticated API',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TrakstarAuthDto)
  trakstar?: TrakstarAuthDto;

  @ApiPropertyOptional({
    type: () => DeelAuthDto,
    description: 'Deel ATS API token — enables access to job postings via authenticated API',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeelAuthDto)
  deel?: DeelAuthDto;

  @ApiPropertyOptional({
    type: () => LoxoAuthDto,
    description: 'Loxo API token — enables authenticated access to recruiting firm job boards',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoxoAuthDto)
  loxo?: LoxoAuthDto;

  @ApiPropertyOptional({
    type: () => FountainAuthDto,
    description: 'Fountain API key (Bearer token) — enables access to high-volume hourly hiring openings',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FountainAuthDto)
  fountain?: FountainAuthDto;

  @ApiPropertyOptional({
    type: () => BullhornAuthDto,
    description: 'Bullhorn corp token — overrides BULLHORN_CORP_TOKEN env var',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BullhornAuthDto)
  bullhorn?: BullhornAuthDto;

  // Future sources:
  // linkedin?: LinkedInAuthDto;

  constructor(partial?: Partial<ScraperAuthDto>) {
    if (partial) Object.assign(this, partial);
  }
}
