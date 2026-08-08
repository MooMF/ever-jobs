export const ZOOM_BASE_URL = 'https://zoom.eightfold.ai';
export const ZOOM_SEARCH_ENDPOINT = `${ZOOM_BASE_URL}/api/pcsx/search`;

export const ZOOM_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0',
};

export const ZOOM_PAGE_SIZE = 10;
export const ZOOM_REQUEST_DELAY_MS = 500;
