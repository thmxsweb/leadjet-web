const MD = `# leadjet MCP tools

Served by the leadjet CLI MCP server (\`leadjet mcp\`). All tools require the CLI
to be linked to a leadjet-web account (see /agents).

## account_status
Check whether the CLI is linked and to which account.
- input: (none)
- output: text — "Linked to <email>." or a "not linked, run leadjet link" message.

## search_leads
Find, enrich (owner via the French business registry + website audit) and score
local business leads, then push them to the linked account.
- input:
  - niche: string (required) — e.g. "restaurants", "plumbers", "coiffeurs"
  - city: string (required)
  - country: string (optional) — e.g. "France"
  - region: string (optional) — e.g. "Île-de-France"
  - source: "osm" | "places" (optional, default "osm" — free)
  - limit: number (optional, default 20, max 100)
  - push: boolean (optional, default true) — push results to the account
- output: text — a summary plus the scored leads as JSON. Each lead has:
  name, legal, activity, owner, role, phone, email, website, score (0-100),
  priority (Chaud/Tiède/Froid), opportunity, domain (existing or proposed),
  location, siren, source.
`;

export function GET() {
  return new Response(MD, { headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
