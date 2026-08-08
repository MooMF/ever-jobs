import {
  classifyBody,
  classifyHttpStatus,
  hasExpiredUrlMarker,
  matchesApplyControl,
  matchesBotChallenge,
  matchesExpiredText,
  matchesListingPage,
} from '../src/liveness-heuristics';
import { DEFAULT_MIN_CONTENT_LENGTH } from '../src/liveness-http.constants';

/**
 * Spec 721 / T06 — pure-heuristics unit tests. At least one test per
 * classification branch (FR-1..FR-3, FR-5..FR-12) plus priority-order
 * locks (expired beats apply; challenge beats short-content; apply beats
 * short-content).
 */

/**
 * Neutral long-form posting prose (> 300 plain chars) that deliberately
 * contains NO heuristic marker — no `\bapply\b`, no tombstone phrase, no
 * challenge marker, no listing banner.
 */
const FILLER =
  '<p>We are a distributed engineering organisation building data pipelines ' +
  'for the renewable energy sector. The role involves designing resilient ' +
  'ingestion services, reviewing pull requests, mentoring junior colleagues, ' +
  'and collaborating with product managers on quarterly roadmaps.</p>' +
  '<p>Benefits include flexible hours, a generous learning budget, and an ' +
  'annual team offsite. Our stack spans TypeScript, PostgreSQL, and modern ' +
  'container orchestration tooling deployed across three regions.</p>';

function page(body: string): string {
  // Newlines between elements mirror real-world markup — tag-stripping
  // must not fuse the <title> text with the first body token.
  return `<html>\n<head><title>Posting</title></head>\n<body>\n${body}\n</body>\n</html>`;
}

describe('liveness-heuristics — Spec 721 / T06', () => {
  describe('classifyHttpStatus (FR-1..FR-3)', () => {
    it('maps 404 and 410 to expired/http_gone (FR-1)', () => {
      expect(classifyHttpStatus(404)).toEqual({ result: 'expired', code: 'http_gone' });
      expect(classifyHttpStatus(410)).toEqual({ result: 'expired', code: 'http_gone' });
    });

    it('maps 403 and 503 to uncertain/access_blocked — never expired (FR-2 / NFR-5)', () => {
      for (const status of [403, 503]) {
        const outcome = classifyHttpStatus(status);
        expect(outcome).toEqual({ result: 'uncertain', code: 'access_blocked' });
        expect(outcome?.result).not.toBe('expired');
      }
    });

    it('maps other >= 400 statuses to uncertain/http_error (FR-3)', () => {
      for (const status of [400, 401, 429, 451, 500, 502]) {
        expect(classifyHttpStatus(status)).toEqual({ result: 'uncertain', code: 'http_error' });
      }
    });

    it('returns null for non-error statuses — body heuristics take over', () => {
      for (const status of [200, 201, 204, 301, 302]) {
        expect(classifyHttpStatus(status)).toBeNull();
      }
    });
  });

  describe('hasExpiredUrlMarker (FR-5)', () => {
    it('detects an error=true query on the final URL', () => {
      expect(hasExpiredUrlMarker('https://board.example.com/careers?error=true')).toBe(true);
      expect(hasExpiredUrlMarker('https://board.example.com/?lang=en&error=true#top')).toBe(true);
    });

    it('falls back to a query-shaped scan for non-parseable URLs', () => {
      expect(hasExpiredUrlMarker('/careers?error=true')).toBe(true);
    });

    it('ignores error=false, missing markers, and differently-named params', () => {
      expect(hasExpiredUrlMarker('https://board.example.com/careers?error=false')).toBe(false);
      expect(hasExpiredUrlMarker('https://board.example.com/jobs/123')).toBe(false);
      expect(hasExpiredUrlMarker('https://board.example.com/jobs?theerror=true')).toBe(false);
    });
  });

  describe('expired-text patterns (FR-7) — multilingual', () => {
    const tombstones: ReadonlyArray<[string, string]> = [
      ['EN — no longer available', '<h1>Sorry!</h1><p>This job is no longer available.</p>'],
      ['EN — short variant', '<p>Job no longer available.</p>'],
      ['EN — position filled', '<p>The position has been filled.</p>'],
      ['EN — expired', '<p>This job has expired.</p>'],
      ['EN — applications closed', '<p>We are no longer accepting applications for this role.</p>'],
      ['EN — applications have closed', '<p>Applications have closed.</p>'],
      ['EN — posting closed', '<p>This posting has been closed.</p>'],
      ['DE — nicht mehr verfügbar', '<p>Diese Stelle ist leider nicht mehr verfügbar.</p>'],
      ['DE — bereits besetzt', '<p>Die Position ist bereits besetzt.</p>'],
      ['FR — offre expirée', '<p>Offre expirée.</p>'],
      ['FR — typographic apostrophe via entity', '<p>Cette offre n&rsquo;est plus disponible.</p>'],
      ['FR — straight apostrophe', "<p>Cette annonce n'est plus disponible.</p>"],
      ['ES — ya no está disponible', '<p>Esta oferta ya no está disponible.</p>'],
      ['ES — oferta expirada', '<p>Esta oferta ha expirado.</p>'],
      ['PL — oferta wygasła', '<p>Ta oferta wygasła.</p>'],
      ['PL — oferta nieaktualna', '<p>Ta oferta jest nieaktualna.</p>'],
    ];

    it.each(tombstones)('%s -> expired/expired_text', (_label, body) => {
      expect(classifyBody(page(body))).toEqual({ result: 'expired', code: 'expired_text' });
    });

    it('expired text beats a visible apply control (priority lock)', () => {
      const html = page(
        '<p>This job is no longer available.</p><a href="/jobs">Apply to similar jobs</a>' + FILLER,
      );
      expect(classifyBody(html)).toEqual({ result: 'expired', code: 'expired_text' });
    });

    it('matchesExpiredText operates on lowercased plain text', () => {
      expect(matchesExpiredText('this job has expired')).toBe(true);
      expect(matchesExpiredText('we are hiring')).toBe(false);
    });
  });

  describe('bot-challenge markers (FR-8)', () => {
    it('classifies a challenge interstitial with a SHORT body as bot_challenge, not insufficient_content (D-03 priority lock)', () => {
      const html =
        '<html><head><title>Just a moment...</title></head>' +
        '<body><p>Checking your browser.</p></body></html>';
      const outcome = classifyBody(html);
      expect(outcome).toEqual({ result: 'uncertain', code: 'bot_challenge' });
      expect(outcome.code).not.toBe('insufficient_content');
    });

    it('detects human-verification wording', () => {
      expect(classifyBody(page('<p>Please verify you are a human to continue.</p>'))).toEqual({
        result: 'uncertain',
        code: 'bot_challenge',
      });
      expect(classifyBody(page('<p>Verifying you are human. This may take a few seconds.</p>'))).toEqual({
        result: 'uncertain',
        code: 'bot_challenge',
      });
      expect(classifyBody(page('<p>Verify you are not a robot.</p>'))).toEqual({
        result: 'uncertain',
        code: 'bot_challenge',
      });
      expect(classifyBody(page('<p>We are performing security verification of your request.</p>'))).toEqual({
        result: 'uncertain',
        code: 'bot_challenge',
      });
    });

    it('detects markers in raw HTML that tag-stripping would discard (D-02)', () => {
      const html =
        '<html><head><script src="https://js.hcaptcha.com/1/api.js" async></script></head>' +
        '<body><p>One moment.</p></body></html>';
      expect(classifyBody(html)).toEqual({ result: 'uncertain', code: 'bot_challenge' });

      const cfRay =
        '<html><body><p>Something went wrong.</p><!-- cf-ray: 8f1ab2cd3e4f5a6b --></body></html>';
      expect(classifyBody(cfRay)).toEqual({ result: 'uncertain', code: 'bot_challenge' });
    });

    it('detects compound markers (attention required + cloudflare, press and hold + human)', () => {
      const attention =
        '<html><head><title>Attention Required! | Cloudflare</title></head><body></body></html>';
      expect(classifyBody(attention)).toEqual({ result: 'uncertain', code: 'bot_challenge' });

      const pressHold = page('<p>Press and hold the button to confirm you are a human.</p>');
      expect(classifyBody(pressHold)).toEqual({ result: 'uncertain', code: 'bot_challenge' });
    });

    it('requires BOTH halves of a compound marker', () => {
      // "attention required" alone (no cloudflare) on a long page → no challenge.
      expect(matchesBotChallenge('attention required: please read the onboarding notes')).toBe(false);
      expect(matchesBotChallenge('press and hold the lever')).toBe(false);
    });
  });

  describe('apply-control markers (FR-9)', () => {
    it('classifies a long posting with an apply button as active', () => {
      const html = page(`${FILLER}<a class="postings-btn" href="/app">Apply Now</a>`);
      expect(classifyBody(html)).toEqual({ result: 'active', code: 'apply_control_visible' });
    });

    it('apply control beats the short-content rule (priority lock)', () => {
      const html = page('<a href="/app">Apply</a>');
      expect(classifyBody(html)).toEqual({ result: 'active', code: 'apply_control_visible' });
    });

    it.each([
      ['submit application', '<button>Submit Application</button>'],
      ['start application', '<button>Start Application</button>'],
      ['easy apply', '<button>Easy Apply</button>'],
      ['ES — solicitar', '<button>Solicitar empleo</button>'],
      ['DE — bewerben', '<a href="#">Jetzt bewerben</a>'],
      ['FR — postuler', '<a href="#">Postuler maintenant</a>'],
      ['PL — aplikuj', '<a href="#">Aplikuj teraz</a>'],
      ['PL — wyślij CV', '<a href="#">Wyślij CV</a>'],
      ['PL — wyślij aplikację', '<a href="#">Wyślij aplikację</a>'],
    ])('%s -> active/apply_control_visible', (_label, control) => {
      expect(classifyBody(page(control))).toEqual({
        result: 'active',
        code: 'apply_control_visible',
      });
    });

    it('does NOT treat "applying" as an apply control (word boundary)', () => {
      expect(matchesApplyControl('thank you for applying earlier this year')).toBe(false);
      const html = page(`${FILLER}<p>Candidates applying via referral get feedback faster.</p>`);
      expect(classifyBody(html)).toEqual({ result: 'uncertain', code: 'no_apply_control' });
    });
  });

  describe('insufficient content (FR-10)', () => {
    it('classifies a near-empty 200 page as expired/insufficient_content', () => {
      expect(classifyBody(page('<p>OK</p>'))).toEqual({
        result: 'expired',
        code: 'insufficient_content',
      });
    });

    it('honours a custom minContentLength', () => {
      const short = page('<p>A tiny but perfectly intentional page body.</p>');
      expect(classifyBody(short)).toEqual({ result: 'expired', code: 'insufficient_content' });
      expect(classifyBody(short, 10)).toEqual({ result: 'uncertain', code: 'no_apply_control' });
    });

    it('uses the documented default threshold', () => {
      expect(DEFAULT_MIN_CONTENT_LENGTH).toBe(300);
    });
  });

  describe('listing-page heuristic (FR-11)', () => {
    it('classifies a result-count banner page as uncertain/listing_page', () => {
      const html = page(`<h2>42 jobs found</h2>${FILLER}`);
      expect(classifyBody(html)).toEqual({ result: 'uncertain', code: 'listing_page' });
    });

    it('matches alternative banner wordings', () => {
      expect(matchesListingPage('7 open positions available')).toBe(true);
      expect(matchesListingPage('13 openings available in berlin')).toBe(true);
      expect(matchesListingPage('1 job found')).toBe(true);
      expect(matchesListingPage('our jobs are special')).toBe(false);
    });
  });

  describe('fallback (FR-12)', () => {
    it('classifies a substantial page without any marker as uncertain/no_apply_control', () => {
      expect(classifyBody(page(FILLER))).toEqual({
        result: 'uncertain',
        code: 'no_apply_control',
      });
    });
  });
});
