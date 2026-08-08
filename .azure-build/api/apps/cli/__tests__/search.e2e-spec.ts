/**
 * E2E tests for the CLI search command.
 *
 * Spawns the CLI as a subprocess via child_process.execSync, testing
 * the actual entrypoint exactly as users invoke it.
 *
 * Uses "google" as the test source — free, no API key, fast.
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ROOT = path.resolve(__dirname, '../../..');
const CLI_CMD = 'npx ts-node -r tsconfig-paths/register apps/cli/src/main.ts';

/**
 * Strip ANSI escape codes from a string.
 * NestJS Logger adds colour codes (\x1b[33m etc.) which break plain-text matching.
 */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Strip NestJS Logger lines from stdout.
 * NestJS Logger writes "[Nest] PID  - ..." lines to stdout by default,
 * often wrapped in ANSI colour codes. We strip ANSI first, then filter.
 */
function stripNestLogs(output: string): string {
  return stripAnsi(output)
    .split('\n')
    .filter((line) => !line.match(/^\[Nest\]\s/))
    .join('\n');
}

/** Run a CLI command and capture stdout/stderr/exitCode. */
function runCli(
  args: string,
  options?: { input?: string; timeout?: number },
): { stdout: string; stderr: string; exitCode: number } {
  try {
    const rawStdout = execSync(`${CLI_CMD} ${args}`, {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: options?.timeout ?? 120_000,
      input: options?.input,
      env: { ...process.env, NODE_ENV: 'test', TS_NODE_PROJECT: 'tsconfig.base.json' },
    });
    return { stdout: stripNestLogs(rawStdout), stderr: '', exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: stripNestLogs(err.stdout?.toString() ?? ''),
      stderr: err.stderr?.toString() ?? '',
      exitCode: err.status ?? 1,
    };
  }
}

describe('CLI search command (E2E)', () => {
  it('should output valid JSON with --format json', () => {
    const { stdout, exitCode } = runCli(
      'search -q "software engineer" -s google -n 3 -f json',
    );
    expect(exitCode).toBe(0);

    const parsed = JSON.parse(stdout.trim());
    expect(Array.isArray(parsed)).toBe(true);

    if (parsed.length > 0) {
      expect(parsed[0]).toHaveProperty('title');
      expect(parsed[0]).toHaveProperty('jobUrl');
    }
  });

  it('should output CSV with --format csv', () => {
    const { stdout, exitCode } = runCli(
      'search -q "developer" -s google -n 3 -f csv',
    );
    expect(exitCode).toBe(0);

    const trimmed = stdout.trim();
    if (trimmed.length > 0) {
      const lines = trimmed.split('\n');
      // CSV header should contain known columns when results exist
      expect(lines[0]).toContain('id');
      expect(lines[0]).toContain('title');
      expect(lines[0]).toContain('site');
    }
    // Empty CSV is valid when Google returns 0 results
  });

  it('should output table with --format table', () => {
    const { stdout, exitCode } = runCli(
      'search -q "engineer" -s google -n 3 -f table',
    );
    expect(exitCode).toBe(0);
    // Table contains headers when results exist, or "No jobs found." when empty
    const hasTable = stdout.includes('Site') && stdout.includes('Title');
    const hasEmpty = stdout.includes('No jobs found');
    expect(hasTable || hasEmpty).toBe(true);
  });

  it('should output summary with --format summary', () => {
    const { stdout, exitCode } = runCli(
      'search -q "engineer" -s google -n 3 -f summary',
    );
    expect(exitCode).toBe(0);
    // Summary shows stats when results exist, or "No jobs found." when empty
    const hasSummary = stdout.includes('Job Search Summary');
    const hasEmpty = stdout.includes('No jobs found');
    expect(hasSummary || hasEmpty).toBe(true);
  });

  it('should write output to file with -o flag', () => {
    const tmpFile = path.join(
      os.tmpdir(),
      `ever-jobs-test-${Date.now()}.json`,
    );

    try {
      const { exitCode } = runCli(
        `search -q "developer" -s google -n 2 -f json -o "${tmpFile}"`,
      );
      expect(exitCode).toBe(0);
      expect(fs.existsSync(tmpFile)).toBe(true);

      const content = fs.readFileSync(tmpFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(Array.isArray(parsed)).toBe(true);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it('should accept JSON input via --stdin', () => {
    const jsonInput = JSON.stringify({
      searchTerm: 'data engineer',
      siteType: ['google'],
      resultsWanted: 2,
    });

    const { stdout, exitCode } = runCli('search --stdin -f json', {
      input: jsonInput,
    });
    expect(exitCode).toBe(0);

    const parsed = JSON.parse(stdout.trim());
    expect(Array.isArray(parsed)).toBe(true);
  });
});
