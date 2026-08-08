/**
 * E2E tests for POST /api/jobs/analyze.
 *
 * Tests the analysis endpoint which returns summary statistics,
 * company insights, and per-site comparison.
 *
 * Uses "google" as the test source — free, no API key, fast.
 */
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-app';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('POST /api/jobs/analyze (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return analysis with summary, companies, and siteComparison', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/analyze')
      .send({
        searchTerm: 'software engineer',
        siteType: ['google'],
        resultsWanted: 5,
      })
      .expect(201);

    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('companies');
    expect(res.body).toHaveProperty('siteComparison');

    // Summary shape
    expect(res.body.summary).toHaveProperty('totalJobs');
    expect(typeof res.body.summary.totalJobs).toBe('number');
    expect(res.body.summary).toHaveProperty('remoteCount');
    expect(res.body.summary).toHaveProperty('remotePercentage');
    expect(res.body.summary).toHaveProperty('withSalaryCount');
    expect(res.body.summary).toHaveProperty('bySite');

    // Companies & site comparison are arrays
    expect(Array.isArray(res.body.companies)).toBe(true);
    expect(Array.isArray(res.body.siteComparison)).toBe(true);

    // Site comparison entry shape (if results were found)
    if (res.body.siteComparison.length > 0) {
      const sc = res.body.siteComparison[0];
      expect(sc).toHaveProperty('site');
      expect(sc).toHaveProperty('totalJobs');
    }
  });
});
