/**
 * Shape of a single job object returned by the Startup.jobs API.
 */
export interface StartupJob {
  id: string | number;
  title: string;
  company_name?: string;
  company?: { name: string; logo?: string };
  url?: string;
  description?: string;
  location?: string;
  remote?: boolean;
  published_at?: string;
  created_at?: string;
  tags?: string[];
  category?: string;
}
