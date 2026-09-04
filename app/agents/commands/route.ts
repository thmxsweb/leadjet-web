const MD = `# leadjet CLI commands

The MCP server wraps these. Humans can also run them directly.

- \`leadjet link\` — link this CLI to a leadjet-web account (valid 7 days).
- \`leadjet status\` — show the current link (account + expiry).
- \`leadjet mcp\` — run the MCP server (stdio) for AI agents.
- \`leadjet leads "<niche>" --city <city> [--country <c>] [--region <r>] [--source osm|places] [--limit <n>] [--push]\`
  — find + enrich + score; \`--push\` sends to the account.
- \`leadjet find "<query>"\` — raw business export (no enrichment).
- \`leadjet contacts --in leads.ndjson -o contacts.csv\` — scrape sites for emails/owner/socials.
- \`leadjet config set <key> <value>\` — e.g. \`places-key\`, \`web-url\`.
- \`leadjet fields\` — list exportable fields.
`;

export function GET() {
  return new Response(MD, { headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
