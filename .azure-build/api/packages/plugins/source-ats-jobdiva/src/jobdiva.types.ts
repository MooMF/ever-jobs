/**
 * TypeScript interfaces for the JobDiva public portal XML jobs feeds.
 *
 * Both feeds (`getportaljobs.jsp` and `listofportaljobs.jsp`) return one XML
 * document with root `<outertag>`; the `<jobs>` container holds the tenant's
 * open roles as `<job>` children. These interfaces model the parsed wire shape
 * after extraction from the XML using cheerio in XML mode.
 *
 * Element names mirror the real wire shape (lower-case / snake-ish, e.g.
 * `jobdivaid`, `state_abbr`, `jobdescription_400char`). A handful of camelCase
 * aliases are modelled defensively so minor cross-tenant or future-version
 * drift never breaks the parser. All fields are optional/nullable since the
 * two feeds expose different subsets and tenants omit empty elements.
 */

/** A single open position as extracted from one `<job>` element. */
export interface JobDivaJob {
  /** Per-feed sequence index (`<ID>`). Not stable across runs. */
  ID?: string | null;

  /**
   * Stable JobDiva job identifier (`<jobdivaid>`) — used as the ATS id.
   * Example: `"32393466"`.
   */
  jobdivaid?: string | null;
  jobDivaId?: string | null;

  /** Human-readable job reference number (`<jobdiva_no>`, e.g. `"26-00826"`). */
  jobdiva_no?: string | null;
  jobDivaNo?: string | null;

  /** Optional client / external reference (`<optional_ref>`). */
  optional_ref?: string | null;
  optionalRef?: string | null;

  /** Absolute public candidate-portal apply / detail URL (`<portal_url>`). */
  portal_url?: string | null;
  portalUrl?: string | null;

  /** Job display title (`<title>`). Required; job skipped if absent. */
  title?: string | null;

  /** Free-text location label (`<location>`, e.g. `"Dallas, TEXAS"`). */
  location?: string | null;

  /** Structured location parts (employer "connect" feed). */
  city?: string | null;
  /** Full state / region name (`<state>`, e.g. `"TEXAS"`). */
  state?: string | null;
  /** Two-letter state abbreviation (`<state_abbr>`, e.g. `"TX"`). */
  state_abbr?: string | null;
  stateAbbr?: string | null;
  /** Country identifier (`<countryid>`, e.g. `"US"`). */
  countryid?: string | null;
  countryId?: string | null;

  /** ISO / epoch timestamps. `<issuedate>` is the publish date. */
  issuedate?: string | null;
  issueDate?: string | null;
  /** `<startdate>` — role start date; `<enddate>` — often empty. */
  startdate?: string | null;
  startDate?: string | null;
  enddate?: string | null;
  /** Misspelt variant seen on the candidate feed (`<endddate>`). */
  endddate?: string | null;
  endDate?: string | null;

  /** Owning advertising division(s) (`<division>`, `<division2>`). */
  division?: string | null;
  division2?: string | null;

  /** Internal display priority (`<jobpriority>`). Not mapped. */
  jobpriority?: string | null;

  /**
   * Employment / position type label (`<positiontype>`, e.g. `"Contract"`,
   * `"Full-time"`).
   */
  positiontype?: string | null;
  positionType?: string | null;

  /** Required experience level (`<experience_level>`, e.g. `"> 10 Years"`). */
  experience_level?: string | null;
  experienceLevel?: string | null;

  /** Rate range / unit fields (`<ratemin>`, `<ratemax>`, `<rateper>`). */
  ratemin?: string | null;
  ratemax?: string | null;
  rateper?: string | null;

  /** On-site flexibility percentage (`<onsiteflexibility>`, `0`–`100`). */
  onsiteflexibility?: string | null;
  onsiteFlexibility?: string | null;

  /** Owning recruiter name (`<primary_recruiter>`). Not mapped. */
  primary_recruiter?: string | null;
  primaryRecruiter?: string | null;

  /**
   * Full job-ad body (`<jobdescription>`, candidate feed) — usually HTML inside
   * a CDATA section.
   */
  jobdescription?: string | null;
  jobDescription?: string | null;

  /**
   * Truncated job-ad body (`<jobdescription_400char>`, employer feed) — used as
   * a fallback when the full body is absent.
   */
  jobdescription_400char?: string | null;
  jobDescription400char?: string | null;

  /** Employer / company name (`<company>`, employer feed). */
  company?: string | null;

  /** Free-text user-defined fields container (`<userfields>`). Not mapped. */
  userfields?: string | null;
}

/**
 * Parsed feed metadata extracted from the `<outertag>` envelope.
 */
export interface JobDivaFeed {
  /** Feed-generation timestamp from `<systemtime>` (if present). */
  systemTime?: string | null;
  /** Open roles for the tenant (`<jobs>/<job>`). */
  jobs: JobDivaJob[];
}
