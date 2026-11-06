# Contributing

Small, reproducible improvements are welcome. English and Portuguese issue reports are welcome; code and documentation use English.

Run `npm run check` and `npm test` with Node.js 22 or 24. No install is required.

For ranking changes, include an issue fixture, expected file order, and a false-positive example. Keep scores explainable. For GitHub changes, mock network responses and cover authentication failure and incomplete trees. Do not add real tokens or private repository data to fixtures.

Open an issue before introducing a dependency or a new output format. Pull requests should describe behavior, limits and verification. Never claim a heuristic proves correctness.
