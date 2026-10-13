import {isPublicRead} from "./guard.mjs";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var MAX_REQUEST_BYTES = 1024 * 1024;
var MAX_SQL_BYTES = 128 * 1024;
var MAX_BATCH_SIZE = 100;
var encoder = new TextEncoder();
function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff"
    }
  });
}
__name(json, "json");
async function readBoundedJson(request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_REQUEST_BYTES) {
    throw new RangeError("Request body is too large");
  }
  if (!request.body) {
    throw new TypeError("Request body is required");
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REQUEST_BYTES) {
      await reader.cancel("Request body is too large");
      throw new RangeError("Request body is too large");
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  return JSON.parse(body);
}
__name(readBoundedJson, "readBoundedJson");
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isRecord, "isRecord");
function parseQueryInput(value) {
  if (!isRecord(value)) {
    throw new TypeError("Query payload must be an object");
  }
  const { sql, params, method } = value;
  if (typeof sql !== "string" || sql.length === 0) {
    throw new TypeError("sql must be a non-empty string");
  }
  if (encoder.encode(sql).byteLength > MAX_SQL_BYTES) {
    throw new RangeError("SQL statement is too large");
  }
  if (sql.includes("\0")) {
    throw new TypeError("SQL statement contains an invalid null byte");
  }
  if (!Array.isArray(params) || !params.every(isBindValue)) {
    throw new TypeError("params must contain only D1 bind values");
  }
  if (method !== "run" && method !== "all" && method !== "values" && method !== "get") {
    throw new TypeError("method is invalid");
  }
  return { sql, params, method };
}
__name(parseQueryInput, "parseQueryInput");
function isBindValue(value) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
__name(isBindValue, "isBindValue");
async function verifyBearer(request, expected) {
  const authorization = request.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected))
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}
__name(verifyBearer, "verifyBearer");
function statementFor(database, input) {
  return database.prepare(input.sql).bind(...input.params);
}
__name(statementFor, "statementFor");
async function executeOne(database, input) {
  const statement = statementFor(database, input);
  if (input.method === "run") {
    await statement.run();
    return { rows: [] };
  }
  const rows = await statement.raw();
  if (input.method === "get") {
    return { rows: rows[0] ?? [] };
  }
  return { rows };
}
__name(executeOne, "executeOne");
async function executeBatch(database, inputs) {
  const statements = inputs.map((input) => statementFor(database, input));
  const responses = await database.batch(statements);
  return responses.map((response, index) => {
    const method = inputs[index].method;
    if (method === "run") return { rows: [] };
    const rows = response.results.map((row) => Object.values(row));
    if (method === "get") return { rows: rows[0] ?? [] };
    return { rows };
  });
}
__name(executeBatch, "executeBatch");
async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") {
    const session2 = env.DB.withSession("first-primary");
    await session2.prepare("SELECT 1").first();
    return json({ ok: true, service: "lashpop-db" });
  }
  if (request.method !== "POST" || url.pathname !== "/query" && url.pathname !== "/batch") {
    return json({ error: "Not found" }, 404);
  }
  if (!env.DB_PROXY_TOKEN) return json({error: "Recovery reader unavailable"}, 503);
  if (!await verifyBearer(request, env.DB_PROXY_TOKEN)) {
    return json({ error: "Unauthorized" }, 401);
  }
  const payload = await readBoundedJson(request);
  const session = env.DB.withSession("first-primary");
  if (url.pathname === "/query") {
    const query = parseQueryInput(payload);
    if (!isPublicRead(query)) return json({error: "Recovery reader denies this query"}, 403);
    return json(await executeOne(session, query));
  }
  if (!isRecord(payload) || !Array.isArray(payload.batch)) {
    throw new TypeError("batch must be an array");
  }
  const batch = payload.batch.map(parseQueryInput);
  if (batch.length === 0 || batch.length > MAX_BATCH_SIZE) {
    throw new RangeError(`batch must contain between 1 and ${MAX_BATCH_SIZE} statements`);
  }
  if (!batch.every(isPublicRead)) return json({error: "Recovery reader denies this batch"}, 403);
  return json({ results: await executeBatch(session, batch) });
}
__name(handleRequest, "handleRequest");
var index_default = {
  async fetch(request, env) {
    const requestId = crypto.randomUUID();
    try {
      return await handleRequest(request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const status = error instanceof TypeError || error instanceof RangeError ? 400 : 500;
      console.error(JSON.stringify({
        message: "database proxy request failed",
        error: message,
        method: request.method,
        path: new URL(request.url).pathname,
        requestId
      }));
      return json({ error: status === 400 ? message : "Internal server error", requestId }, status);
    }
  }
};
export {
  index_default as default
};

