# @pipeworx/aviationstack

Aviationstack MCP — global flight tracking + airport / airline / route reference data. Free tier: 100 req/month.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

## Tools

- `flights(flight_iata?, flight_icao?, dep_iata?, arr_iata?, airline_iata?, flight_status?, limit?, offset?)` — real-time + scheduled flights
- `airports(search?, iata_code?, icao_code?, limit?, offset?)` — airport database (~10k airports)
- `airlines(search?, iata_code?, icao_code?, limit?, offset?)` — airline database
- `cities(search?, iata_code?, country_iso2?, limit?)` — city → primary airport mapping
- `countries(search?, country_iso2?, limit?)` — country reference
- `routes(dep_iata?, arr_iata?, airline_iata?, flight_number?, limit?)` — scheduled routes

## Auth

- **Platform key:** gateway env `PLATFORM_AVIATIONSTACK_KEY`
- **BYO:** `?_apiKey=<key>` after registering at https://aviationstack.com/signup/free

### Free-plan limits

Only the `flights` endpoint works on the free tier. `airports`, `airlines`, `cities`, `countries`, `routes` return HTTP 403 `function_access_restricted`. Upgrade to Basic (~$50/mo) to unlock them. Free plan is HTTP-only (no https) — the pack already uses `http://`.

The free plan is also capped at **100 requests per month**, and once that is spent every
endpoint answers 429 — including the ones the tier would otherwise allow. As of 2026-08-28
the shared key is in that state (`routes` and `airports`, zero successes in seven days).

**Reading a 429 here:** Aviationstack labels the monthly-allowance refusal with the code
`rate_limit_reached` and only says "monthly" in the message text, so the code name argues
for a burst limit that clears in seconds when the truth is a wall that lasts until the plan
renews. The pack branches on the message, not the code. Fleet #577.

## Data source

`http://api.aviationstack.com/v1/` — `access_key` query param.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "aviationstack": {
      "url": "https://gateway.pipeworx.io/aviationstack/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/aviationstack/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/flights \
  -H 'Content-Type: application/json' \
  -d '{"flight_iata":"AA100","dep_iata":"JFK","arr_iata":"LAX"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/flights`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "aviationstack": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-aviationstack"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-aviationstack
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Aviationstack data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
