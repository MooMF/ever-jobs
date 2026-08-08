/**
 * Shape of a single job object returned by the 4DayWeek API.
 */
export interface FourDayWeekJob {
  id: string | number;
  title: string;
  company: string;
  company_logo?: string;
  url: string;
  description?: string;
  location?: string;
  category?: string;
  tags?: string[];
  published_at?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  is_remote?: boolean;
}
