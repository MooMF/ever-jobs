/**
 * E2E test for the LinkedIn scraper.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInModule, LinkedInService } from '@ever-jobs/source-linkedin';
import { ScraperInputDto, Site, Country, DescriptionFormat } from '@ever-jobs/models';

describe('LinkedInService (E2E)', () => {
  let service: LinkedInService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LinkedInModule],
    }).compile();

    service = module.get<LinkedInService>(LinkedInService);
  });

  it('should return job results for a basic search', async () => {
    const input = new ScraperInputDto({
      siteType: [Site.LINKEDIN],
      searchTerm: 'data scientist',
      location: 'Remote',
      resultsWanted: 5,
      country: Country.USA,
      descriptionFormat: DescriptionFormat.MARKDOWN,
    });

    const response = await service.scrape(input);

    expect(response).toBeDefined();
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    if (response.jobs.length > 0) {
      const job = response.jobs[0];
      expect(job.title).toBeDefined();
      expect(typeof job.title).toBe('string');
    }
  });
});


describe('LinkedIn employment type parsing', () => {
  it('maps LinkedIn Full-time criteria to the canonical fulltime type', () => {
    const cheerio = require('cheerio');
    const { parseJobType } = require('../src/linkedin.utils');
    const { JobType } = require('@ever-jobs/models');
    const $ = cheerio.load(
      '<ul class="description__job-criteria-list"><li>' +
      '<h3 class="description__job-criteria-subheader">Employment type</h3>' +
      '<span class="description__job-criteria-text">Full-time</span>' +
      '</li></ul>',
    );
    const parsed = parseJobType($, $('.description__job-criteria-list'));
    expect(parsed).toEqual([JobType.FULL_TIME]);
    expect(parsed).not.toContain(JobType.CONTRACT);
  });
});
