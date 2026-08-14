/**
 * Ever Jobs MCP Server — Tool implementations
 *
 * These functions connect to the Ever Jobs REST API (or can be used standalone)
 * to search for jobs across 166+ sources.
 */

import axios, { AxiosInstance } from 'axios';
import sourcePolicy from './source-policy.json';

// ── Configuration ──────────────────────────────────────────────────────

const API_URL = process.env.EVER_JOBS_API_URL ?? 'http://localhost:3001';

function getClient(): AxiosInstance {
  return axios.create({
    baseURL: API_URL,
    timeout: 150_000,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Types ──────────────────────────────────────────────────────────────

export interface JobSearchParams {
  query: string;
  location?: string;
  source?: string;
  sources?: string[];
  company?: string;
  limit?: number;
  remoteOnly?: boolean;
}

export interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  description: string | null;
  date_posted: string | null;
  is_remote: boolean;
  source: string;
  salary: string | null;
  department: string | null;
}

export interface SearchResponse {
  total: number;
  jobs: JobResult[];
  sources_searched: string[];
  query: string;
}

export interface JobDetailsResponse {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  description: string | null;
  full_description: string | null;
  date_posted: string | null;
  is_remote: boolean;
  source: string;
  salary: string | null;
  department: string | null;
  application_url: string | null;
}

export interface SourceInfo {
  name: string;
  id: string;
  type: 'job_board' | 'ats' | 'company' | 'remote' | 'aggregator';
  requires_company_slug: boolean;
  description: string;
}

// ── Source Catalog ──────────────────────────────────────────────────────

const SOURCES: SourceInfo[] = [
  // Job Boards
  { name: 'LinkedIn', id: 'linkedin', type: 'job_board', requires_company_slug: false, description: 'Largest professional job board' },
  { name: 'Indeed', id: 'indeed', type: 'job_board', requires_company_slug: false, description: 'Most popular general job search engine' },
  { name: 'Glassdoor', id: 'glassdoor', type: 'job_board', requires_company_slug: false, description: 'Job board with company reviews and salary data' },
  { name: 'ZipRecruiter', id: 'zip_recruiter', type: 'job_board', requires_company_slug: false, description: 'AI-powered job matching platform' },
  { name: 'Google Jobs', id: 'google', type: 'job_board', requires_company_slug: false, description: 'Google job search aggregator' },
  { name: 'Dice', id: 'dice', type: 'job_board', requires_company_slug: false, description: 'Technology-focused job board' },
  { name: 'SimplyHired', id: 'simplyhired', type: 'job_board', requires_company_slug: false, description: 'General job search engine' },
  { name: 'Monster', id: 'monster', type: 'job_board', requires_company_slug: false, description: 'One of the original job boards' },
  { name: 'CareerBuilder', id: 'careerbuilder', type: 'job_board', requires_company_slug: false, description: 'Large general job board' },
  { name: 'StepStone', id: 'stepstone', type: 'job_board', requires_company_slug: false, description: 'European job board' },
  { name: 'Wellfound', id: 'wellfound', type: 'job_board', requires_company_slug: false, description: 'Startup and tech company jobs (formerly AngelList Talent)' },
  { name: 'Bayt', id: 'bayt', type: 'job_board', requires_company_slug: false, description: 'Middle East and North Africa job board' },
  { name: 'Naukri', id: 'naukri', type: 'job_board', requires_company_slug: false, description: 'India\'s largest job board' },
  { name: 'BDJobs', id: 'bdjobs', type: 'job_board', requires_company_slug: false, description: 'Bangladesh job board' },
  { name: 'Internshala', id: 'internshala', type: 'job_board', requires_company_slug: false, description: 'Internships and entry-level jobs (India)' },
  { name: 'Upwork', id: 'upwork', type: 'job_board', requires_company_slug: false, description: 'Freelancing and contract work platform' },
  { name: 'USAJobs', id: 'usajobs', type: 'job_board', requires_company_slug: false, description: 'US federal government jobs' },
  { name: 'Exa', id: 'exa', type: 'job_board', requires_company_slug: false, description: 'AI-powered semantic job search' },

  // Remote Job Boards
  { name: 'RemoteOK', id: 'remoteok', type: 'remote', requires_company_slug: false, description: 'Remote-first job board' },
  { name: 'Remotive', id: 'remotive', type: 'remote', requires_company_slug: false, description: 'Remote jobs in tech' },
  { name: 'We Work Remotely', id: 'weworkremotely', type: 'remote', requires_company_slug: false, description: 'Largest remote work community' },
  { name: 'Jobicy', id: 'jobicy', type: 'remote', requires_company_slug: false, description: 'Remote jobs worldwide' },
  { name: 'Himalayas', id: 'himalayas', type: 'remote', requires_company_slug: false, description: 'Remote jobs with company profiles' },
  { name: 'Arbeitnow', id: 'arbeitnow', type: 'remote', requires_company_slug: false, description: 'Remote and visa-sponsored jobs' },

  // Aggregator APIs
  { name: 'Adzuna', id: 'adzuna', type: 'aggregator', requires_company_slug: false, description: 'Job search aggregator across multiple countries' },
  { name: 'Reed', id: 'reed', type: 'aggregator', requires_company_slug: false, description: 'UK job search aggregator' },
  { name: 'Jooble', id: 'jooble', type: 'aggregator', requires_company_slug: false, description: 'International job aggregator' },
  { name: 'CareerJet', id: 'careerjet', type: 'aggregator', requires_company_slug: false, description: 'Global job search engine' },

  // ATS Platforms
  { name: 'Ashby', id: 'ashby', type: 'ats', requires_company_slug: true, description: 'Modern ATS used by growing startups' },
  { name: 'Greenhouse', id: 'greenhouse', type: 'ats', requires_company_slug: true, description: 'Popular ATS for mid-to-large companies' },
  { name: 'Lever', id: 'lever', type: 'ats', requires_company_slug: true, description: 'Collaborative ATS platform' },
  { name: 'Workable', id: 'workable', type: 'ats', requires_company_slug: true, description: 'All-in-one hiring platform' },
  { name: 'SmartRecruiters', id: 'smartrecruiters', type: 'ats', requires_company_slug: true, description: 'Enterprise talent acquisition suite' },
  { name: 'Rippling', id: 'rippling', type: 'ats', requires_company_slug: true, description: 'HR platform with ATS' },
  { name: 'Workday', id: 'workday', type: 'ats', requires_company_slug: true, description: 'Enterprise HR and ATS' },
  { name: 'BambooHR', id: 'bamboohr', type: 'ats', requires_company_slug: true, description: 'SMB-focused HR with job board' },
  { name: 'Personio', id: 'personio', type: 'ats', requires_company_slug: true, description: 'European HR platform' },
  { name: 'JazzHR', id: 'jazzhr', type: 'ats', requires_company_slug: true, description: 'SMB recruiting software' },
  { name: 'Recruitee', id: 'recruitee', type: 'ats', requires_company_slug: true, description: 'Collaborative hiring for growing companies' },
  { name: 'Teamtailor', id: 'teamtailor', type: 'ats', requires_company_slug: true, description: 'Employer branding and ATS' },
  { name: 'iCIMS', id: 'icims', type: 'ats', requires_company_slug: true, description: 'Enterprise talent cloud' },
  { name: 'Taleo', id: 'taleo', type: 'ats', requires_company_slug: true, description: 'Oracle enterprise ATS' },
  { name: 'SuccessFactors', id: 'successfactors', type: 'ats', requires_company_slug: true, description: 'SAP enterprise HR' },
  { name: 'Jobvite', id: 'jobvite', type: 'ats', requires_company_slug: true, description: 'End-to-end recruiting platform' },
  { name: 'ADP', id: 'adp', type: 'ats', requires_company_slug: true, description: 'ADP workforce solutions' },
  { name: 'UKG', id: 'ukg', type: 'ats', requires_company_slug: true, description: 'UKG HR service delivery' },
  { name: 'Breezy HR', id: 'breezyhr', type: 'ats', requires_company_slug: true, description: 'Visual hiring pipeline ATS' },
  { name: 'Comeet', id: 'comeet', type: 'ats', requires_company_slug: true, description: 'Collaborative hiring platform' },
  { name: 'Pinpoint', id: 'pinpoint', type: 'ats', requires_company_slug: true, description: 'Smart recruiting software' },

  // Company Career Pages
  { name: 'Amazon', id: 'amazon', type: 'company', requires_company_slug: false, description: 'Amazon.jobs career page' },
  { name: 'Apple', id: 'apple', type: 'company', requires_company_slug: false, description: 'Apple Jobs career page' },
  { name: 'Microsoft', id: 'microsoft', type: 'company', requires_company_slug: false, description: 'Microsoft Careers' },
  { name: 'NVIDIA', id: 'nvidia', type: 'company', requires_company_slug: false, description: 'NVIDIA Careers' },
  { name: 'TikTok', id: 'tiktok', type: 'company', requires_company_slug: false, description: 'TikTok/ByteDance careers' },
  { name: 'Uber', id: 'uber', type: 'company', requires_company_slug: false, description: 'Uber Careers' },
  { name: 'Cursor', id: 'cursor', type: 'company', requires_company_slug: false, description: 'Cursor AI careers' },
  { name: 'Google Careers', id: 'google_careers', type: 'company', requires_company_slug: false, description: 'Google career page' },
  { name: 'Meta', id: 'meta', type: 'company', requires_company_slug: false, description: 'Meta Careers' },
  { name: 'Netflix', id: 'netflix', type: 'company', requires_company_slug: false, description: 'Netflix jobs' },
  { name: 'Stripe', id: 'stripe', type: 'company', requires_company_slug: false, description: 'Stripe careers' },
  { name: 'OpenAI', id: 'openai', type: 'company', requires_company_slug: false, description: 'OpenAI careers' },

  // Phase 7: Additional Job Boards
  { name: 'BuiltIn', id: 'builtin', type: 'job_board', requires_company_slug: false, description: 'Tech-focused job board for startups and tech companies' },
  { name: 'Snagajob', id: 'snagajob', type: 'job_board', requires_company_slug: false, description: 'Hourly and part-time job board' },
  { name: 'Dribbble Jobs', id: 'dribbble', type: 'job_board', requires_company_slug: false, description: 'Design-focused job board' },

  // Phase 8: ATS Expansion
  { name: 'Manatal', id: 'manatal', type: 'ats', requires_company_slug: true, description: 'ATS for 160K+ orgs (Asia-Pacific, global SMB)' },
  { name: 'Paylocity', id: 'paylocity', type: 'ats', requires_company_slug: true, description: 'US mid-market ATS (30K+ companies)' },
  { name: 'Freshteam', id: 'freshteam', type: 'ats', requires_company_slug: true, description: 'Freshworks HR platform with ATS' },
  { name: 'Bullhorn', id: 'bullhorn', type: 'ats', requires_company_slug: true, description: '#1 ATS for staffing agencies (10K+)' },
  { name: 'Trakstar Hire', id: 'trakstar', type: 'ats', requires_company_slug: true, description: 'Formerly RecruiterBox ATS' },
  { name: 'HiringThing', id: 'hiringthing', type: 'ats', requires_company_slug: true, description: 'White-label ATS platform' },
  { name: 'Loxo', id: 'loxo', type: 'ats', requires_company_slug: true, description: 'AI-powered recruiting platform' },
  { name: 'Fountain', id: 'fountain', type: 'ats', requires_company_slug: true, description: 'High-volume hourly hiring ATS' },
  { name: 'Deel', id: 'deel', type: 'ats', requires_company_slug: true, description: 'Global hiring/EOR platform with ATS' },
  { name: 'Phenom', id: 'phenom', type: 'ats', requires_company_slug: true, description: 'Enterprise talent experience platform (900+ enterprises)' },

  // Phase 8: Company Scrapers
  { name: 'IBM', id: 'ibm', type: 'company', requires_company_slug: false, description: 'IBM Careers' },
  { name: 'Boeing', id: 'boeing', type: 'company', requires_company_slug: false, description: 'Boeing careers (Phenom-powered)' },
  { name: 'Zoom', id: 'zoom', type: 'company', requires_company_slug: false, description: 'Zoom Video careers (Eightfold)' },

  // Phase 9: Job Board Expansion
  { name: 'The Muse', id: 'themuse', type: 'job_board', requires_company_slug: false, description: 'Career advice and curated job listings' },
  { name: 'Working Nomads', id: 'workingnomads', type: 'remote', requires_company_slug: false, description: 'Curated remote jobs worldwide' },
  { name: '4 Day Week', id: 'fourdayweek', type: 'job_board', requires_company_slug: false, description: '4-day work week job listings' },
  { name: 'Startup.jobs', id: 'startupjobs', type: 'job_board', requires_company_slug: false, description: 'Startup jobs worldwide' },
  { name: 'NoDesk', id: 'nodesk', type: 'remote', requires_company_slug: false, description: 'Remote and flexible jobs' },
  { name: 'Web3 Career', id: 'web3career', type: 'job_board', requires_company_slug: false, description: 'Web3/crypto/blockchain jobs' },
  { name: 'Echojobs', id: 'echojobs', type: 'job_board', requires_company_slug: false, description: 'Curated tech jobs from top companies' },
  { name: 'Jobstreet', id: 'jobstreet', type: 'job_board', requires_company_slug: false, description: 'Major Southeast Asian job board (SEEK)' },

  // Phase 10: Government Boards & ATS Expansion
  { name: 'CareerOneStop', id: 'careeronestop', type: 'job_board', requires_company_slug: false, description: 'US Dept of Labor job search (NLx)' },
  { name: 'Arbeitsagentur', id: 'arbeitsagentur', type: 'job_board', requires_company_slug: false, description: 'German Federal Employment Agency' },
  { name: 'Jobylon', id: 'jobylon', type: 'ats', requires_company_slug: true, description: 'Scandinavian ATS (Nordic companies)' },
  { name: 'Homerun', id: 'homerun', type: 'ats', requires_company_slug: true, description: 'European SMB ATS' },
  // Phase 11: Niche boards & developer API expansion
  { name: 'Hacker News', id: 'hackernews', type: 'job_board', requires_company_slug: false, description: 'YC startup job postings via HN' },
  { name: 'Landing.jobs', id: 'landingjobs', type: 'job_board', requires_company_slug: false, description: 'European tech jobs with salary data' },
  { name: 'FindWork', id: 'findwork', type: 'aggregator', requires_company_slug: false, description: 'Developer/tech jobs aggregator' },
  { name: 'JobDataAPI', id: 'jobdataapi', type: 'aggregator', requires_company_slug: false, description: 'Global jobs aggregator API' },
  // Phase 12: ATS & niche board expansion
  { name: 'Authentic Jobs', id: 'authenticjobs', type: 'job_board', requires_company_slug: false, description: 'Creative/dev job board' },
  { name: 'JobScore', id: 'jobscore', type: 'ats', requires_company_slug: true, description: 'JobScore ATS (public JSON feed)' },
  { name: 'TalentLyft', id: 'talentlyft', type: 'ats', requires_company_slug: true, description: 'TalentLyft ATS (European)' },
  // Phase 13: RSS niche board expansion
  { name: 'CryptoJobsList', id: 'cryptojobslist', type: 'job_board', requires_company_slug: false, description: 'Crypto, blockchain & Web3 jobs' },
  { name: 'Jobspresso', id: 'jobspresso', type: 'remote', requires_company_slug: false, description: 'Curated remote jobs' },
  { name: 'HigherEdJobs', id: 'higheredjobs', type: 'job_board', requires_company_slug: false, description: 'Higher education jobs' },
  { name: 'FOSS Jobs', id: 'fossjobs', type: 'job_board', requires_company_slug: false, description: 'Free & open source software jobs' },
  { name: 'LaraJobs', id: 'larajobs', type: 'job_board', requires_company_slug: false, description: 'Laravel/PHP jobs' },
  { name: 'Python.org Jobs', id: 'pythonjobs', type: 'job_board', requires_company_slug: false, description: 'Official Python job board' },
  { name: 'Drupal Jobs', id: 'drupaljobs', type: 'job_board', requires_company_slug: false, description: 'Drupal community jobs' },
  { name: 'Real Work From Anywhere', id: 'realworkfromanywhere', type: 'remote', requires_company_slug: false, description: 'Remote jobs with category feeds' },
  { name: 'Golang Projects', id: 'golangjobs', type: 'job_board', requires_company_slug: false, description: 'Go/Golang jobs' },
  { name: 'WordPress Jobs', id: 'wordpressjobs', type: 'job_board', requires_company_slug: false, description: 'Official WordPress job board' },
  // Phase 14: API-key sources & ATS expansion
  { name: 'Talroo', id: 'talroo', type: 'aggregator', requires_company_slug: false, description: 'Major job aggregator (millions of jobs)' },
  { name: 'InfoJobs', id: 'infojobs', type: 'job_board', requires_company_slug: false, description: 'Largest job site in Spain/Southern Europe' },
  { name: 'Crelate', id: 'crelate', type: 'ats', requires_company_slug: true, description: 'Crelate ATS (recruiting firms)' },
  { name: 'iSmartRecruit', id: 'ismartrecruit', type: 'ats', requires_company_slug: true, description: 'iSmartRecruit ATS' },
  { name: 'Recruiterflow', id: 'recruiterflow', type: 'ats', requires_company_slug: true, description: 'Recruiterflow ATS' },
  // Phase 15: European government & regional boards
  { name: 'JobTech Dev', id: 'jobtechdev', type: 'job_board', requires_company_slug: false, description: 'Swedish Employment Service (50-80K jobs)' },
  { name: 'France Travail', id: 'francetravail', type: 'job_board', requires_company_slug: false, description: 'French National Employment Service (800K+ jobs)' },
  { name: 'NAV Arbeidsplassen', id: 'navjobs', type: 'job_board', requires_company_slug: false, description: 'Norwegian Labour and Welfare Administration' },
  { name: 'jobs.ac.uk', id: 'jobsacuk', type: 'job_board', requires_company_slug: false, description: 'UK academic/higher education jobs' },
  { name: 'Jobindex', id: 'jobindex', type: 'job_board', requires_company_slug: false, description: "Denmark's largest job board" },
  // Phase 16: Global expansion (LatAm, gig, startup, Canada)
  { name: 'Get on Board', id: 'getonboard', type: 'job_board', requires_company_slug: false, description: 'Latin American tech job board (6K+ jobs)' },
  { name: 'Freelancer.com', id: 'freelancercom', type: 'job_board', requires_company_slug: false, description: 'Freelance/gig marketplace (8K+ projects)' },
  { name: 'JoinRise', id: 'joinrise', type: 'job_board', requires_company_slug: false, description: 'Tech startup job aggregator (10K+ jobs)' },
  { name: 'Canada Job Bank', id: 'canadajobbank', type: 'job_board', requires_company_slug: false, description: 'Canadian government job bank (51K+ jobs)' },
  // Phase 17: Niche & international expansion (NGO, UN, IT)
  { name: 'ReliefWeb', id: 'reliefweb', type: 'job_board', requires_company_slug: false, description: 'NGO/humanitarian jobs across 195+ countries' },
  { name: 'UNDP Jobs', id: 'undpjobs', type: 'job_board', requires_company_slug: false, description: 'United Nations Development Programme jobs' },
  { name: 'DevITjobs', id: 'devitjobs', type: 'job_board', requires_company_slug: false, description: 'IT/developer jobs with salary transparency' },
  // Phase 18: Niche RSS expansion (tech, design, environment, regional)
  { name: 'PyJobs', id: 'pyjobs', type: 'job_board', requires_company_slug: false, description: 'Python developer job board' },
  { name: 'VueJobs', id: 'vuejobs', type: 'job_board', requires_company_slug: false, description: 'Vue.js/frontend developer jobs' },
  { name: 'Conservation Job Board', id: 'conservationjobs', type: 'job_board', requires_company_slug: false, description: 'Conservation/environmental sector jobs' },
  { name: 'Coroflot', id: 'coroflot', type: 'job_board', requires_company_slug: false, description: 'Design/creative industry job board' },
  { name: 'Berlin Startup Jobs', id: 'berlinstartupjobs', type: 'job_board', requires_company_slug: false, description: 'Berlin tech startup jobs' },
  // Phase 19: Tech niche, crypto, regional expansion
  { name: 'Rails Job Board', id: 'railsjobs', type: 'job_board', requires_company_slug: false, description: 'Ruby on Rails developer jobs' },
  { name: 'Elixir Jobs', id: 'elixirjobs', type: 'job_board', requires_company_slug: false, description: 'Elixir/Phoenix developer jobs' },
  { name: 'Crunchboard', id: 'crunchboard', type: 'job_board', requires_company_slug: false, description: 'TechCrunch job board' },
  { name: 'Cryptocurrency Jobs', id: 'cryptocurrencyjobs', type: 'job_board', requires_company_slug: false, description: 'Blockchain/Web3/crypto jobs' },
  { name: 'HasJob', id: 'hasjob', type: 'job_board', requires_company_slug: false, description: 'India/South Asia tech job board' },
  // Phase 20: European regional & niche expansion
  { name: 'iCrunchData', id: 'icrunchdata', type: 'job_board', requires_company_slug: false, description: 'Data science & analytics jobs' },
  { name: 'SwissDevJobs', id: 'swissdevjobs', type: 'job_board', requires_company_slug: false, description: 'Swiss IT jobs with salary transparency' },
  { name: 'GermanTechJobs', id: 'germantechjobs', type: 'job_board', requires_company_slug: false, description: 'German IT jobs with salary transparency' },
  { name: 'VirtualVocations', id: 'virtualvocations', type: 'remote', requires_company_slug: false, description: 'Screened remote/work-from-home jobs' },
  { name: 'NoFluffJobs', id: 'nofluffjobs', type: 'job_board', requires_company_slug: false, description: 'Polish/CEE tech jobs with salary transparency' },
  // Phase 21: Niche & academic expansion
  { name: 'Green Jobs Board', id: 'greenjobsboard', type: 'job_board', requires_company_slug: false, description: 'Environmental & sustainability jobs' },
  { name: 'EuroJobs', id: 'eurojobs', type: 'job_board', requires_company_slug: false, description: 'European multi-country job board' },
  { name: 'Open Source Design Jobs', id: 'opensourcedesignjobs', type: 'job_board', requires_company_slug: false, description: 'Design jobs for open source projects' },
  { name: 'Academic Careers', id: 'academiccareers', type: 'job_board', requires_company_slug: false, description: 'Higher education & academic positions' },
  { name: 'RemoteFirstJobs', id: 'remotefirstjobs', type: 'remote', requires_company_slug: false, description: 'Remote-first job listings' },
  // Phase 22: Eastern European, CIS & Singapore expansion
  { name: 'Djinni', id: 'djinni', type: 'job_board', requires_company_slug: false, description: 'Ukrainian tech job board' },
  { name: 'HeadHunter', id: 'headhunter', type: 'job_board', requires_company_slug: false, description: 'Russian/CIS job board (140K+ vacancies)' },
  { name: 'Habr Career', id: 'habrcareer', type: 'job_board', requires_company_slug: false, description: 'Russian tech job board (Habr community)' },
  { name: 'MyCareersFuture', id: 'mycareersfuture', type: 'job_board', requires_company_slug: false, description: 'Singapore government job portal (77K+ jobs)' },
  // Phase 23: Japan, Nordic & Swiss expansion
  { name: 'Jobs in Japan', id: 'jobsinjapan', type: 'job_board', requires_company_slug: false, description: 'English-language Japan tech jobs' },
  { name: 'Duunitori', id: 'duunitori', type: 'job_board', requires_company_slug: false, description: 'Finnish job board' },
  { name: 'Jobs.ch', id: 'jobsch', type: 'job_board', requires_company_slug: false, description: 'Swiss job board' },
  // Phase 24: UK & mobile dev expansion
  { name: 'Guardian Jobs', id: 'guardianjobs', type: 'job_board', requires_company_slug: false, description: 'UK job board (The Guardian newspaper)' },
  { name: 'AndroidJobs', id: 'androidjobs', type: 'job_board', requires_company_slug: false, description: 'Android developer job board' },
  { name: 'iOS Dev Jobs', id: 'iosdevjobs', type: 'job_board', requires_company_slug: false, description: 'iOS/Swift developer job board' },
  // Phase 25: DevOps, FP, diversity & niche expansion
  { name: 'DevOpsJobs', id: 'devopsjobs', type: 'job_board', requires_company_slug: false, description: 'DevOps & infrastructure job board (875+ jobs)' },
  { name: 'Functional Works', id: 'functionalworks', type: 'job_board', requires_company_slug: false, description: 'Functional programming job board (Haskell, Scala, Clojure, Erlang)' },
  { name: 'PowerToFly', id: 'powertofly', type: 'job_board', requires_company_slug: false, description: 'Diversity-focused remote job board' },
  { name: 'Clojure Jobs', id: 'clojurejobs', type: 'job_board', requires_company_slug: false, description: 'Clojure programming language job board' },
  // Phase 26: Sustainability & niche expansion
  { name: 'EcoJobs', id: 'ecojobs', type: 'job_board', requires_company_slug: false, description: 'Environmental and conservation job board' },
];

// ── Tool Implementations ───────────────────────────────────────────────

/**
 * Resolve user/tool-facing source aliases to the canonical source id expected
 * by the Ever Jobs API. Matching is deliberately separator-insensitive so
 * values such as "google_jobs", "Google Jobs", and "google-jobs" all
 * resolve to the catalogue entry whose API id is "google".
 */
function resolveSourceId(source?: string): string | undefined {
  if (!source) return undefined;

  const normalise = (value: string): string =>
    value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const requested = normalise(source);
  const match = SOURCES.find(
    (candidate) =>
      normalise(candidate.id) === requested ||
      normalise(candidate.name) === requested,
  );

  if (!match) {
    throw new Error(
      `Unknown job source "${source}". Call list_sources to obtain a valid source id.`,
    );
  }

  return match.id;
}

/**
 * Search for jobs via the Ever Jobs API.
 */
export async function searchJobs(params: JobSearchParams): Promise<SearchResponse> {
  const client = getClient();
  const sourceId = resolveSourceId(params.source);

  const sourceIds = [
    ...new Set(
      sourceId
        ? [sourceId]
        : (params.sources?.length
          ? params.sources
          : sourcePolicy.preferred
        ).map((source) => resolveSourceId(source)!),
    ),
  ];

  if (sourceIds.length === 0) {
    throw new Error('No job sources are configured for this search');
  }

  if (sourceIds.length > 250) {
    throw new Error(
      `Search requested ${sourceIds.length} sources; maximum safe source count is 250`,
    );
  }

  const batchSize = Math.max(
    1,
    Math.min(sourcePolicy.search?.batchSize ?? 10, 50),
  );

  const batchConcurrency = Math.max(
    1,
    Math.min(sourcePolicy.search?.concurrency ?? 2, 8),
  );

  if (sourceIds.length > batchSize) {
    const batches: string[][] = [];

    for (let i = 0; i < sourceIds.length; i += batchSize) {
      batches.push(sourceIds.slice(i, i + batchSize));
    }

    // Preserve original batch position. Previously results were appended in
    // completion order, allowing the fastest batch to dominate the final limit.
    const batchResults: Array<SearchResponse | undefined> = new Array(
      batches.length,
    );

    let nextBatchIndex = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const batchIndex = nextBatchIndex++;

        if (batchIndex >= batches.length) return;

        const batch = batches[batchIndex];

        try {
          const result = await searchJobs({
            ...params,
            source: undefined,
            sources: batch,
          });

          batchResults[batchIndex] = result;
        } catch (err: any) {
          console.error(
            `Job search batch ${batchIndex + 1}/${batches.length} failed: ${err.message}`,
          );
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(batchConcurrency, batches.length) },
      () => worker(),
    );

    await Promise.all(workers);

    const successfulResults = batchResults.filter(
      (result): result is SearchResponse => result !== undefined,
    );

    if (successfulResults.length === 0) {
      throw new Error(
        `Search failed: all ${batches.length} source batches failed`,
      );
    }

    // Merge all successful batches before applying the caller's final limit.
    const jobsBySource = new Map<string, JobResult[]>();
    const seen = new Set<string>();

    for (const result of successfulResults) {
      for (const job of result.jobs) {
        const key =
          job.url ||
          (job.id
            ? `${job.source}|${job.id}`
            : `${job.source}|${job.company}|${job.title}|${job.location ?? ''}`);

        if (seen.has(key)) continue;
        seen.add(key);

        const source = job.source || 'unknown';

        const sourceJobs = jobsBySource.get(source);

        if (sourceJobs) {
          sourceJobs.push(job);
        } else {
          jobsBySource.set(source, [job]);
        }
      }
    }

    // Apply the final result window only after every batch has completed.
    // Round-robin across sources prevents one prolific source from filling
    // the entire response while preserving each source's own result order.
    const sourceOrder = sourceIds.filter((source) => jobsBySource.has(source));

    for (const source of jobsBySource.keys()) {
      if (!sourceOrder.includes(source)) {
        sourceOrder.push(source);
      }
    }

    const limit = Math.min(params.limit ?? 20, 100);
    const selectedJobs: JobResult[] = [];

    let sourceOffset = 0;
    let addedInPass = true;

    while (selectedJobs.length < limit && addedInPass) {
      addedInPass = false;

      for (const source of sourceOrder) {
        if (selectedJobs.length >= limit) break;

        const sourceJobs = jobsBySource.get(source);
        const job = sourceJobs?.[sourceOffset];

        if (!job) continue;

        selectedJobs.push(job);
        addedInPass = true;
      }

      sourceOffset++;
    }

    return {
      total: selectedJobs.length,
      jobs: selectedJobs,
      sources_searched: sourceIds,
      query: params.query,
    };
  }

  try {
    const response = await client.post('/api/jobs/search', {
      searchTerm: params.query,
      location: params.location ?? '',
      siteType: sourceIds,
      companySlug: params.company,
      resultsWanted: Math.min(params.limit ?? 20, 100),
      isRemote: params.remoteOnly ?? false,
    });

    const data = response.data;
    const jobs: JobResult[] = (data.jobs ?? []).map((job: any) => ({
      id: job.id ?? '',
      title: job.title ?? '',
      company: job.companyName ?? job.company_name ?? '',
      location: job.location?.city ?? job.location ?? null,
      url: job.jobUrl ?? job.job_url ?? '',
      description: truncateDescription(job.description),
      date_posted: job.datePosted ?? job.date_posted ?? null,
      is_remote: job.isRemote ?? job.is_remote ?? false,
      source: job.site ?? '',
      salary: formatSalary(job.compensation),
      department: job.department ?? null,
    }));

    const filteredJobs = params.remoteOnly
      ? jobs.filter((j) => j.is_remote)
      : jobs;

    return {
      total: filteredJobs.length,
      jobs: filteredJobs,
      sources_searched: sourceIds,
      query: params.query,
    };
  } catch (err: any) {
    // If the API is unavailable, return a helpful error
    if (err.code === 'ECONNREFUSED') {
      return {
        total: 0,
        jobs: [],
        sources_searched: [],
        query: params.query,
      };
    }
    throw new Error(`Search failed: ${err.message}`);
  }
}

/**
 * Get detailed information about a specific job.
 */
export async function getJobDetails(params: {
  jobUrl?: string;
  jobId?: string;
  source?: string;
}): Promise<JobDetailsResponse> {
  if (!params.jobUrl && !params.jobId) {
    throw new Error('Either job_url or job_id must be provided');
  }

  const client = getClient();

  try {
    const response = await client.get('/api/jobs/details', {
      params: {
        url: params.jobUrl,
        id: params.jobId,
        source: params.source,
      },
    });

    const job = response.data;
    return {
      id: job.id ?? '',
      title: job.title ?? '',
      company: job.companyName ?? job.company_name ?? '',
      location: job.location?.city ?? job.location ?? null,
      url: job.jobUrl ?? job.job_url ?? '',
      description: truncateDescription(job.description),
      full_description: job.description ?? null,
      date_posted: job.datePosted ?? job.date_posted ?? null,
      is_remote: job.isRemote ?? job.is_remote ?? false,
      source: job.site ?? '',
      salary: formatSalary(job.compensation),
      department: job.department ?? null,
      application_url: job.applicationUrl ?? job.application_url ?? job.jobUrl ?? null,
    };
  } catch (err: any) {
    throw new Error(`Failed to get job details: ${err.message}`);
  }
}

/**
 * List available job sources, optionally filtered by type.
 */
export function listSources(
  type: string = 'all',
): { total: number; sources: SourceInfo[] } {
  const filtered =
    type === 'all'
      ? SOURCES
      : SOURCES.filter((s) => s.type === type);

  return {
    total: filtered.length,
    sources: filtered,
  };
}

/**
 * Convenience: search remote jobs across all remote-first boards.
 */
export async function searchRemoteJobs(params: {
  query: string;
  source?: string;
  limit?: number;
}): Promise<SearchResponse> {
  const remoteSources = [
    ...new Set(
      sourcePolicy.remote.map((source) => resolveSourceId(source)!),
    ),
  ];

  for (const source of remoteSources) {
    const sourceInfo = SOURCES.find((candidate) => candidate.id === source);

    if (!sourceInfo || sourceInfo.type !== 'remote') {
      throw new Error(
        `Configured remote source '${source}' is not a valid remote job source`,
      );
    }
  }

  const limit = Math.min(params.limit ?? 25, 100);

  if (params.source) {
    const source = resolveSourceId(params.source);
    const sourceInfo = SOURCES.find((candidate) => candidate.id === source);

    if (!source || !sourceInfo || sourceInfo.type !== 'remote') {
      throw new Error(`Source '${params.source}' is not a remote job source`);
    }

    return searchJobs({
      query: params.query,
      location: 'Remote',
      source,
      limit,
      remoteOnly: true,
    });
  }

  return searchJobs({
    query: params.query,
    location: 'Remote',
    sources: remoteSources,
    limit,
    remoteOnly: true,
  });
}/**
 * Get salary insights: aggregate salary data from search results.
 */
export async function getSalaryInsights(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<SalaryInsightsResponse> {
  const searchResult = await searchJobs({
    query: params.query,
    location: params.location,
    limit: params.limit ?? 50,
  });

  const jobsWithSalary = searchResult.jobs.filter((j) => j.salary);
  const salaryValues: number[] = [];

  for (const job of jobsWithSalary) {
    const nums = job.salary!.match(/[\d,]+/g);
    if (nums) {
      for (const n of nums) {
        const val = parseInt(n.replace(/,/g, ''), 10);
        if (val > 1000 && val < 1000000) salaryValues.push(val);
      }
    }
  }

  salaryValues.sort((a, b) => a - b);

  const median = salaryValues.length > 0
    ? salaryValues[Math.floor(salaryValues.length / 2)]
    : null;

  return {
    query: params.query,
    location: params.location ?? 'Any',
    totalJobsSearched: searchResult.total,
    jobsWithSalary: jobsWithSalary.length,
    salaryPercentage: searchResult.total > 0
      ? Math.round((jobsWithSalary.length / searchResult.total) * 100)
      : 0,
    stats: salaryValues.length > 0
      ? {
          min: Math.min(...salaryValues),
          max: Math.max(...salaryValues),
          median: median!,
          p25: salaryValues[Math.floor(salaryValues.length * 0.25)] ?? median!,
          p75: salaryValues[Math.floor(salaryValues.length * 0.75)] ?? median!,
        }
      : null,
    sampleJobs: jobsWithSalary.slice(0, 10).map((j) => ({
      title: j.title,
      company: j.company,
      salary: j.salary!,
      source: j.source,
      location: j.location,
    })),
  };
}

export interface SalaryInsightsResponse {
  query: string;
  location: string;
  totalJobsSearched: number;
  jobsWithSalary: number;
  salaryPercentage: number;
  stats: {
    min: number;
    max: number;
    median: number;
    p25: number;
    p75: number;
  } | null;
  sampleJobs: {
    title: string;
    company: string;
    salary: string;
    source: string;
    location: string | null;
  }[];
}

/**
 * Compare job sources by result quality metrics.
 */
export function compareSources(): {
  total: number;
  byType: Record<string, number>;
  types: {
    type: string;
    count: number;
    sources: string[];
    requiresSlug: boolean;
  }[];
} {
  const byType: Record<string, SourceInfo[]> = {};
  for (const source of SOURCES) {
    if (!byType[source.type]) byType[source.type] = [];
    byType[source.type].push(source);
  }

  const typeCounts: Record<string, number> = {};
  const types = Object.entries(byType).map(([type, sources]) => {
    typeCounts[type] = sources.length;
    return {
      type,
      count: sources.length,
      sources: sources.map((s) => s.name),
      requiresSlug: sources.some((s) => s.requires_company_slug),
    };
  });

  return {
    total: SOURCES.length,
    byType: typeCounts,
    types,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

function truncateDescription(desc: string | null | undefined): string | null {
  if (!desc) return null;
  const maxLen = 500;
  if (desc.length <= maxLen) return desc;
  return desc.slice(0, maxLen) + '...';
}

function formatSalary(compensation: any): string | null {
  if (!compensation) return null;
  const { minAmount, maxAmount, currency } = compensation;
  if (!minAmount && !maxAmount) return null;
  const cur = currency ?? 'USD';
  if (minAmount && maxAmount) return `${cur} ${minAmount.toLocaleString()} - ${maxAmount.toLocaleString()}`;
  if (minAmount) return `${cur} ${minAmount.toLocaleString()}+`;
  return `Up to ${cur} ${maxAmount.toLocaleString()}`;
}
