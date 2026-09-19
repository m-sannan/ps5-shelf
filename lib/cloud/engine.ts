import type { Library } from "../types";
import { toPublicLibrary } from "../public-view";
import { hashSecret, isPublicId, newId, newPairingCode, newPublicId } from "./hash";

export const PAIR_TTL_MS = 5 * 60 * 1000;

export type ShelfRecord = {
  id: string;
  publicId: string;
  revision: number;
  library: Library;
  createdAt: string;
  updatedAt: string;
};

export type DeviceRecord = {
  id: string;
  shelfId: string;
  secretHash: string;
  createdAt: string;
  lastSeenAt: string;
};

export type PairRecord = {
  code: string;
  shelfId: string;
  expiresAt: number;
};

export type CloudBlob = {
  shelves: ShelfRecord[];
  devices: DeviceRecord[];
  pairs: PairRecord[];
};

export function emptyBlob(): CloudBlob {
  return { shelves: [], devices: [], pairs: [] };
}

function nowIso() {
  return new Date().toISOString();
}

function purge(blob: CloudBlob) {
  const now = Date.now();
  blob.pairs = blob.pairs.filter((row) => row.expiresAt > now);
}

function deviceOf(blob: CloudBlob, secret: string) {
  const secretHash = hashSecret(secret);
  return blob.devices.find((row) => row.secretHash === secretHash) ?? null;
}

function shelfOf(blob: CloudBlob, shelfId: string) {
  return blob.shelves.find((row) => row.id === shelfId) ?? null;
}

export function requireDevice(blob: CloudBlob, secret: string) {
  purge(blob);
  const device = deviceOf(blob, secret);
  if (!device) {
    throw Object.assign(new Error("This device is not paired to a shelf."), {
      status: 401,
    });
  }
  const shelf = shelfOf(blob, device.shelfId);
  if (!shelf) {
    throw Object.assign(new Error("That shelf no longer exists."), {
      status: 404,
    });
  }
  device.lastSeenAt = nowIso();
  return { device, shelf };
}

export function createShelf(
  blob: CloudBlob,
  input: { deviceSecret: string; library: Library; publicId?: string },
) {
  purge(blob);
  if (deviceOf(blob, input.deviceSecret)) {
    throw Object.assign(new Error("This device already belongs to a shelf."), {
      status: 409,
    });
  }
  const createdAt = nowIso();
  const requested = input.publicId?.trim();
  const publicId =
    requested && isPublicId(requested) && !blob.shelves.some((row) => row.publicId === requested)
      ? requested
      : newPublicId();
  const shelf: ShelfRecord = {
    id: newId("shelf"),
    publicId,
    revision: 1,
    library: structuredClone(input.library),
    createdAt,
    updatedAt: createdAt,
  };
  const device: DeviceRecord = {
    id: newId("dev"),
    shelfId: shelf.id,
    secretHash: hashSecret(input.deviceSecret),
    createdAt,
    lastSeenAt: createdAt,
  };
  blob.shelves.push(shelf);
  blob.devices.push(device);
  return { shelf, device };
}

export function putShelf(
  blob: CloudBlob,
  input: { deviceSecret: string; library: Library },
) {
  const { device, shelf } = requireDevice(blob, input.deviceSecret);
  shelf.library = structuredClone(input.library);
  shelf.revision += 1;
  shelf.updatedAt = nowIso();
  device.lastSeenAt = shelf.updatedAt;
  return shelf;
}

export function startPair(blob: CloudBlob, deviceSecret: string) {
  const { shelf } = requireDevice(blob, deviceSecret);
  purge(blob);
  blob.pairs = blob.pairs.filter((row) => row.shelfId !== shelf.id);
  let code = newPairingCode();
  while (blob.pairs.some((row) => row.code === code)) {
    code = newPairingCode();
  }
  const row: PairRecord = {
    code,
    shelfId: shelf.id,
    expiresAt: Date.now() + PAIR_TTL_MS,
  };
  blob.pairs.push(row);
  return { code, expiresIn: PAIR_TTL_MS / 1000 };
}

export function joinPair(blob: CloudBlob, input: { code: string; deviceSecret: string }) {
  purge(blob);
  if (deviceOf(blob, input.deviceSecret)) {
    throw Object.assign(new Error("This device already belongs to a shelf."), {
      status: 409,
    });
  }
  const code = input.code.replace(/\s/g, "");
  const match = blob.pairs.find((row) => row.code === code);
  if (!match) {
    throw Object.assign(new Error("That code is wrong or has expired."), {
      status: 404,
    });
  }
  const shelf = shelfOf(blob, match.shelfId);
  blob.pairs = blob.pairs.filter((row) => row.code !== match.code);
  if (!shelf) {
    throw Object.assign(new Error("That shelf no longer exists."), {
      status: 404,
    });
  }
  const createdAt = nowIso();
  blob.devices.push({
    id: newId("dev"),
    shelfId: shelf.id,
    secretHash: hashSecret(input.deviceSecret),
    createdAt,
    lastSeenAt: createdAt,
  });
  return shelf;
}

export function publicShelf(blob: CloudBlob, publicId: string) {
  purge(blob);
  const shelf = blob.shelves.find((row) => row.publicId === publicId);
  if (!shelf) return null;
  const published = toPublicLibrary(shelf.library);
  return {
    publicId: shelf.publicId,
    updatedAt: shelf.updatedAt,
    privateShelf: published.privateShelf,
    profile: published.profile,
    games: published.games,
  };
}
