# @pipeworx/aviationstack

Aviationstack MCP — global flight tracking + airport / airline / route reference data. Free tier: 100 req/month.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Aviationstack data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
