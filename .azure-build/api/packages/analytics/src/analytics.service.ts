import { Injectable } from '@nestjs/common';
import {
  JobPostDto, JobSummaryDto, CompanyInsightDto,
  SiteComparisonDto, JobAnalysisDto,
} from '@ever-jobs/models';

/**
 * Analytics service providing reusable job analysis functions.
 * Used by both CLI and API for post-scrape intelligence.
 */
@Injectable()
export class AnalyticsService {

  /**
   * Generate a full analysis of scraped jobs:
   * summary stats, company intelligence, and site comparison.
   */
  analyze(jobs: JobPostDto[]): JobAnalysisDto {
    return new JobAnalysisDto({
      summary: this.summarize(jobs),
      companies: this.analyzeCompanies(jobs),
      siteComparison: this.compareSites(jobs),
    });
  }

  /**
   * Compute summary statistics: totals, salary range, breakdowns by site/type/location.
   */
  summarize(jobs: JobPostDto[]): JobSummaryDto {
    const remoteCount = jobs.filter((j) => j.isRemote).length;
    const withSalary = jobs.filter((j) => j.compensation?.minAmount);

    // Salary stats
    let salaryStats: JobSummaryDto['salaryStats'] = null;
    if (withSalary.length > 0) {
      const amounts = withSalary.map((j) => j.compensation!.minAmount!);
      const maxAmounts = withSalary
        .map((j) => j.compensation!.maxAmount ?? j.compensation!.minAmount!)
        .filter((a) => a != null);

      salaryStats = {
        minSalary: Math.min(...amounts),
        maxSalary: Math.max(...maxAmounts),
        avgSalary: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
        currency: withSalary[0].compensation?.currency ?? 'USD',
      };
    }

    // By-site breakdown
    const bySite: Record<string, number> = {};
    for (const job of jobs) {
      const site = job.site ?? 'unknown';
      bySite[site] = (bySite[site] ?? 0) + 1;
    }

    // By-jobType breakdown
    const byJobType: Record<string, number> = {};
    for (const job of jobs) {
      if (job.jobType) {
        for (const jt of job.jobType) {
          byJobType[jt] = (byJobType[jt] ?? 0) + 1;
        }
      }
    }

    // By-location breakdown (top cities)
    const byLocation: Record<string, number> = {};
    for (const job of jobs) {
      const loc = job.location;
      const key = loc?.city
        ? [loc.city, loc.state].filter(Boolean).join(', ')
        : (loc?.country ?? 'Unknown');
      byLocation[key] = (byLocation[key] ?? 0) + 1;
    }

    return new JobSummaryDto({
      totalJobs: jobs.length,
      remoteCount,
      remotePercentage: jobs.length > 0 ? Math.round((remoteCount / jobs.length) * 100) : 0,
      withSalaryCount: withSalary.length,
      salaryStats,
      bySite,
      byJobType,
      byLocation,
    });
  }

  /**
   * BD intelligence: group jobs by company, rank by hiring volume,
   * extract contact emails and locations.
   */
  analyzeCompanies(jobs: JobPostDto[]): CompanyInsightDto[] {
    const companies = new Map<string, {
      count: number;
      roles: string[];
      locations: Set<string>;
      emails: Set<string>;
      url?: string | null;
    }>();

    for (const job of jobs) {
      const name = job.companyName ?? 'Unknown';
      const existing = companies.get(name) ?? {
        count: 0,
        roles: [],
        locations: new Set<string>(),
        emails: new Set<string>(),
      };

      existing.count++;
      existing.roles.push(job.title);
      if (job.companyUrl) existing.url = job.companyUrl;

      const loc = job.location;
      if (loc?.city) {
        existing.locations.add([loc.city, loc.state].filter(Boolean).join(', '));
      }
      if (job.emails) {
        for (const e of job.emails) existing.emails.add(e);
      }

      companies.set(name, existing);
    }

    // Sort by hiring volume (most first)
    return [...companies.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => new CompanyInsightDto({
        companyName: name,
        openPositions: data.count,
        locations: [...data.locations],
        roles: data.roles,
        emails: [...data.emails],
        companyUrl: data.url,
      }));
  }

  /**
   * Per-site comparison: jobs, salary coverage, remote ratio, unique companies.
   */
  compareSites(jobs: JobPostDto[]): SiteComparisonDto[] {
    const sites = new Map<string, JobPostDto[]>();
    for (const job of jobs) {
      const site = job.site ?? 'unknown';
      const list = sites.get(site) ?? [];
      list.push(job);
      sites.set(site, list);
    }

    return [...sites.entries()].map(([site, siteJobs]) => new SiteComparisonDto({
      site,
      totalJobs: siteJobs.length,
      withSalary: siteJobs.filter((j) => j.compensation?.minAmount).length,
      remoteJobs: siteJobs.filter((j) => j.isRemote).length,
      uniqueCompanies: new Set(siteJobs.map((j) => j.companyName).filter(Boolean)).size,
    }));
  }
}
