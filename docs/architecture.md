# Architecture

`github.js` accepts a canonical issue URL, requests issue metadata and repository metadata, resolves the default branch to a commit, then reads that commit's recursive Git tree. Four read-only requests per successful pack. The tree is pinned so branch movement cannot mix snapshots.

`engine.js` tokenizes the issue, ranks eligible paths using term matches and explicit path mentions, and finds similarly named test paths. A score orders candidates; it is not a confidence probability. Output is deterministic for a fixed input.

`cli.js` validates options and emits Markdown or versioned JSON. Exit code 0 means a pack was produced; 1 means invalid input or retrieval failed. Empty results are valid and explicitly described.

## Boundaries

No code parsing, dependency graph, file content retrieval, automatic repair or execution is implemented. A path can match without being relevant. Issue descriptions can be outdated or malicious. Human review remains essential. Recursive trees may be truncated; the report discloses that state. There is a 20-second per-request timeout and a 12-million-character response cap after reading the response.

## Next milestones

- Local checkout mode with import graph evidence.
- Opt-in, size-budgeted source excerpts with secret redaction.
- Browser workspace with side-by-side candidate inspection.
- Evaluation corpus for English and Portuguese issue vocabulary.

These are planned, not shipped features.
