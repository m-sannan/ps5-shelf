const MAX_EDGE = 1400;
const JPEG_QUALITY = 0.82;

export async function fileToDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  const dataUrl = await readFile(file);
  return await compressDataUrl(dataUrl);
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that photo"));
    reader.readAsDataURL(file);
  });
}

async function compressDataUrl(dataUrl: string) {
  if (typeof window === "undefined" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }
  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read that photo"));
    });
    image.src = dataUrl;
    await loaded;
    const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    return dataUrl;
  }
}
