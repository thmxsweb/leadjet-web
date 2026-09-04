const MD = `# leadjet — usage for AI agents

## The flow
1. Ensure the CLI is installed and its MCP server is registered (see /agents).
2. Call **account_status**. If not linked, tell the user to run \`leadjet link\`
   and approve at https://leadjet-web.vercel.app. Wait, then retry.
3. Call **search_leads** with the user's niche + city (+ country/region). By
   default results are pushed to their account and appear on the dashboard.
4. Use the returned scored leads to advise the user: prioritise **Chaud** (hot,
   score ≥ 70) leads that have a phone or email, and the "Site mort - refonte"
   or "Création site" opportunities.

## Scoring (how to read a lead)
score = web need (no site 60 · dead site 55 · DIY builder 35 · modern 10)
      + reachability (phone +12 · email +8)
      + value (owner known +8 · established +6 · has staff +6). Cap 100.
priority: Chaud ≥ 70, Tiède 45-69, Froid < 45.
domain: the existing site (to remake) or a proposed domain if none.

## Examples
- "Find me restaurants in Lyon to sell websites to" →
  search_leads { niche: "restaurants", city: "Lyon", country: "France" }
- "Plumbers in Paris, top 50" →
  search_leads { niche: "plumbers", city: "Paris", region: "Île-de-France", limit: 50 }

## Notes
- OpenStreetMap (source "osm") is free and needs no key.
- Google Places (source "places") needs a key set via \`leadjet config set places-key\`.
- The link lasts 7 days; on expiry, ask the user to reconnect with \`leadjet link\`.
`;

export function GET() {
  return new Response(MD, { headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
