export type CopyResult = "copied" | "blocked";

function fallbackCopy(text: string) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, text.length);
  const ok = document.execCommand("copy");
  field.remove();
  return ok;
}

export async function copyText(text: string): Promise<CopyResult> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    // Permissions-Policy in embedded previews blocks Clipboard API.
  }
  try {
    if (fallbackCopy(text)) return "copied";
  } catch {
    // Same policy can also block document.execCommand("copy").
  }
  return "blocked";
}

export function selectField(element: HTMLInputElement | null) {
  if (!element) return;
  element.focus();
  element.select();
  element.setSelectionRange(0, element.value.length);
}
