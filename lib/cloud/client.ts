import type { Library } from "../types";
import type { CloudErrorBody, CloudSession, CloudShelfPayload } from "./types";

const BASE = process.env.NEXT_PUBLIC_CLOUD_API ?? "/api/cloud";

async function request<T>(
  path: string,
  init: RequestInit & { deviceSecret?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.deviceSecret) {
    headers.set("Authorization", `Bearer ${init.deviceSecret}`);
  }
  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await response.text();
  let body: T | CloudErrorBody | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as T | CloudErrorBody;
    } catch {
      body = { error: text } as CloudErrorBody;
    }
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && body.error
        ? body.error
        : `Cloud request failed (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status });
  }
  return body as T;
}

export function generateDeviceSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createCloudShelf(input: {
  deviceSecret: string;
  library: Library;
  publicId?: string;
}) {
  const payload = await request<CloudShelfPayload>("/create", {
    method: "POST",
    deviceSecret: input.deviceSecret,
    body: JSON.stringify({ library: input.library, publicId: input.publicId }),
  });
  const session: CloudSession = {
    deviceSecret: input.deviceSecret,
    shelfId: payload.shelfId,
    publicId: payload.publicId,
    revision: payload.revision,
  };
  return { session, library: payload.library };
}

export async function pullCloudShelf(deviceSecret: string) {
  return await request<CloudShelfPayload>("/shelf", {
    method: "GET",
    deviceSecret,
  });
}

export async function pushCloudShelf(input: {
  deviceSecret: string;
  library: Library;
}) {
  return await request<CloudShelfPayload>("/shelf", {
    method: "PUT",
    deviceSecret: input.deviceSecret,
    body: JSON.stringify({ library: input.library }),
  });
}

export async function startDevicePair(deviceSecret: string) {
  return await request<{ code: string; expiresIn: number }>("/pair", {
    method: "POST",
    deviceSecret,
  });
}

export async function joinDevicePair(input: { code: string; deviceSecret: string }) {
  const payload = await request<CloudShelfPayload>("/join", {
    method: "POST",
    deviceSecret: input.deviceSecret,
    body: JSON.stringify({ code: input.code }),
  });
  const session: CloudSession = {
    deviceSecret: input.deviceSecret,
    shelfId: payload.shelfId,
    publicId: payload.publicId,
    revision: payload.revision,
  };
  return { session, library: payload.library };
}

export async function fetchPublicShelf(publicId: string) {
  return await request<{
    publicId: string;
    updatedAt: string;
    privateShelf?: boolean;
    profile: Library["profile"];
    games: Library["games"];
  }>(`/public/${encodeURIComponent(publicId)}`);
}

export function publicShelfPath(publicId: string) {
  return `/s/${encodeURIComponent(publicId)}`;
}

export function statusOf(error: unknown) {
  return (error as { status?: number })?.status ?? 0;
}
