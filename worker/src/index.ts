import {
  createShelf,
  emptyBlob,
  joinPair,
  publicShelf,
  putShelf,
  requireDevice,
  startPair,
  type CloudBlob,
} from "../../lib/cloud/engine";
import type { Library } from "../../lib/types";

export interface Env {
  DB: D1Database;
  ART: R2Bucket;
  APP_ORIGIN?: string;
}

const BLOB_ID = "main";

function json(data: unknown, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    },
  });
}

function fail(message: string, status = 400, origin = "*") {
  return json({ error: message }, status, origin);
}

function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function parseBlob(raw: string | null | undefined): CloudBlob {
  if (!raw) return emptyBlob();
  try {
    const parsed = JSON.parse(raw) as CloudBlob;
    return {
      shelves: parsed.shelves ?? [],
      devices: parsed.devices ?? [],
      pairs: parsed.pairs ?? [],
    };
  } catch {
    return emptyBlob();
  }
}

async function loadBlob(env: Env): Promise<CloudBlob> {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS crate_blob (id TEXT PRIMARY KEY, json TEXT NOT NULL)",
  ).run();
  const row = await env.DB.prepare("SELECT json FROM crate_blob WHERE id = ?")
    .bind(BLOB_ID)
    .first<{ json: string }>();
  return parseBlob(row?.json);
}

async function saveBlob(env: Env, blob: CloudBlob) {
  await env.DB.prepare(
    "INSERT INTO crate_blob (id, json) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json",
  )
    .bind(BLOB_ID, JSON.stringify(blob))
    .run();
}

async function mutate<T>(env: Env, fn: (blob: CloudBlob) => T) {
  const blob = await loadBlob(env);
  const result = fn(blob);
  await saveBlob(env, blob);
  return result;
}

function isLibrary(value: unknown): value is Library {
  if (!value || typeof value !== "object") return false;
  const row = value as Library;
  return Boolean(row.profile) && Array.isArray(row.games);
}

function payload(shelf: {
  id: string;
  publicId: string;
  revision: number;
  library: Library;
  updatedAt: string;
}) {
  return {
    shelfId: shelf.id,
    publicId: shelf.publicId,
    revision: shelf.revision,
    library: shelf.library,
    updatedAt: shelf.updatedAt,
  };
}

export default {
  async fetch(request: Request, env: Env) {
    const origin = env.APP_ORIGIN || "*";
    if (request.method === "OPTIONS") return json({ ok: true }, 200, origin);

    const url = new URL(request.url);
    const key = url.pathname.replace(/^\/api\/cloud\/?/, "").replace(/^\//, "");
    const secret = bearer(request);

    try {
      if (request.method === "GET" && key === "health") {
        return json({ ok: true, persist: "d1" }, 200, origin);
      }
      if (request.method === "GET" && key.startsWith("public/")) {
        const publicId = decodeURIComponent(key.slice("public/".length));
        const data = await mutate(env, (blob) => publicShelf(blob, publicId));
        if (!data) return fail("This share link is unknown.", 404, origin);
        return json(data, 200, origin);
      }
      if (request.method === "POST" && key === "create") {
        if (!secret) return fail("Missing device key.", 401, origin);
        const body = (await request.json()) as { library?: unknown };
        if (!isLibrary(body.library)) return fail("A library snapshot is required.", 400, origin);
        const shelf = await mutate(
          env,
          (blob) => createShelf(blob, { deviceSecret: secret, library: body.library as Library }).shelf,
        );
        return json(payload(shelf), 200, origin);
      }
      if (request.method === "GET" && key === "shelf") {
        if (!secret) return fail("Missing device key.", 401, origin);
        const shelf = await mutate(env, (blob) => requireDevice(blob, secret).shelf);
        return json(payload(shelf), 200, origin);
      }
      if (request.method === "PUT" && key === "shelf") {
        if (!secret) return fail("Missing device key.", 401, origin);
        const body = (await request.json()) as { library?: unknown };
        if (!isLibrary(body.library)) return fail("A library snapshot is required.", 400, origin);
        const shelf = await mutate(env, (blob) =>
          putShelf(blob, { deviceSecret: secret, library: body.library as Library }),
        );
        return json(payload(shelf), 200, origin);
      }
      if (request.method === "POST" && key === "pair") {
        if (!secret) return fail("Missing device key.", 401, origin);
        const result = await mutate(env, (blob) => startPair(blob, secret));
        return json(result, 200, origin);
      }
      if (request.method === "POST" && key === "join") {
        if (!secret) return fail("Missing device key.", 401, origin);
        const body = (await request.json()) as { code?: string };
        const code = (body.code ?? "").replace(/\s/g, "");
        if (!/^\d{6}$/.test(code)) {
          return fail("Enter the six-digit code from your other device.", 400, origin);
        }
        const shelf = await mutate(env, (blob) => joinPair(blob, { code, deviceSecret: secret }));
        return json(payload(shelf), 200, origin);
      }
      return fail("Not found.", 404, origin);
    } catch (error) {
      const status = (error as { status?: number }).status ?? 500;
      const message = error instanceof Error ? error.message : "Cloud request failed.";
      return fail(message, status, origin);
    }
  },
};
