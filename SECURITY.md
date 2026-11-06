# Security

Do not post credentials or private source in public issues. Report vulnerabilities through GitHub private vulnerability reporting if enabled; otherwise use contato@brunnodev.store.

RepoRelay sends read-only requests to api.github.com. A token is read only from GITHUB_TOKEN, never from CLI arguments or repository configuration. It is not written to reports. Redirects are rejected. No repository code, package scripts, or issue instructions are executed.

Reports include issue text in JSON, repository identity, commit SHA and paths. Review them before sharing. Filename filtering reduces accidental inclusion of common sensitive paths; it is not a secret scanner. This version retrieves metadata, issue text and a Git tree, not file bodies. GitHub sees requests under its own privacy policy.
