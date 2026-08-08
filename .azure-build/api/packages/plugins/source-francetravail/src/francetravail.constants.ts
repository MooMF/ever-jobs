export const FRANCETRAVAIL_API_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';
export const FRANCETRAVAIL_TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';
export const FRANCETRAVAIL_DEFAULT_RESULTS = 25;
export const FRANCETRAVAIL_MAX_RESULTS = 50;
export const FRANCETRAVAIL_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent': 'EverJobs/1.0',
};
