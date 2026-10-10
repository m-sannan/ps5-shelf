import { copyText } from "./copy-text";

export type ShareOutcome = "shared" | "saved" | "copied" | "blocked";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function linkText(text: string, url?: string) {
  const line = text.trim();
  if (!url) return line;
  if (!line) return url;
  return line.includes(url) ? line : `${line}\n${url}`;
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Share a URL from the tap itself. Do not await anything before calling this. */
export async function shareLink(input: {
  title: string;
  text?: string;
  url: string;
}): Promise<ShareOutcome> {
  const text = linkText(input.text ?? "", input.url);
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  try {
    if (typeof nav.share === "function") {
      await nav.share({ title: input.title, text, url: input.url });
      return "shared";
    }
  } catch (error) {
    if (isAbort(error)) return "blocked";
  }
  const copied = await copyText(input.url);
  return copied === "copied" ? "copied" : "blocked";
}

export async function shareBlob(input: {
  blob: Blob;
  filename: string;
  title: string;
  text: string;
  url?: string;
}): Promise<ShareOutcome> {
  const file = new File([input.blob], input.filename, { type: input.blob.type || "image/png" });
  const text = linkText(input.text, input.url);
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };

  try {
    if (typeof nav.share === "function") {
      const filesOk = !nav.canShare || nav.canShare({ files: [file] });
      if (filesOk) {
        // Android rejects a share that mixes files with a url, so the link rides in the text.
        await nav.share({ title: input.title, text, files: [file] });
        return "shared";
      }
      if (input.url) {
        await nav.share({ title: input.title, text, url: input.url });
        return "shared";
      }
    }
  } catch (error) {
    if (isAbort(error)) return "blocked";
    try {
      if (input.url && typeof nav.share === "function") {
        await nav.share({ title: input.title, text, url: input.url });
        return "shared";
      }
    } catch (again) {
      if (isAbort(again)) return "blocked";
    }
  }

  if (input.url) {
    const copied = await copyText(input.url);
    if (copied === "copied") return "copied";
  }
  saveBlob(input.blob, input.filename);
  return "saved";
}

export function canvasPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not make the image."));
    }, "image/png");
  });
}
