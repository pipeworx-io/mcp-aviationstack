# @pipeworx/aviationstack

Aviationstack MCP — global flight tracking + airport / airline / route reference data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

- `flights(flight_iata?, flight_icao?, dep_iata?, arr_iata?, airline_iata?, flight_status?, limit?, offset?)` — real-time + scheduled flights
- `airports(search?, iata_code?, icao_code?, limit?, offset?)` — airport database (~10k airports)
- `airlines(search?, iata_code?, icao_code?, limit?, offset?)` — airline database
- `cities(search?, iata_code?, country_iso2?, limit?)` — city → primary airport mapping
- `countries(search?, country_iso2?, limit?)` — country reference
- `routes(dep_iata?, arr_iata?, airline_iata?, flight_number?, limit?)` — scheduled routes
- `aviationstack_future_flights(iataCode, type, date, airline_iata?, airline_icao?, flight_number?, limit?, offset?)` — scheduled future flights at one airport for a specific date (`type`: `departure` or `arrival`). Backed by Aviationstack's `/flightsFuture` endpoint, which apilayer's 2026-10-06 notice opened only for the **next 7 days** — `date` must be `tomorrow..today+7` (UTC); the pack refuses out-of-window dates itself before calling upstream (fleet #2700).

## Auth

- **Platform key:** gateway env `PLATFORM_AVIATIONSTACK_KEY`
- **BYO:** `?_apiKey=<key>` after registering at https://aviationstack.com/signup/free

### Plan tier

As of 2026-10-06 the shared platform key is on a plan that reaches `flights`, `airports`,
`airlines`, `cities`, `countries` and `routes` live (verified: `airports`/JFK and
`routes`/JFK→LAX both returned non-empty data — neither is free-tier-only any more; an
earlier version of this README, written 2026-08-28, said otherwise and was stale).
`aviationstack_future_flights` was added the same day the vendor emailed that they opened
`/flightsFuture` more broadly; whether our specific plan reaches *that* endpoint was not
independently confirmed before this tool shipped (the platform key's raw value is a
Cloudflare/Supabase secret, not available to a pack-authoring session) — if a live call
answers HTTP 403 `function_access_restricted`, that means the plan doesn't cover this
endpoint yet and is a money/plan decision, not a pack bug.

The free plan (if the platform key ever reverts to it) is capped at **100 requests per
month**, and once that is spent every endpoint answers 429 — including ones the tier would
otherwise allow. Free plan is also HTTP-only (no https) — the pack already uses `http://`.

**Reading a 429 here:** Aviationstack labels the monthly-allowance refusal with the code
`rate_limit_reached` and only says "monthly" in the message text, so the code name argues
for a burst limit that clears in seconds when the truth is a wall that lasts until the plan
renews. The pack branches on the message, not the code. Fleet #577.

## Data source

`http://api.aviationstack.com/v1/` — `access_key` query param. `/flightsFuture` spec:
https://api.swaggerhub.com/apis/apilayer-863/AviationstackAPI/1.0.0/swagger.json

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

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/flights \
  -H 'Content-Type: application/json' \
  -d '{"flight_iata":"AA100","dep_iata":"JFK","arr_iata":"LAX"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/flights`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-aviationstack` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/aviationstack/mcp` endpoint shown above. It needs network access;
there is no offline mode.

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

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

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
