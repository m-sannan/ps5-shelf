import type { Library } from "../types";

export type CloudSession = {
  deviceSecret: string;
  shelfId: string;
  publicId: string;
  revision: number;
};

export type CloudShelfPayload = {
  shelfId: string;
  publicId: string;
  revision: number;
  library: Library;
  updatedAt: string;
};

export type CloudErrorBody = {
  error: string;
  code?: string;
};
