export interface ReliefWebResponse {
  href: string;
  count: number;
  totalCount: number;
  data: ReliefWebJobEntry[];
}

export interface ReliefWebJobEntry {
  id: string;
  score: number;
  href: string;
  fields: ReliefWebJobFields;
}

export interface ReliefWebJobFields {
  title: string;
  body?: string;
  url?: string;
  source?: { name: string; shortname?: string; href?: string }[];
  date?: { created: string; closing?: string };
  country?: { name: string; iso3?: string }[];
  theme?: { name: string }[];
  type?: { name: string }[];
}
