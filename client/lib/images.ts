const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

export function resolveImageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.replace(/^\.\//, "");
  return `${API_URL}/${normalized}`;
}
