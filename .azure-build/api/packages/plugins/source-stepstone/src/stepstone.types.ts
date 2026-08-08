/**
 * TypeScript interfaces for StepStone job data.
 *
 * TODO: Validate against live StepStone rendered DOM
 */

export interface StepStoneJobCard {
  title: string;
  url: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  postedDate: string | null;
}

/** JSON-LD structured data found on StepStone job detail pages */
export interface StepStoneJsonLd {
  '@type': 'JobPosting';
  title: string;
  hiringOrganization?: {
    name: string;
  };
  jobLocation?: {
    address?: {
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
    };
  };
  baseSalary?: {
    currency?: string;
    value?: {
      minValue?: number;
      maxValue?: number;
    };
  };
  datePosted?: string;
  employmentType?: string;
  description?: string;
}
