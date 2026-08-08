/**
 * Top-level response from the Arbeitsagentur Job Search API.
 */
export interface ArbeitsagenturResponse {
  stellenangebote: ArbeitsagenturJob[];
  maxErgebnisse: number;
  page: number;
}

/**
 * A single job (Stellenangebot) returned by the Arbeitsagentur API.
 */
export interface ArbeitsagenturJob {
  refnr: string;
  titel: string;
  arbeitgeber: string;
  beruf: string;
  arbeitsort: ArbeitsagenturArbeitsort;
  eintrittsdatum: string;
  aktuelleVeroeffentlichungsdatum: string;
  modifikationsTimestamp: string;
  uepiAnpiLogo: string;
  externeUrl: string;
  homeOffice: boolean;
}

/**
 * Workplace (Arbeitsort) details.
 */
export interface ArbeitsagenturArbeitsort {
  ort: string;
  plz: string;
  region: string;
  land: string;
  koordinaten: {
    lat: number;
    lon: number;
  };
}
