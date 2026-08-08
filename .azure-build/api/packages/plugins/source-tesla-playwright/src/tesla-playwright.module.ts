import { Module } from '@nestjs/common';
import { TeslaPlaywrightService } from './tesla-playwright.service';

/**
 * Spec 013 / T02 — `TeslaPlaywrightModule` (OPTIONAL companion plugin).
 *
 * Bundles `TeslaPlaywrightService` as a NestJS provider. **Important:**
 * this module is intentionally NOT included in `ALL_SOURCE_MODULES`
 * (per Spec 013 / Q-028 / FR-13). Operators wanting the Playwright
 * fallback for Tesla's Akamai-bypass path must:
 *
 * 1. `npm install playwright` (declared as a peer/optional dependency
 *    on this package's `package.json`).
 * 2. Import this module manually into their `JobsModule` configuration
 *    alongside `ALL_SOURCE_MODULES`.
 *
 * Behavioural logic (lazy `import('playwright')`; headless Chromium
 * launched with anti-automation flags mirroring the upstream Python;
 * navigation to `https://www.tesla.com/careers/search/`; in-page fetch
 * through the established session) lands in Spec 013 / T09. This
 * module ships with a stub `scrape()` returning an empty
 * `JobResponseDto`.
 */
@Module({
  providers: [TeslaPlaywrightService],
  exports: [TeslaPlaywrightService],
})
export class TeslaPlaywrightModule {}
