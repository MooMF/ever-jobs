import { LegitimacyDetectorService } from '../src/legitimacy-detector.service';
import type { LegitimacyInput } from '@ever-jobs/models';

const base: LegitimacyInput = {
  hasCompensation: false,
  sourceCount: 1,
  isFromAts: false,
  hasCompanyLogo: false,
  descriptionLength: 1000,
};

describe('LegitimacyDetectorService', () => {
  const svc = new LegitimacyDetectorService();

  it('verified when seen on 3+ independent sources', () => {
    expect(svc.assess({ ...base, sourceCount: 4 }).state).toBe('verified');
  });

  it('verified for an ATS posting with disclosed compensation', () => {
    expect(
      svc.assess({ ...base, isFromAts: true, hasCompensation: true }).state,
    ).toBe('verified');
  });

  it('uncertain when the apply URL redirects off-platform (overrides strong signals)', () => {
    expect(
      svc.assess({ ...base, sourceCount: 5, redirectsOffPlatform: true }).state,
    ).toBe('uncertain');
  });

  it('uncertain for a single-source posting with no comp and a thin description', () => {
    expect(
      svc.assess({
        hasCompensation: false,
        sourceCount: 1,
        isFromAts: false,
        hasCompanyLogo: false,
        descriptionLength: 50,
      }).state,
    ).toBe('uncertain');
  });

  it('likely for a single-source posting with compensation + substantive description', () => {
    const v = svc.assess({
      hasCompensation: true,
      sourceCount: 1,
      isFromAts: false,
      hasCompanyLogo: true,
      descriptionLength: 1200,
    });
    expect(v.state).toBe('likely');
    expect(v.reasons.length).toBeGreaterThan(0);
  });

  it('every verdict carries an ISO checkedAt and reasons array', () => {
    const v = svc.assess(base);
    expect(typeof v.checkedAt).toBe('string');
    expect(Array.isArray(v.reasons)).toBe(true);
  });

  it('assessBatch preserves order and length', () => {
    const out = svc.assessBatch([
      { ...base, sourceCount: 4 },
      { ...base, redirectsOffPlatform: true },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]!.state).toBe('verified');
    expect(out[1]!.state).toBe('uncertain');
  });
});
