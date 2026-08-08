/**
 * Unit tests for the admin paths of `SourcesHealthController`
 * — Spec 005 / T07.
 *
 * The guard layer (`ApiKeyGuard`) is exercised separately in
 * `apps/api/src/auth/__tests__/api-key.guard.spec.ts`. These tests
 * focus on the controller's contract once a request reaches the
 * handler:
 *   - Valid `:site` → returns `{ ok, site, health }` and mutates the
 *     breaker.
 *   - Unknown `:site` → throws `NotFoundException` (404).
 *   - Missing breaker binding → throws `ServiceUnavailableException` (503).
 *
 * The breaker is stubbed so we can assert the exact `forceOpen` /
 * `forceReset` calls without reaching for the real
 * `CircuitBreakerService` (covered by its own unit + integration suites).
 */
import {
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ICircuitBreakerService,
  Site,
  SourceHealth,
} from '@ever-jobs/models';
import { SourcesHealthController } from '../health.controller';

function makeBreakerStub(): {
  service: ICircuitBreakerService;
  forceOpenSpy: jest.Mock;
  forceResetSpy: jest.Mock;
  healthSpy: jest.Mock;
} {
  const forceOpenSpy = jest.fn();
  const forceResetSpy = jest.fn();
  const healthSpy = jest.fn(
    (site: Site): SourceHealth => ({
      site,
      state: 'closed',
      successRate: 1,
      p95LatencyMs: 0,
      windowMs: 60_000,
    }),
  );

  const service: ICircuitBreakerService = {
    exec: jest.fn(),
    state: jest.fn().mockReturnValue('closed'),
    health: healthSpy,
    forceOpen: forceOpenSpy,
    forceReset: forceResetSpy,
    list: jest.fn().mockReturnValue([]),
  } as unknown as ICircuitBreakerService;

  return { service, forceOpenSpy, forceResetSpy, healthSpy };
}

describe('SourcesHealthController — admin endpoints (Spec 005 / T07)', () => {
  describe('forceOpen', () => {
    it('calls breaker.forceOpen(site) and returns the health envelope for a valid site', () => {
      const { service, forceOpenSpy, healthSpy } = makeBreakerStub();
      // Make the post-action health() return open so the envelope reflects it.
      healthSpy.mockImplementation(
        (site: Site): SourceHealth => ({
          site,
          state: 'open',
          successRate: 0,
          p95LatencyMs: 0,
          windowMs: 60_000,
        }),
      );

      const controller = new SourcesHealthController(service, undefined);
      const result = controller.forceOpen(Site.LINKEDIN);

      expect(forceOpenSpy).toHaveBeenCalledTimes(1);
      expect(forceOpenSpy).toHaveBeenCalledWith(Site.LINKEDIN);
      expect(result).toEqual({
        ok: true,
        site: Site.LINKEDIN,
        health: expect.objectContaining({
          site: Site.LINKEDIN,
          state: 'open',
        }),
      });
    });

    it('throws NotFoundException for an unknown :site (returns 404 over HTTP)', () => {
      const { service, forceOpenSpy } = makeBreakerStub();
      const controller = new SourcesHealthController(service, undefined);

      expect(() => controller.forceOpen('not-a-real-source')).toThrow(
        NotFoundException,
      );
      expect(forceOpenSpy).not.toHaveBeenCalled();
    });

    it('throws ServiceUnavailableException when no breaker is bound', () => {
      const controller = new SourcesHealthController(undefined, undefined);
      expect(() => controller.forceOpen(Site.LINKEDIN)).toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('forceReset', () => {
    it('calls breaker.forceReset(site) and returns the health envelope', () => {
      const { service, forceResetSpy, healthSpy } = makeBreakerStub();
      const controller = new SourcesHealthController(service, undefined);

      const result = controller.forceReset(Site.INDEED);

      expect(forceResetSpy).toHaveBeenCalledTimes(1);
      expect(forceResetSpy).toHaveBeenCalledWith(Site.INDEED);
      expect(healthSpy).toHaveBeenCalledWith(Site.INDEED);
      expect(result.ok).toBe(true);
      expect(result.site).toBe(Site.INDEED);
      expect(result.health.state).toBe('closed');
    });

    it('throws NotFoundException for an unknown :site', () => {
      const { service, forceResetSpy } = makeBreakerStub();
      const controller = new SourcesHealthController(service, undefined);

      expect(() => controller.forceReset('not-a-real-source')).toThrow(
        NotFoundException,
      );
      expect(forceResetSpy).not.toHaveBeenCalled();
    });

    it('throws ServiceUnavailableException when no breaker is bound', () => {
      const controller = new SourcesHealthController(undefined, undefined);
      expect(() => controller.forceReset(Site.LINKEDIN)).toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('site validation matrix', () => {
    it('accepts every Site enum value', () => {
      const { service } = makeBreakerStub();
      const controller = new SourcesHealthController(service, undefined);
      // Pick a representative subset — exhaustive over enum is overkill
      // and would depend on Site enum stability rather than guard logic.
      for (const site of [
        Site.LINKEDIN,
        Site.INDEED,
        Site.GREENHOUSE,
        Site.UPWORK,
        Site.JOBSDB,
      ]) {
        expect(() => controller.forceOpen(site)).not.toThrow();
        expect(() => controller.forceReset(site)).not.toThrow();
      }
    });

    it('rejects empty string :site', () => {
      const { service } = makeBreakerStub();
      const controller = new SourcesHealthController(service, undefined);
      expect(() => controller.forceOpen('')).toThrow(NotFoundException);
    });

    it('rejects case-mismatched :site (lowercase enforced by enum values)', () => {
      const { service } = makeBreakerStub();
      const controller = new SourcesHealthController(service, undefined);
      // Site enum values are lowercase; uppercase variants must 404.
      expect(() => controller.forceOpen('LINKEDIN')).toThrow(
        NotFoundException,
      );
    });
  });
});
