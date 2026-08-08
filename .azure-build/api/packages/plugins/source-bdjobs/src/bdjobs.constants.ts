export const BDJOBS_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  Connection: 'keep-alive',
  Referer: 'https://jobs.bdjobs.com/',
  'Cache-Control': 'max-age=0',
};

export const BDJOBS_SEARCH_PARAMS: Record<string, string> = {
  hidJobSearch: 'jobsearch',
};

export const BDJOBS_JOB_SELECTORS = [
  'div.job-item',
  'div.sout-jobs-wrapper',
  'div.norm-jobs-wrapper',
  'div.featured-wrap',
];

export const BDJOBS_DATE_FORMATS = [
  'dd MMM yyyy',
  'dd-MMM-yyyy',
  'dd MMMM yyyy',
  'MMMM dd, yyyy',
  'dd/MM/yyyy',
];
