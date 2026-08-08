/**
 * Wire shapes of the solid.jobs public offers API
 * (`GET /public-api/offers/{division}?campaign={campaign}`).
 * Polish job board with mandatory salary transparency.
 * Field set verified against a live payload on 2026-06-11.
 */

export interface SolidJobsSalary {
  from: number;
  to: number;
  currency: string; // "PLN" observed
  period: string; // "Month" observed
  employmentType: string; // "UoP" | "B2B" | "UZ" observed
}

export interface SolidJobsSkill {
  level: string;
  name: string;
}

export interface SolidJobsLanguage {
  level: string;
  name: string;
}

export interface SolidJobsOffer {
  jobOfferKey: string; // uuid
  title: string;
  division: string; // e.g. "IT"
  category: string; // e.g. "Developer"
  subCategory: string; // e.g. "Java"
  company: string;
  companyLogoUrl: string;
  salary: SolidJobsSalary | null;
  contractTime: string; // "full_time" | "part_time" observed
  locations: string[]; // city names
  benefits: string[];
  isRemote: boolean;
  isHybrid: boolean;
  url: string; // absolute offer URL
  experienceLevel: string; // e.g. "Regular"
  skills: SolidJobsSkill[];
  languages: SolidJobsLanguage[];
  description: string; // HTML
  validFrom?: string;
  validTo?: string;
  updatedAt?: string;
}

export interface SolidJobsResponse {
  jobs: SolidJobsOffer[];
}
