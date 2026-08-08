import { Site } from '@ever-jobs/models';

/**
 * Name of the environment variable that controls which source plugins are
 * skipped at registration time. Comma-separated list of {@link Site} values
 * (case-insensitive, whitespace tolerant).
 *
 * @example
 *   EVER_JOBS_DISABLED_SOURCES=linkedin, indeed ,glassdoor
 */
export const DISABLED_SOURCES_ENV_VAR = 'EVER_JOBS_DISABLED_SOURCES';

/**
 * Parse the disabled-sources env-var into a normalised, frozen `Set<Site>`.
 *
 * - Trims surrounding whitespace.
 * - Lower-cases entries (matches the {@link Site} enum convention used by
 *   plugin metadata).
 * - Drops empty entries (handles dangling commas).
 * - Deduplicates.
 *
 * Returns an empty set if the variable is unset, empty, or contains only
 * whitespace.
 */
export function parseDisabledSources(rawValue: string | undefined): ReadonlySet<Site> {
  if (!rawValue) return new Set<Site>();

  const ids = rawValue
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  return new Set<Site>(ids as Site[]);
}

/**
 * Read the {@link DISABLED_SOURCES_ENV_VAR} from the given environment object
 * (defaulting to `process.env`) and return the parsed set.
 */
export function readDisabledSources(env: NodeJS.ProcessEnv = process.env): ReadonlySet<Site> {
  return parseDisabledSources(env[DISABLED_SOURCES_ENV_VAR]);
}
