import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { emptyBlob, type CloudBlob } from "./engine";

const FILE_PATH =
  process.env.CRATE_CLOUD_FILE ??
  (process.env.VERCEL
    ? "/tmp/crate-cloud.json"
    : path.join(process.cwd(), ".data/crate-cloud.json"));

const BLOB_KEY = "crate-cloud.json";

type D1QueryResponse = {
  success: boolean;
  result?: { results?: { json: string }[] }[];
  errors?: { message: string }[];
};

async function withLock<T>(fn: () => Promise<T>) {
  const g = globalThis as typeof globalThis & {
    __crateCloudLock?: Promise<unknown>;
  };
  const previous = g.__crateCloudLock ?? Promise.resolve();
  let release: () => void = () => {};
  g.__crateCloudLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
  }
}

function parseBlob(raw: string | null | undefined): CloudBlob {
  if (!raw) return emptyBlob();
  try {
    const parsed = JSON.parse(raw) as CloudBlob;
    if (!parsed || !Array.isArray(parsed.shelves)) return emptyBlob();
    return {
      shelves: parsed.shelves ?? [],
      devices: parsed.devices ?? [],
      pairs: parsed.pairs ?? [],
    };
  } catch {
    return emptyBlob();
  }
}

function d1Env() {
  const accountId = process.env.CF_ACCOUNT_ID;
  const databaseId = process.env.CF_D1_DATABASE_ID;
  const token = process.env.CF_API_TOKEN;
  if (!accountId || !databaseId || !token) return null;
  return { accountId, databaseId, token };
}

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function d1Query(sql: string, params: unknown[] = []) {
  const env = d1Env();
  if (!env) return null;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.accountId}/d1/database/${env.databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );
  const body = (await response.json()) as D1QueryResponse;
  if (!response.ok || !body.success) {
    throw new Error(body.errors?.[0]?.message ?? "D1 query failed");
  }
  return body.result?.[0]?.results ?? [];
}

async function loadD1(): Promise<CloudBlob | null> {
  if (!d1Env()) return null;
  await d1Query(
    "CREATE TABLE IF NOT EXISTS crate_blob (id TEXT PRIMARY KEY, json TEXT NOT NULL)",
  );
  const rows = await d1Query("SELECT json FROM crate_blob WHERE id = ?", ["main"]);
  return parseBlob(rows?.[0]?.json);
}

async function saveD1(blob: CloudBlob) {
  await d1Query(
    "INSERT INTO crate_blob (id, json) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json",
    ["main", JSON.stringify(blob)],
  );
}

async function loadPostgres(): Promise<CloudBlob | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, { max: 1, ssl: "prefer" });
  try {
    await sql`CREATE TABLE IF NOT EXISTS crate_blob (id TEXT PRIMARY KEY, json TEXT NOT NULL)`;
    const rows = await sql<{ json: string }[]>`SELECT json FROM crate_blob WHERE id = 'main'`;
    return parseBlob(rows[0]?.json);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function savePostgres(blob: CloudBlob) {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, { max: 1, ssl: "prefer" });
  try {
    await sql`CREATE TABLE IF NOT EXISTS crate_blob (id TEXT PRIMARY KEY, json TEXT NOT NULL)`;
    await sql`INSERT INTO crate_blob (id, json) VALUES ('main', ${JSON.stringify(blob)})
      ON CONFLICT (id) DO UPDATE SET json = EXCLUDED.json`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function loadVercelBlob(): Promise<CloudBlob> {
  const { get, BlobNotFoundError } = await import("@vercel/blob");
  try {
    const hit = await get(BLOB_KEY, { access: "private", useCache: false });
    if (!hit || hit.statusCode !== 200) return emptyBlob();
    const text = await new Response(hit.stream).text();
    return parseBlob(text);
  } catch (error) {
    if (error instanceof BlobNotFoundError) return emptyBlob();
    throw error;
  }
}

async function saveVercelBlob(blob: CloudBlob) {
  const { put } = await import("@vercel/blob");
  await put(BLOB_KEY, JSON.stringify(blob), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function loadFile(): Promise<CloudBlob> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    return parseBlob(raw);
  } catch {
    return emptyBlob();
  }
}

async function saveFile(blob: CloudBlob) {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  const tmp = `${FILE_PATH}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(blob)}\n`, "utf8");
  await rename(tmp, FILE_PATH);
}

async function loadBlob(): Promise<CloudBlob> {
  if (d1Env()) return await loadD1() ?? emptyBlob();
  if (process.env.DATABASE_URL) return await loadPostgres() ?? emptyBlob();
  if (blobConfigured()) return await loadVercelBlob();
  return await loadFile();
}

async function saveBlob(blob: CloudBlob) {
  if (d1Env()) {
    await saveD1(blob);
    return;
  }
  if (process.env.DATABASE_URL) {
    await savePostgres(blob);
    return;
  }
  if (blobConfigured()) {
    await saveVercelBlob(blob);
    return;
  }
  await saveFile(blob);
}

export async function mutateCloud<T>(fn: (blob: CloudBlob) => T | Promise<T>) {
  return await withLock(async () => {
    const blob = await loadBlob();
    const result = await fn(blob);
    await saveBlob(blob);
    return result;
  });
}

export async function readCloud<T>(fn: (blob: CloudBlob) => T | Promise<T>) {
  return await withLock(async () => fn(await loadBlob()));
}

export function persistenceMode() {
  if (d1Env()) return "d1";
  if (process.env.DATABASE_URL) return "postgres";
  if (blobConfigured()) return "blob";
  return "file";
}
