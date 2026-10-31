# PatternSoft Commercial Opportunities — Specification

## Problem
EverJobs searches advertised employment roles. PatternSoft needs a separate pipeline to discover **actual buyers of software services**, including subcontracting, supplier opportunities, fixed-scope projects and public procurement. Normal 20-role contract search must remain unaffected.

## Scope
- Introduce independent `commercial-opportunities` discovery with source adapters, classification, deduplication, scoring and weekly export; no reuse of employment classification as commercial proof.
- Source categories: UK Contracts Finder, Find a Tender, consultancy supplier/subcontract requests, direct project requests; EverJobs job search only as secondary lead signals.
- Types: `supplier_tender`, `subcontract`, `fixed_scope_project`, `buyer_request`, `speculative_signal`. Only the first four enter verified report.
- For each opportunity store buyer, request title, original URL, published/closing dates where known, source type, evidence excerpt, UK supplier eligibility, remote delivery evidence, budget (only if published), fit, confidence and next step.
- Filter to UK-eligible and remote or remotely deliverable; prioritise .NET/C#/VB6, SQL/Access migration, Azure, financial integrations, failing-project recovery.
- Exclude A.Team, HB, resume farms, generic permanent job listings, spam, irrelevant offshore-only work and unverifiable listings.
- Deduplicate canonical URL and buyer/project similarity; show NEW versus last report.
- Weekly report max 10; never pad; explicit no-results message. No automatic outreach, tenders or spending.
- Feature flag defaults off, independent scheduling, API and CLI entrypoint; preserve existing job DTO/endpoint response formats and daily search behaviour.

## Non-goals
- Automatically submit bids or email prospects.
- Replace or relax the existing 20-contract search.
- Claim that a recruitment advert is a direct B2B purchase request.
- Scrape protected, authenticated sources without permission.

## Contracts
`CommercialOpportunity`: id, kind, buyer, title, canonicalUrl, source, discoveredAt, publishedAt?, closingAt?, geography, remoteEvidence, ukEligible, requestEvidence, budget?, fitScore, confidence, status, firstSeenAt, lastSeenAt.
`CommercialOpportunitySource`: async discover(query, limit, signal): Promise<CommercialOpportunityCandidate[]>.
`CommercialOpportunityReport`: generatedAt, snapshotSourceStatus, qualified[], excludedCounts, sourceErrors[].

## Acceptance
- Off-by-default rollout and unchanged legacy job outputs.
- All report entries verified as explicit, actionable requests with original direct links.
- Mark uncertain eligibility/evidence as excluded or for-review rather than confirmed.
- Include dated citations and source-failure visibility.
- UK remote filter; strict exclusions; dedupe and NEW classification stable across runs.
- Unit, integration and regression tests ensure zero effect on legacy EverJobs.
