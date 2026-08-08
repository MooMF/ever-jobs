/**
 * E2E tests for health/ping endpoints.
 *
 * These tests are fast and deterministic — they do NOT hit any live
 * job-board APIs. Safe to require-pass in CI.
 */
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-app';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('Health Endpoints (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return healthy status with expected shape', async () => {
      const res = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(res.body.status).toBe('healthy');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.version).toBeDefined();
      expect(res.body.environment).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.memoryUsage).toBeDefined();
      expect(res.body.memoryUsage.rss).toBeDefined();
      expect(res.body.memoryUsage.heapUsed).toBeDefined();
      expect(res.body.memoryUsage.heapTotal).toBeDefined();
    });
  });

  describe('GET /ping', () => {
    it('should return pong', async () => {
      const res = await request(app.getHttpServer())
        .get('/ping')
        .expect(200);

      expect(res.body.status).toBe('pong');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
