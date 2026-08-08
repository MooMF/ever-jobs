import { Site } from '@ever-jobs/models';

/**
 * Metadata describing a source plugin.
 * Attached via the @SourcePlugin() decorator.
 */
export interface IPluginMetadata {
  /** The Site enum value this plugin handles */
  site: Site;

  /** Human-readable name for display and logging */
  name: string;

  /**
   * Category of the source plugin.
   * Used for filtering, grouping, and documentation.
   */
  category: PluginCategory;

  /**
   * Whether this is an ATS (Applicant Tracking System) source
   * that requires a companySlug to target a specific company board.
   * @default false
   */
  isAts?: boolean;

  /**
   * Optional description of the plugin's capabilities or limitations.
   */
  description?: string;
}

export type PluginCategory =
  | 'job-board'
  | 'ats'
  | 'company'
  | 'niche'
  | 'government'
  | 'remote'
  | 'regional'
  | 'freelance';
