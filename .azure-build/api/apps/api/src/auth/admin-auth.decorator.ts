import { SetMetadata } from '@nestjs/common';

/**
 * Reflector key consumed by {@link ApiKeyGuard} to identify admin-tier
 * routes that must validate an API key regardless of the global
 * `auth.enabled` flag.
 *
 * Exported so unit tests can `Reflector.get(...)` against it without
 * importing the decorator (decorators don't compose with `getAllAndOverride`
 * the same way string keys do).
 */
export const ADMIN_AUTH_METADATA_KEY = 'ever-jobs:admin-auth';

/**
 * Marks a route handler (or controller class) as admin-tier — Spec 005 /
 * FR-7. Admin routes always require a valid API key, even when the global
 * `ENABLE_API_KEY_AUTH` flag is false; misconfigured deploys (`API_KEYS=[]`)
 * return 503 from the guard rather than silently allowing the request.
 *
 * Usage:
 *
 * ```ts
 * @Post(':site/circuit/open')
 * @AdminAuth()
 * forceOpen(@Param('site') site: string) { ... }
 * ```
 *
 * The decorator does not register a guard — `ApiKeyGuard` is the global
 * `APP_GUARD` and reads this metadata via `Reflector.getAllAndOverride()`.
 * That keeps the per-route declaration to a single line and lets the same
 * decorator work in any controller without re-wiring `@UseGuards()`.
 */
export const AdminAuth = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ADMIN_AUTH_METADATA_KEY, true);
