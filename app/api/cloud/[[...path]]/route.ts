import {
  createShelf,
  joinPair,
  publicShelf,
  putShelf,
  requireDevice,
  startPair,
} from "@/lib/cloud/engine";
import { isPublicId } from "@/lib/cloud/hash";
import { mutateCloud, persistenceMode, readCloud } from "@/lib/cloud/persist";
import type { Library } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function bearer(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function payloadFromShelf(
  shelf: {
    id: string;
    publicId: string;
    revision: number;
    library: Library;
    updatedAt: string;
  },
) {
  return {
    shelfId: shelf.id,
    publicId: shelf.publicId,
    revision: shelf.revision,
    library: shelf.library,
    updatedAt: shelf.updatedAt,
  };
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isLibrary(value: unknown): value is Library {
  if (!value || typeof value !== "object") return false;
  const row = value as Library;
  return Boolean(row.profile) && Array.isArray(row.games);
}

function routeKey(path: string[] | undefined) {
  return (path ?? []).join("/");
}

async function handle(
  request: NextRequest,
  path: string[] | undefined,
) {
  const key = routeKey(path);
  const secret = bearer(request);

  try {
    if (request.method === "GET" && key === "health") {
      return NextResponse.json({ ok: true, persist: persistenceMode() });
    }

    if (request.method === "GET" && key.startsWith("public/")) {
      const publicId = decodeURIComponent(key.slice("public/".length));
      const data = await readCloud((blob) => publicShelf(blob, publicId));
      if (!data) return fail("This share link is unknown.", 404);
      return NextResponse.json(data);
    }

    if (request.method === "POST" && key === "create") {
      if (!secret) return fail("Missing device key.", 401);
      const body = await readJson(request);
      const library = isLibrary(body.library) ? body.library : null;
      if (!library) return fail("A library snapshot is required.");
      const requested = typeof body.publicId === "string" ? body.publicId.trim() : "";
      const publicId = requested && isPublicId(requested) ? requested : undefined;
      const shelf = await mutateCloud(
        (blob) => createShelf(blob, { deviceSecret: secret, library, publicId }).shelf,
      );
      return NextResponse.json(payloadFromShelf(shelf));
    }

    if (request.method === "GET" && key === "shelf") {
      if (!secret) return fail("Missing device key.", 401);
      const shelf = await mutateCloud((blob) => requireDevice(blob, secret).shelf);
      return NextResponse.json(payloadFromShelf(shelf));
    }

    if (request.method === "PUT" && key === "shelf") {
      if (!secret) return fail("Missing device key.", 401);
      const body = await readJson(request);
      const library = isLibrary(body.library) ? body.library : null;
      if (!library) return fail("A library snapshot is required.");
      const shelf = await mutateCloud((blob) => putShelf(blob, { deviceSecret: secret, library }));
      return NextResponse.json(payloadFromShelf(shelf));
    }

    if (request.method === "POST" && key === "pair") {
      if (!secret) return fail("Missing device key.", 401);
      const result = await mutateCloud((blob) => startPair(blob, secret));
      return NextResponse.json(result);
    }

    if (request.method === "POST" && key === "join") {
      if (!secret) return fail("Missing device key.", 401);
      const body = await readJson(request);
      const code = typeof body.code === "string" ? body.code : "";
      if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) {
        return fail("Enter the six-digit code from your other device.");
      }
      const shelf = await mutateCloud((blob) =>
        joinPair(blob, { code, deviceSecret: secret }),
      );
      return NextResponse.json(payloadFromShelf(shelf));
    }

    return fail("Not found.", 404);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : "Cloud request failed.";
    return fail(message, status);
  }
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, path);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, path);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, path);
}
