export const NVIDIA_BASE_URL = 'https://nvidia.eightfold.ai';
export const NVIDIA_SEARCH_ENDPOINT = `${NVIDIA_BASE_URL}/api/pcsx/search`;

export const NVIDIA_HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0',
};

export const NVIDIA_PAGE_SIZE = 10;
export const NVIDIA_REQUEST_DELAY_MS = 500;
