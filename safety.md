# Safety Review — Public Release Repository

## Purpose

Before publishing or updating the Blob, inspect the complete release contents for security, privacy, and disclosure risks.

The public site is hosted using GitHub Pages. Assume all deployed HTML, JavaScript, assets, and other published files can be downloaded and inspected by anyone.

This review is a release gate, not a guarantee of safety or legal compliance.

## Release scope

Review:
- All files in the intended published output.
- The source files and configuration that produce that output.
- All assets, fonts, audio, and third-party libraries.
- External URLs and network requests.
- The Git history that will be exposed, if history is being transferred or published.
- The live demo configuration and relevant deployment settings.

Do not limit the review to the latest commit.

## Required checks

### 1. Confidentiality and repository hygiene

Confirm that the release does not contain:
- API keys, passwords, access tokens, or private keys.
- Personal information, private conversations, recordings, or transcripts.
- Private development notes or files that are not intended for publication.
- Local environment files, logs, backups, or unnecessary generated artifacts.
- Internal links or identifiers that disclose private resources unnecessarily.

Remember that deleting a secret from the latest version does not remove it from earlier published Git history.

### 2. Browser-visible code and configuration

Inspect all client-side JavaScript, HTML, CSS, and configuration.

Verify that:
- No server-side secrets or credentials are included.
- Public configuration values are safe to disclose.
- No unapproved analytics, tracking scripts, APIs, or remote scripts have been introduced.
- External connections are expected, documented, and use HTTPS where appropriate.
- There are no known unsafe script-injection paths or untrusted HTML rendering issues.

Never treat an environment variable embedded in browser JavaScript as a secret.

### 3. Assets and licensing

For every third-party asset or dependency, verify that:
- Its origin is known.
- Its license or permission allows the intended use.
- Any required attribution is included.
- It does not contain private or identifying information.
- The project does not make unsupported claims about ownership.

Escalate uncertain rights to a human reviewer.

### 4. Deployment and release integrity

Check that:
- GitHub Pages publishes the intended files and branch or build artifact.
- HTTPS is enabled and enforced where supported.
- No unnecessary development endpoints or debugging functionality remain.
- Automated tests and applicable scans pass.
- The live demo matches the reviewed release.
- The public privacy and security documentation matches the actual behavior.

### 5. Git history and repository exposure

If the release transfers Git history, inspect that history for secrets and private information.

If the history cannot be adequately reviewed, recommend a clean release history rather than assuming it is safe.

Do not rewrite or delete history automatically without explicit approval.

## Release decision

**BLOCK:** A confirmed critical issue exists.

**REVIEW REQUIRED:** A material risk, uncertain data flow, licensing question, or unverified release property remains.

**PASS WITH LIMITATIONS:** Required checks completed without a known blocker, with remaining limitations documented.

Never publish automatically based only on a successful agent report.

## Required release report

Provide:

1. The exact release commit or artifact reviewed.
2. The files and history included in the review.
3. Findings grouped into blockers, warnings, and passed checks.
4. Test and scan results.
5. Licensing and data-flow uncertainties.
6. Required fixes and human approvals.
7. Final recommendation: BLOCK, REVIEW REQUIRED, or PASS WITH LIMITATIONS.

A human must approve the release after reviewing the report. Do not claim that a successful review establishes legal compliance or eliminates all risk.