type QueryMethod = "run" | "all" | "values" | "get"
type BindValue = string | number | boolean | null

interface QueryInput {
  sql: string
  params: BindValue[]
  method: QueryMethod
}

interface QueryOutput {
  rows: unknown[]
}

const MAX_REQUEST_BYTES = 1024 * 1024
const MAX_SQL_BYTES = 128 * 1024
const MAX_BATCH_SIZE = 100
const encoder = new TextEncoder()

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  })
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0")
  if (declaredLength > MAX_REQUEST_BYTES) {
    throw new RangeError("Request body is too large")
  }

  if (!request.body) {
    throw new TypeError("Request body is required")
  }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let body = ""
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    totalBytes += value.byteLength
    if (totalBytes > MAX_REQUEST_BYTES) {
      await reader.cancel("Request body is too large")
      throw new RangeError("Request body is too large")
    }
    body += decoder.decode(value, { stream: true })
  }

  body += decoder.decode()
  return JSON.parse(body)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseQueryInput(value: unknown): QueryInput {
  if (!isRecord(value)) {
    throw new TypeError("Query payload must be an object")
  }

  const { sql, params, method } = value
  if (typeof sql !== "string" || sql.length === 0) {
    throw new TypeError("sql must be a non-empty string")
  }
  if (encoder.encode(sql).byteLength > MAX_SQL_BYTES) {
    throw new RangeError("SQL statement is too large")
  }
  if (sql.includes("\0")) {
    throw new TypeError("SQL statement contains an invalid null byte")
  }
  if (!Array.isArray(params) || !params.every(isBindValue)) {
    throw new TypeError("params must contain only D1 bind values")
  }
  if (method !== "run" && method !== "all" && method !== "values" && method !== "get") {
    throw new TypeError("method is invalid")
  }

  return { sql, params, method }
}

function isBindValue(value: unknown): value is BindValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
}

async function verifyBearer(request: Request, expected: string): Promise<boolean> {
  const authorization = request.headers.get("authorization")
  const provided = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : ""

  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ])

  return crypto.subtle.timingSafeEqual(providedHash, expectedHash)
}

function statementFor(database: D1Database | D1DatabaseSession, input: QueryInput) {
  return database.prepare(input.sql).bind(...input.params)
}

async function executeOne(database: D1DatabaseSession, input: QueryInput): Promise<QueryOutput> {
  const statement = statementFor(database, input)

  if (input.method === "run") {
    await statement.run()
    return { rows: [] }
  }

  const rows = await statement.raw<unknown[]>()
  if (input.method === "get") {
    return { rows: rows[0] ?? [] }
  }

  return { rows }
}

async function executeBatch(database: D1DatabaseSession, inputs: QueryInput[]): Promise<QueryOutput[]> {
  const statements = inputs.map((input) => statementFor(database, input))
  const responses = await database.batch<Record<string, unknown>>(statements)

  return responses.map((response, index) => {
    const method = inputs[index].method
    if (method === "run") return { rows: [] }

    const rows = response.results.map((row) => Object.values(row))
    if (method === "get") return { rows: rows[0] ?? [] }
    return { rows }
  })
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)

  if (request.method === "GET" && url.pathname === "/health") {
    const session = env.DB.withSession("first-primary")
    await session.prepare("SELECT 1").first()
    return json({ ok: true, service: "lashpop-db" })
  }

  if (request.method !== "POST" || (url.pathname !== "/query" && url.pathname !== "/batch")) {
    return json({ error: "Not found" }, 404)
  }

  if (!(await verifyBearer(request, env.DB_PROXY_TOKEN))) {
    return json({ error: "Unauthorized" }, 401)
  }

  const payload = await readBoundedJson(request)
  const session = env.DB.withSession("first-primary")

  if (url.pathname === "/query") {
    const query = parseQueryInput(payload)
    return json(await executeOne(session, query))
  }

  if (!isRecord(payload) || !Array.isArray(payload.batch)) {
    throw new TypeError("batch must be an array")
  }

  const batch = payload.batch.map(parseQueryInput)
  if (batch.length === 0 || batch.length > MAX_BATCH_SIZE) {
    throw new RangeError(`batch must contain between 1 and ${MAX_BATCH_SIZE} statements`)
  }

  return json({ results: await executeBatch(session, batch) })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID()

    try {
      return await handleRequest(request, env)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      const status = error instanceof TypeError || error instanceof RangeError ? 400 : 500

      console.error(JSON.stringify({
        message: "database proxy request failed",
        error: message,
        method: request.method,
        path: new URL(request.url).pathname,
        requestId,
      }))

      return json({ error: status === 400 ? message : "Internal server error", requestId }, status)
    }
  },
} satisfies ExportedHandler<Env>
