const MD = `# leadjet — guide for AI agents

leadjet finds local business leads, enriches them (owner, website audit, 0-100
score, domain suggestion) and lets you turn them into clients. It is a local
**CLI engine** paired with a web account. Data is found on the user's machine and
pushed to their account.

## Install
- npm: \`npm i -g @thmxsweb/leadjet\`
- or standalone binaries: https://github.com/thmxsweb/leadjet/releases/latest
  (\`leadjet-win.exe\`, \`leadjet-macos\`, \`leadjet-linux\`)

## Link to an account (once, valid 7 days)
\`\`\`
leadjet link
\`\`\`
Opens the browser to approve the device; stores a 7-day token.

## Core command: find + enrich + score + (optionally) push
\`\`\`
leadjet leads "<niche>" --city <city> --country <country> [--region <region>] \\
  [--source osm|places] [--limit <n>] [--no-owner] [--no-audit] \\
  [--out file.csv | --append file.ndjson | --push] [--format json|csv|ndjson]
\`\`\`
Examples:
\`\`\`
leadjet leads "restaurants" --city Lyon --country France --push
leadjet leads "plumbers" --city Paris --region "Île-de-France" -o leads.csv
\`\`\`

- \`--source osm\` (default, free, OpenStreetMap) or \`places\` (Google Places, needs a key).
- \`--push\` sends the leads to the linked web account (viewable on the dashboard).

## Other commands
- \`leadjet find "<query>"\` — raw business export (no enrichment).
- \`leadjet contacts --in leads.ndjson -o contacts.csv\` — scrape sites for emails, socials, owner.
- \`leadjet serve\` — local web dashboard + API.
- \`leadjet config set places-key <KEY>\` — save a Google Places key.
- \`leadjet config set web-url <url>\` — point the CLI at a web account.

## What each lead contains
name, legal (company name), activity, owner + role (French business registry),
phone, email, website, score (0-100), priority (Chaud/Tiède/Froid = hot/warm/cold),
opportunity (Création site / Site mort - refonte / Refonte … / Site correct),
domain (existing site to remake, or a proposed domain), location, siren, source.

## Scoring
score = web need (no site 60 · dead site 55 · DIY builder 35 · modern 10)
      + reachability (phone +12 · email +8)
      + value (owner known +8 · established +6 · has staff +6). Cap 100.
Hot ≥ 70, Warm 45-69, Cold < 45.

## Typical agent workflow
1. \`leadjet link\` (if not linked).
2. \`leadjet leads "<niche>" --city <city> --country <country> --push\`.
3. Read results (or the account dashboard) and act on the highest-scoring, reachable leads.
`;

export function GET() {
  return new Response(MD, {
    headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
