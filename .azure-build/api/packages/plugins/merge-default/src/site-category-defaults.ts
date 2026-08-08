import { Site } from '@ever-jobs/models';
import { MergeCategory } from './types';

/**
 * Default Site → {@link MergeCategory} lookup used by
 * {@link MergeDefaultService}. Mirrors the categorisation of each source
 * plugin's folder name under `packages/plugins/`:
 *
 *  - `source-ats-<x>`     → `'ats'`
 *  - `source-company-<x>` → `'company'`
 *  - government / regional / remote / niche / freelance fall out by name.
 *
 * Sites that this map does NOT cover fall back to
 * `MergeDefaultOptions.fallbackCategory` (default `'job-board'`).
 *
 * NOTE: the map is intentionally **explicit** rather than derived at
 * runtime from the plugin registry. The resolver runs on the dedup hot
 * path; we want a zero-IO lookup.
 */
const PAIRS: ReadonlyArray<readonly [Site, MergeCategory]> = [
  // ─── ATS (precedence tier #1) ───────────────────────────────────────
  [Site.ASHBY, 'ats'],
  [Site.GREENHOUSE, 'ats'],
  [Site.LEVER, 'ats'],
  [Site.WORKABLE, 'ats'],
  [Site.SMARTRECRUITERS, 'ats'],
  [Site.RIPPLING, 'ats'],
  [Site.WORKDAY, 'ats'],
  [Site.RECRUITEE, 'ats'],
  [Site.TEAMTAILOR, 'ats'],
  [Site.BAMBOOHR, 'ats'],
  [Site.PERSONIO, 'ats'],
  [Site.JAZZHR, 'ats'],
  [Site.ICIMS, 'ats'],
  [Site.TALEO, 'ats'],
  [Site.SUCCESSFACTORS, 'ats'],
  [Site.JOBVITE, 'ats'],
  [Site.ADP, 'ats'],
  [Site.UKG, 'ats'],
  [Site.BREEZYHR, 'ats'],
  [Site.COMEET, 'ats'],
  [Site.PINPOINT, 'ats'],
  [Site.MANATAL, 'ats'],
  [Site.PAYLOCITY, 'ats'],
  [Site.FRESHTEAM, 'ats'],
  [Site.BULLHORN, 'ats'],
  [Site.TRAKSTAR, 'ats'],
  [Site.HIRINGTHING, 'ats'],
  [Site.LOXO, 'ats'],
  [Site.FOUNTAIN, 'ats'],
  [Site.DEEL, 'ats'],
  [Site.PHENOM, 'ats'],
  [Site.JOBYLON, 'ats'],
  [Site.HOMERUN, 'ats'],
  [Site.JOBSCORE, 'ats'],
  [Site.TALENTLYFT, 'ats'],
  [Site.CRELATE, 'ats'],
  [Site.ISMARTRECRUIT, 'ats'],
  [Site.RECRUITERFLOW, 'ats'],

  // ─── Company-direct (precedence tier #2) ────────────────────────────
  [Site.AMAZON, 'company'],
  [Site.APPLE, 'company'],
  [Site.MICROSOFT, 'company'],
  [Site.NVIDIA, 'company'],
  [Site.TIKTOK, 'company'],
  [Site.UBER, 'company'],
  [Site.CURSOR, 'company'],
  [Site.GOOGLE_CAREERS, 'company'],
  [Site.META, 'company'],
  [Site.NETFLIX, 'company'],
  [Site.STRIPE, 'company'],
  [Site.OPENAI, 'company'],
  [Site.IBM, 'company'],
  [Site.BOEING, 'company'],
  [Site.ZOOM, 'company'],

  // ─── Government / public-sector (between board and remote) ──────────
  [Site.USAJOBS, 'government'],
  [Site.CAREERONESTOP, 'government'],
  [Site.ARBEITSAGENTUR, 'government'],
  [Site.NAVJOBS, 'government'],
  [Site.JOBTECHDEV, 'government'],
  [Site.FRANCETRAVAIL, 'government'],
  [Site.CANADAJOBBANK, 'government'],
  [Site.RELIEFWEB, 'government'],
  [Site.UNDPJOBS, 'government'],

  // ─── Regional boards (locale-bound general boards) ──────────────────
  [Site.STEPSTONE, 'regional'],
  [Site.SWISSDEVJOBS, 'regional'],
  [Site.GERMANTECHJOBS, 'regional'],
  [Site.EUROJOBS, 'regional'],
  [Site.JOBSCH, 'regional'],
  [Site.DUUNITORI, 'regional'],
  [Site.JOBINDEX, 'regional'],
  [Site.BERLINSTARTUPJOBS, 'regional'],
  [Site.JOBSACUK, 'regional'],
  [Site.GUARDIANJOBS, 'regional'],
  [Site.JOBSDB, 'regional'],
  [Site.JOBSTREET, 'regional'],
  [Site.MYCAREERSFUTURE, 'regional'],
  [Site.JOBSINJAPAN, 'regional'],
  [Site.BAYT, 'regional'],
  [Site.NAUKRI, 'regional'],
  [Site.BDJOBS, 'regional'],
  [Site.INTERNSHALA, 'regional'],
  [Site.INFOJOBS, 'regional'],
  [Site.GETONBOARD, 'regional'],
  [Site.HABRCAREER, 'regional'],
  [Site.HEADHUNTER, 'regional'],
  [Site.DJINNI, 'regional'],

  // ─── Remote-only boards ─────────────────────────────────────────────
  [Site.JOBICY, 'remote'],
  [Site.HIMALAYAS, 'remote'],
  [Site.REMOTEOK, 'remote'],
  [Site.REMOTIVE, 'remote'],
  [Site.ARBEITNOW, 'remote'],
  [Site.WEWORKREMOTELY, 'remote'],
  [Site.WORKINGNOMADS, 'remote'],
  [Site.FOURDAYWEEK, 'remote'],
  [Site.NODESK, 'remote'],
  [Site.REALWORKFROMANYWHERE, 'remote'],
  [Site.REMOTEFIRSTJOBS, 'remote'],
  [Site.VIRTUALVOCATIONS, 'remote'],
  [Site.NOFLUFFJOBS, 'remote'],

  // ─── Freelance / talent marketplaces ────────────────────────────────
  [Site.UPWORK, 'freelance'],
  [Site.FREELANCERCOM, 'freelance'],

  // ─── Niche / vertical boards ────────────────────────────────────────
  [Site.HACKERNEWS, 'niche'],
  [Site.LANDINGJOBS, 'niche'],
  [Site.FINDWORK, 'niche'],
  [Site.JOBDATAAPI, 'niche'],
  [Site.AUTHENTICJOBS, 'niche'],
  [Site.CRYPTOJOBSLIST, 'niche'],
  [Site.JOBSPRESSO, 'niche'],
  [Site.HIGHEREDJOBS, 'niche'],
  [Site.FOSSJOBS, 'niche'],
  [Site.LARAJOBS, 'niche'],
  [Site.PYTHONJOBS, 'niche'],
  [Site.DRUPALJOBS, 'niche'],
  [Site.GOLANGJOBS, 'niche'],
  [Site.WORDPRESSJOBS, 'niche'],
  [Site.TALROO, 'niche'],
  [Site.JOINRISE, 'niche'],
  [Site.DEVITJOBS, 'niche'],
  [Site.PYJOBS, 'niche'],
  [Site.VUEJOBS, 'niche'],
  [Site.CONSERVATIONJOBS, 'niche'],
  [Site.COROFLOT, 'niche'],
  [Site.RAILSJOBS, 'niche'],
  [Site.ELIXIRJOBS, 'niche'],
  [Site.CRUNCHBOARD, 'niche'],
  [Site.CRYPTOCURRENCYJOBS, 'niche'],
  [Site.HASJOB, 'niche'],
  [Site.GREENJOBSBOARD, 'niche'],
  [Site.OPENSOURCEDESIGNJOBS, 'niche'],
  [Site.ACADEMICCAREERS, 'niche'],
  [Site.ANDROIDJOBS, 'niche'],
  [Site.IOSDEVJOBS, 'niche'],
  [Site.DEVOPSJOBS, 'niche'],
  [Site.FUNCTIONALWORKS, 'niche'],
  [Site.POWERTOFLY, 'niche'],
  [Site.CLOJUREJOBS, 'niche'],
  [Site.ECOJOBS, 'niche'],
  [Site.ECHOJOBS, 'niche'],
  [Site.STARTUPJOBS, 'niche'],
  [Site.WEB3CAREER, 'niche'],
  [Site.BUILTIN, 'niche'],
  [Site.SNAGAJOB, 'niche'],
  [Site.DRIBBBLE, 'niche'],
  [Site.THEMUSE, 'niche'],
  [Site.WELLFOUND, 'niche'],
  [Site.DICE, 'niche'],
  [Site.ICRUNCHDATA, 'niche'],
  [Site.TECHCAREERS, 'niche'],

  // ─── General job boards (fallback tier) ─────────────────────────────
  [Site.LINKEDIN, 'job-board'],
  [Site.INDEED, 'job-board'],
  [Site.ZIP_RECRUITER, 'job-board'],
  [Site.GLASSDOOR, 'job-board'],
  [Site.GOOGLE, 'job-board'],
  [Site.SIMPLYHIRED, 'job-board'],
  [Site.MONSTER, 'job-board'],
  [Site.CAREERBUILDER, 'job-board'],
  [Site.ADZUNA, 'job-board'],
  [Site.REED, 'job-board'],
  [Site.JOOBLE, 'job-board'],
  [Site.CAREERJET, 'job-board'],
  [Site.EXA, 'job-board'],
];

/**
 * Frozen Site → MergeCategory map (~150 entries). Sites not present here
 * fall back to `'job-board'` per `MergeDefaultOptions.fallbackCategory`.
 */
export const SITE_CATEGORY_DEFAULTS: ReadonlyMap<Site, MergeCategory> = new Map(PAIRS);
