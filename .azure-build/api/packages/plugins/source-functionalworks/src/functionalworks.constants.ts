export const FUNCTIONALWORKS_API_URL = 'https://functional.works-hub.com/api/graphql';
export const FUNCTIONALWORKS_DEFAULT_RESULTS = 20;

export const FUNCTIONALWORKS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
};

export const FUNCTIONALWORKS_QUERY = `{ jobs(page_size:20, vertical:"functional", published:true) { title company { name } location { city country } remote remuneration { timePeriod competitive currency min max } slug firstPublished descriptionHtml tags { label } } }`;
