import { Command, CommandRunner, Option } from 'nest-commander';
import * as fs from 'fs';
import { JobsService } from '../../../api/src/jobs/jobs.service';
import {
  ScraperInputDto, Site, Country,
  DescriptionFormat, JobType, SiteComparisonDto,
} from '@ever-jobs/models';
import { AnalyticsService } from '@ever-jobs/analytics';

interface CompareOptions {
  searchTerm?: string;
  location?: string;
  results?: number;
  country?: string;
  descriptionFormat?: string;
  hoursOld?: number;
  remote?: boolean;
  jobType?: string;
  rateDelayMin?: number;
  rateDelayMax?: number;
  format?: string;
  output?: string;
  verbose?: boolean;
}

@Command({
  name: 'compare',
  description: 'Search across all job boards individually and compare results side-by-side.',
})
export class CompareCommand extends CommandRunner {
  constructor(
    private readonly jobsService: JobsService,
    private readonly analyticsService: AnalyticsService,
  ) {
    super();
  }

  async run(_passedParams: string[], options: CompareOptions): Promise<void> {
    const searchTerm = options.searchTerm ?? 'software engineer';
    const sites = Object.values(Site);

    console.error(`Comparing "${searchTerm}" across ${sites.length} sites...\n`);

    // Build common input (minus siteType)
    const baseInput = new ScraperInputDto({
      searchTerm,
      location: options.location,
      resultsWanted: options.results ?? 15,
      country: options.country as Country | undefined,
      descriptionFormat: (options.descriptionFormat as DescriptionFormat) ?? DescriptionFormat.MARKDOWN,
      hoursOld: options.hoursOld,
      isRemote: options.remote ?? false,
      jobType: options.jobType as JobType | undefined,
      rateDelayMin: options.rateDelayMin,
      rateDelayMax: options.rateDelayMax,
    });

    // Scrape each site individually (sequentially to avoid rate-limiting)
    const allJobs = [];

    for (const site of sites) {
      process.stderr.write(`  ${site}... `);
      try {
        const input = new ScraperInputDto({
          ...baseInput,
          siteType: [site],
        });
        const jobs = await this.jobsService.searchJobs(input);
        console.error(`${jobs.length} jobs`);
        allJobs.push(...jobs);
      } catch (err: any) {
        console.error(`failed (${err.message})`);
      }
    }

    // Generate comparison
    const comparison = this.analyticsService.compareSites(allJobs);

    // Output comparison table
    console.error('');
    const header = ['Site', 'Total', 'With Salary', 'Remote', 'Unique Companies'];
    const rows: string[][] = comparison.map((c: SiteComparisonDto) => [
      c.site, String(c.totalJobs), String(c.withSalary),
      String(c.remoteJobs), String(c.uniqueCompanies),
    ]);

    // Calculate column widths
    const widths = header.map((h, i) =>
      Math.max(h.length, ...rows.map((r: string[]) => r[i].length)) + 2,
    );

    const printRow = (row: string[]) =>
      row.map((cell, i) => cell.padEnd(widths[i])).join('│ ');

    console.error(printRow(header));
    console.error(widths.map((w) => '─'.repeat(w)).join('┼─'));
    for (const row of rows) {
      console.error(printRow(row));
    }

    console.error(`\nTotal: ${allJobs.length} jobs from ${comparison.length} sites`);

    // Also output JSON to stdout
    const output = {
      searchTerm,
      totalJobs: allJobs.length,
      siteComparison: comparison,
      summary: this.analyticsService.summarize(allJobs),
    };

    const content = JSON.stringify(output, null, 2);
    if (options.output) {
      fs.writeFileSync(options.output, content, 'utf-8');
      console.error(`Results saved to ${options.output}`);
    } else {
      process.stdout.write(content + '\n');
    }
  }

  // ── Option Decorators ──

  @Option({ flags: '-q, --search-term <term>', description: 'Job search keywords' })
  parseSearchTerm(val: string): string { return val; }

  @Option({ flags: '-l, --location <location>', description: 'Location to search near' })
  parseLocation(val: string): string { return val; }

  @Option({ flags: '-n, --results <count>', description: 'Results per site (default: 15)' })
  parseResults(val: string): number { return parseInt(val, 10); }

  @Option({ flags: '-c, --country <code>', description: 'Country (default: USA)' })
  parseCountry(val: string): string { return val; }

  @Option({ flags: '--hours-old <hours>', description: 'Max job age in hours' })
  parseHoursOld(val: string): number { return parseInt(val, 10); }

  @Option({ flags: '-r, --remote', description: 'Remote jobs only' })
  parseRemote(): boolean { return true; }

  @Option({ flags: '--job-type <type>', description: 'Filter by job type' })
  parseJobType(val: string): string { return val; }

  @Option({ flags: '--rate-delay-min <seconds>', description: 'Min request delay (seconds)' })
  parseRateDelayMin(val: string): number { return parseFloat(val); }

  @Option({ flags: '--rate-delay-max <seconds>', description: 'Max request delay (seconds)' })
  parseRateDelayMax(val: string): number { return parseFloat(val); }

  @Option({ flags: '-o, --output <file>', description: 'Write output to file' })
  parseOutput(val: string): string { return val; }

  @Option({ flags: '-v, --verbose', description: 'Verbose output' })
  parseVerbose(): boolean { return true; }
}
