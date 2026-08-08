import { Test } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { Site, IScraper, ScraperInputDto, JobResponseDto } from '@ever-jobs/models';
import {
  DISABLED_SOURCES_ENV_VAR,
  PluginModule,
  PluginRegistry,
  SourcePlugin,
} from '@ever-jobs/plugin';

@SourcePlugin({ site: Site.LINKEDIN, name: 'LinkedIn (test)', category: 'job-board' })
@Injectable()
class FakeLinkedinService implements IScraper {
  async scrape(_input: ScraperInputDto): Promise<JobResponseDto> {
    return { jobs: [], totalResults: 0, returnedResults: 0 } as unknown as JobResponseDto;
  }
}

@SourcePlugin({ site: Site.INDEED, name: 'Indeed (test)', category: 'job-board' })
@Injectable()
class FakeIndeedService implements IScraper {
  async scrape(_input: ScraperInputDto): Promise<JobResponseDto> {
    return { jobs: [], totalResults: 0, returnedResults: 0 } as unknown as JobResponseDto;
  }
}

@SourcePlugin({ site: Site.GLASSDOOR, name: 'Glassdoor (test)', category: 'job-board' })
@Injectable()
class FakeGlassdoorService implements IScraper {
  async scrape(_input: ScraperInputDto): Promise<JobResponseDto> {
    return { jobs: [], totalResults: 0, returnedResults: 0 } as unknown as JobResponseDto;
  }
}

async function bootstrapWithEnv(envValue: string | undefined): Promise<PluginRegistry> {
  const original = process.env[DISABLED_SOURCES_ENV_VAR];
  if (envValue === undefined) {
    delete process.env[DISABLED_SOURCES_ENV_VAR];
  } else {
    process.env[DISABLED_SOURCES_ENV_VAR] = envValue;
  }

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [PluginModule],
      providers: [FakeLinkedinService, FakeIndeedService, FakeGlassdoorService],
    }).compile();

    await moduleRef.init();
    return moduleRef.get(PluginRegistry);
  } finally {
    if (original === undefined) delete process.env[DISABLED_SOURCES_ENV_VAR];
    else process.env[DISABLED_SOURCES_ENV_VAR] = original;
  }
}

describe('PluginDiscoveryService — EVER_JOBS_DISABLED_SOURCES', () => {
  it('registers all plugins when env var is unset', async () => {
    const registry = await bootstrapWithEnv(undefined);
    expect(registry.has(Site.LINKEDIN)).toBe(true);
    expect(registry.has(Site.INDEED)).toBe(true);
    expect(registry.has(Site.GLASSDOOR)).toBe(true);
    expect(registry.size).toBeGreaterThanOrEqual(3);
  });

  it('skips a single disabled site', async () => {
    const registry = await bootstrapWithEnv('linkedin');
    expect(registry.has(Site.LINKEDIN)).toBe(false);
    expect(registry.getScraper(Site.LINKEDIN)).toBeUndefined();
    expect(registry.has(Site.INDEED)).toBe(true);
    expect(registry.has(Site.GLASSDOOR)).toBe(true);
  });

  it('skips multiple disabled sites with whitespace tolerance', async () => {
    const registry = await bootstrapWithEnv(' linkedin , indeed ');
    expect(registry.has(Site.LINKEDIN)).toBe(false);
    expect(registry.has(Site.INDEED)).toBe(false);
    expect(registry.has(Site.GLASSDOOR)).toBe(true);
  });

  it('honours case-insensitive matching', async () => {
    const registry = await bootstrapWithEnv('LinkedIn');
    expect(registry.has(Site.LINKEDIN)).toBe(false);
    expect(registry.has(Site.INDEED)).toBe(true);
  });

  it('disabled sites are absent from listSources()', async () => {
    const registry = await bootstrapWithEnv('linkedin,indeed');
    const sourceKeys = registry.listSources().map((m) => m.site);
    expect(sourceKeys).not.toContain(Site.LINKEDIN);
    expect(sourceKeys).not.toContain(Site.INDEED);
    expect(sourceKeys).toContain(Site.GLASSDOOR);
  });

  it('does not throw on unknown ids (logs a warning)', async () => {
    const registry = await bootstrapWithEnv('totally-not-a-site,linkedin');
    // Real plugin still skipped
    expect(registry.has(Site.LINKEDIN)).toBe(false);
    // Bogus id silently dropped (warning was logged)
    expect(registry.has(Site.INDEED)).toBe(true);
  });

  it('treats empty/whitespace env var as no-op', async () => {
    const registry = await bootstrapWithEnv('  , ,  ');
    expect(registry.has(Site.LINKEDIN)).toBe(true);
    expect(registry.has(Site.INDEED)).toBe(true);
    expect(registry.has(Site.GLASSDOOR)).toBe(true);
  });
});
