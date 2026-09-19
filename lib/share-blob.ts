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

export async function shareBlob(input: {
  blob: Blob;
  filename: string;
  title: string;
  text: string;
  url?: string;
}): Promise<ShareOutcome> {
  const file = new File([input.blob], input.filename, { type: input.blob.type || "image/png" });
  const payload = {
    title: input.title,
    text: input.text,
    url: input.url,
    files: [file],
  };

  try {
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };
    if (typeof nav.share === "function") {
      if (!nav.canShare || nav.canShare({ files: [file] })) {
        await nav.share(payload);
        return "shared";
      }
      await nav.share({ title: input.title, text: input.text, url: input.url });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "blocked";
  }

  if (input.url) {
    const copied = await copyText(input.url);
    saveBlob(input.blob, input.filename);
    return copied === "copied" ? "copied" : "saved";
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
