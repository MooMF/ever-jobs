export interface NavJobsFeedResponse {
  version: string;
  title: string;
  items: NavJobsFeedItem[];
  next_url?: string;
}

export interface NavJobsFeedItem {
  id: string;
  url: string;
  title: string;
  date_modified: string;
  _feed_entry: {
    uuid: string;
    status: string;
    title: string;
    businessName: string | null;
    municipal: string | null;
    county?: string | null;
    description?: string | null;
    sourceurl?: string | null;
    applicationUrl?: string | null;
    published?: string | null;
    expires?: string | null;
  };
}
