/**
 * Shape of a job object from the Functional Works GraphQL API.
 * Functional programming job board (Haskell, Clojure, Scala, Elixir, etc.).
 */
export interface FunctionalworksJob {
  title: string;
  company?: { name?: string };
  location?: { city?: string; country?: string };
  remote?: boolean;
  remuneration?: {
    timePeriod?: string;
    competitive?: boolean;
    currency?: string;
    min?: number;
    max?: number;
  };
  slug?: string;
  firstPublished?: string;
  descriptionHtml?: string;
  tags?: Array<{ label?: string }>;
}

export interface FunctionalworksGraphQLResponse {
  data?: {
    jobs?: FunctionalworksJob[];
  };
}
