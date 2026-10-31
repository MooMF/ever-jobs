# Implementation plan

1. Inspect current source registration, HTTP client, persistence, MCP and reporting interfaces and existing tests.
2. Add commercial DTOs and service-source interface without changing existing jobs interfaces.
3. Build independent, disabled-by-default feature plugin and test fixtures.
4. Add permitted public procurement source adapters first (official public feeds or documented APIs where available); keep source-specific errors separate.
5. Add a classifier enforcing direct buyer evidence and UK remote eligibility; distinguish speculative signals.
6. Implement canonical dedupe, first-seen/new labels, relevance and report output.
7. Expose standalone CLI/MCP action without changing `search_jobs`; set credentials/feature flags safely.
8. Add automated tests, integration fixtures, docs/runbook; validate lint/build/test and only then enable in a controlled environment.
9. Continue weekly report as separate scheduled ChatGPT task while repo implementation is under review; do not modify existing EverJobs Daily Search.

## Risk controls
- Public procurement may include unsuitable large tenders: size/lot/capacity assessment.
- Remote-deliverable is not synonymous with remote-advertised: require evidence or manual qualification.
- Avoid false buyer signals from recruiter listings and training marketplaces.
- Official feeds, access requirements and rate limits must be checked per adapter.
