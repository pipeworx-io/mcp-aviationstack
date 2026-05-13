interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Aviationstack MCP — global flight + airport + airline data
 *
 * Auth: ?access_key= query param.
 * Free plan: 100 req/mo, HTTP-only (https is a paid feature).
 *
 * Docs: https://aviationstack.com/documentation
 */


const BASE = 'http://api.aviationstack.com/v1';

const tools: McpToolExport['tools'] = [
  {
    name: 'flights',
    description:
      'Real-time and scheduled flights with departure/arrival airport, time, gate, status. Combine filters to narrow down.',
    inputSchema: {
      type: 'object',
      properties: {
        flight_iata: { type: 'string', description: 'IATA flight number (e.g. "AA100")' },
        flight_icao: { type: 'string', description: 'ICAO flight number' },
        dep_iata: { type: 'string', description: 'Departure airport IATA (e.g. "JFK")' },
        arr_iata: { type: 'string', description: 'Arrival airport IATA' },
        airline_iata: { type: 'string', description: 'Airline IATA code' },
        flight_status: { type: 'string', description: 'scheduled | active | landed | cancelled | incident | diverted' },
        limit: { type: 'number', description: '1-100 (default 25)' },
        offset: { type: 'number', description: '0-based offset' },
      },
    },
  },
  {
    name: 'airports',
    description: 'Airport directory — name, IATA/ICAO codes, country, GPS, timezone.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Free-text — name / city' },
        iata_code: { type: 'string', description: '3-letter IATA code' },
        icao_code: { type: 'string', description: '4-letter ICAO code' },
        country_iso2: { type: 'string', description: 'ISO 3166-1 alpha-2 country' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  },
  {
    name: 'airlines',
    description: 'Airline directory.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        iata_code: { type: 'string', description: '2-letter IATA' },
        icao_code: { type: 'string', description: '3-letter ICAO' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  },
  {
    name: 'cities',
    description: 'City + primary-airport database.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        iata_code: { type: 'string', description: 'City IATA code (e.g. "NYC" for all NYC airports)' },
        country_iso2: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'countries',
    description: 'Country reference with capital city, currency, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        country_iso2: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'routes',
    description: 'Scheduled routes between airports.',
    inputSchema: {
      type: 'object',
      properties: {
        dep_iata: { type: 'string' },
        arr_iata: { type: 'string' },
        airline_iata: { type: 'string' },
        flight_number: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'Aviationstack requires an API key. Contact the operator about platform credentials, or BYO via ?_apiKey=<key> after registering at https://aviationstack.com/signup/free.',
    );
  }
  const path = `/${name}`;
  const params = new URLSearchParams({ access_key: apiKey });
  for (const [k, v] of Object.entries(args)) {
    if (k.startsWith('_') || v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  return avsGet(`${path}?${params}`);
}

async function avsGet(path: string) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 401) throw new Error('Aviationstack: unauthorized — check key');
  if (res.status === 429) throw new Error('Aviationstack: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Aviationstack error: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { error?: { code?: string; message?: string } };
  if (data.error) {
    throw new Error(`Aviationstack: ${data.error.code ?? 'error'} — ${data.error.message ?? 'unknown'}`);
  }
  return data;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
