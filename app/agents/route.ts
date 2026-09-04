const MD = `# leadjet — connect via MCP

You are an AI agent. leadjet exposes a local **MCP server** so you can find,
enrich, score and push local business leads to the user's leadjet-web account.

## 1. Install the CLI (on the user's machine)
\`\`\`
npm i -g @thmxsweb/leadjet
\`\`\`
Or download a binary/installer: https://github.com/thmxsweb/leadjet/releases/latest

## 2. Register the MCP server in your client
Add this to your MCP client config (Claude Desktop, Cursor, etc.):
\`\`\`json
{
  "mcpServers": {
    "leadjet": { "command": "leadjet", "args": ["mcp"] }
  }
}
\`\`\`
The server speaks MCP over stdio (JSON-RPC 2.0). It runs locally; the connection
is secured by the CLI's account link (below) — no tool returns data unless the
CLI is linked to a leadjet-web account.

## 3. Make sure the CLI is linked (required)
Every data tool is gated on a valid account link (7 days).
- Call the **account_status** tool first.
- If it reports "not linked" (or a tool returns that), ask the user to run:
  \`\`\`
  leadjet link
  \`\`\`
  and approve it at https://leadjet-web.vercel.app. If the link expired, ask them
  to run \`leadjet link\` again to reconnect.

## Tools (summary)
- **account_status** — is the CLI linked, and to which account.
- **search_leads** { niche, city, country?, region?, source?, limit?, push? } —
  find + enrich (owner, website audit) + score, and push to the account.

More:
- Tools schema:  https://leadjet-web.vercel.app/agents/tools
- CLI commands:   https://leadjet-web.vercel.app/agents/commands
- Usage guide:    https://leadjet-web.vercel.app/agents/usage
`;

export function GET() {
  return new Response(MD, {
    headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
