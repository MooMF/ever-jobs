/**
 * Spec 006 / T07 — Join.com REST response shapes.
 *
 * Subset of the upstream Python's response objects (`Dict[str, Any]`
 * in the reference; we narrow to the fields we actually map onto
 * `JobPostDto`). Keeping the shapes structural (interfaces, no class)
 * means a fixture stub in the unit test doesn't need to instantiate
 * any of them — the parser is happy as long as the JSON shape
 * matches.
 *
 * Field names mirror the JSON wire shape verbatim (camelCase) so a
 * future contributor diffing upstream Python's `list_jobs` response
 * can grep for the same identifiers in both sources.
 */

/** Single location entry inside a `JoinComJobItem.locations[]`. */
export interface JoinComLocation {
  readonly id?: number | string;
  readonly name?: string;
  readonly city?: string;
  readonly country?: string;
  readonly isRemote?: boolean;
}

/** Single job posting in `JoinComJobsPage.items[]`. */
export interface JoinComJobItem {
  readonly id: number | string;
  readonly title?: string;
  readonly description?: string;
  readonly locations?: ReadonlyArray<JoinComLocation>;
  readonly shareableUrl?: string;
  readonly publishedAt?: string;
  readonly employmentType?: string;
  readonly remoteOption?: string;
  readonly category?: { readonly name?: string };
  readonly department?: { readonly name?: string } | string;
}

/** Pagination block in `JoinComJobsPage.pagination`. */
export interface JoinComPagination {
  readonly page?: number;
  readonly pageSize?: number;
  readonly total?: number;
  readonly totalPages?: number;
}

/**
 * The JSON response from
 * `GET https://join.com/api/public/companies/<id>/jobs?...`. Always
 * carries `items` and `pagination` (even on empty boards — `items=[]`,
 * `pagination.totalPages=0`).
 */
export interface JoinComJobsPage {
  readonly items?: ReadonlyArray<JoinComJobItem>;
  readonly pagination?: JoinComPagination;
}

/** Resolved tenant context after Step 1. */
export interface JoinComTenantContext {
  readonly companyId: number;
  readonly companySlug: string;
  readonly companyName: string;
}
