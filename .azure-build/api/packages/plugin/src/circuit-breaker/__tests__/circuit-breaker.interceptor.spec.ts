import { ERR_SOURCE_CIRCUIT_OPEN, Site } from '@ever-jobs/models';
import { CircuitBreakerInterceptor } from '../circuit-breaker.interceptor';
import { CircuitBreakerService } from '../circuit-breaker.service';

describe('CircuitBreakerInterceptor', () => {
  let breaker: CircuitBreakerService;
  let interceptor: CircuitBreakerInterceptor;
  let now: number;

  beforeEach(() => {
    breaker = new CircuitBreakerService();
    now = 1_000_000;
    breaker.setClock(() => now);
    // Pass the concrete service as fallback (mirrors token DI in tests).
    interceptor = new CircuitBreakerInterceptor(breaker);
  });

  it('passes a closed-state call straight through', async () => {
    await expect(interceptor.wrap(Site.LINKEDIN, async () => 42)).resolves.toBe(42);
  });

  it('re-throws the underlying error from `fn`', async () => {
    await expect(
      interceptor.wrap(Site.LINKEDIN, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it('short-circuits with ERR_SOURCE_CIRCUIT_OPEN when the breaker is open', async () => {
    breaker.forceOpen(Site.LINKEDIN);
    const fn = jest.fn(async () => 'never-runs');
    await expect(interceptor.wrap(Site.LINKEDIN, fn)).rejects.toMatchObject({
      code: ERR_SOURCE_CIRCUIT_OPEN,
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('throws when no breaker is bound', () => {
    const orphan = new CircuitBreakerInterceptor();
    expect(() => orphan.wrap(Site.LINKEDIN, async () => 1)).toThrow(
      /no ICircuitBreakerService bound/,
    );
  });

  it('isolates failures per site (linkedin opens, indeed remains closed)', async () => {
    breaker.forceOpen(Site.LINKEDIN);
    const fn = jest.fn(async () => 'ok');
    await expect(interceptor.wrap(Site.LINKEDIN, fn)).rejects.toMatchObject({
      code: ERR_SOURCE_CIRCUIT_OPEN,
    });
    await expect(interceptor.wrap(Site.INDEED, fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
