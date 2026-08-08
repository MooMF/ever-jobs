/**
 * TypeScript interfaces for the JobAdder hosted Careerpage.
 *
 * JobAdder's Careerpage is server-rendered HTML (no JSON envelope), so the
 * "wire shape" here is the intermediate record we extract from each listing
 * card and (optionally) enrich from the job-detail page. Field names mirror the
 * real markup observed on `clientapps.jobadder.com` (verified 2026-06-03):
 *
 *   <div class="job_items">
 *     <h2><a href="/{accountId}/{slug}/{jobId}/{titleSlug}" class="viewjob">{title}</a></h2>
 *     <h3><sub>{datePosted}</sub></h3>
 *     <ul class="list"><li>{classification}</li>...<li>{location}</li><li>{employmentType}</li></ul>
 *     <p class="job_snippet">{snippet}</p>
 *   </div>
 *
 * The job-detail page repeats the title/date and carries the full description
 * inside a `description` container.
 */

/** A single open role parsed from a JobAdder Careerpage listing card. */
export interface JobAdderListing {
  /** Stable numeric job id taken from the detail-page path → used as the ATS id. */
  jobId: string;

  /** Absolute job-detail page URL. */
  jobUrl: string;

  /** The trailing `{titleSlug}` segment of the detail URL (kept for re-building URLs). */
  titleSlug?: string | null;

  /** Role title (anchor text of the listing card). */
  title: string;

  /** Free-text posted date as rendered (e.g. "20th May, 2026"). */
  datePostedText?: string | null;

  /**
   * Bullet-list items from the card. JobAdder mixes classifications, the
   * free-text location, and the employment type into this single `<ul>`; we
   * keep the raw list and classify entries heuristically downstream.
   */
  bulletItems: string[];

  /** Short teaser sentence from `<p class="job_snippet">`. */
  snippet?: string | null;

  /** Full description HTML, populated lazily from the detail page when fetched. */
  descriptionHtml?: string | null;
}

/** Resolved tenant coordinates for a JobAdder Careerpage. */
export interface JobAdderTenant {
  /** Numeric account id (the first path segment of a Careerpage URL). */
  accountId: string;
  /** Board slug (the second path segment of a Careerpage URL). */
  slug: string;
}
