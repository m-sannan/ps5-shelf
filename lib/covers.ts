export type CoverHit = {
  url: string;
  label: string;
  source: "wikipedia" | "steam";
};

const UA = "CratePS5Library/1.0 (https://ps5-shelf.vercel.app)";

function cleanWiki(url: string) {
  return url.split("?")[0];
}

async function wikiJson(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
  return response.json();
}

async function wikiSummary(title: string): Promise<CoverHit | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      title?: string;
      originalimage?: { source?: string };
      thumbnail?: { source?: string };
    };
    const raw = data.originalimage?.source ?? data.thumbnail?.source;
    if (!raw || raw.toLowerCase().includes(".svg")) return null;
    return {
      url: cleanWiki(raw),
      label: data.title ?? title,
      source: "wikipedia",
    };
  } catch {
    return null;
  }
}

async function searchWikipedia(query: string): Promise<CoverHit[]> {
  const hits: CoverHit[] = [];
  for (const guess of [`${query} (video game)`, query]) {
    const summary = await wikiSummary(guess);
    if (summary) hits.push(summary);
  }

  const searchUrl =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: `${query} video game`,
      srlimit: "5",
      format: "json",
      origin: "*",
    });
  const search = await wikiJson(searchUrl);
  const titles: string[] = (search?.query?.search ?? []).map(
    (row: { title: string }) => row.title,
  );
  if (titles.length === 0) return hits;

  const imageUrl =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      titles: titles.join("|"),
      prop: "pageimages",
      piprop: "original|thumbnail",
      pithumbsize: "800",
      format: "json",
      origin: "*",
    });
  const images = await wikiJson(imageUrl);
  const pages = Object.values(images?.query?.pages ?? {}) as {
    title?: string;
    original?: { source?: string };
    thumbnail?: { source?: string };
  }[];

  for (const page of pages) {
    const raw = page.original?.source ?? page.thumbnail?.source;
    if (!raw || raw.toLowerCase().includes(".svg")) continue;
    hits.push({
      url: cleanWiki(raw),
      label: page.title ?? query,
      source: "wikipedia",
    });
  }
  return hits;
}

async function searchSteam(query: string): Promise<CoverHit[]> {
  const url =
    "https://store.steampowered.com/api/storesearch/?" +
    new URLSearchParams({ term: query, l: "english", cc: "US" });
  const response = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    items?: { id: number; name: string }[];
  };
  const hits: CoverHit[] = [];
  for (const item of data.items ?? []) {
    const name = item.name.toLowerCase();
    if (name.includes("costume") || name.includes("upgrade")) continue;
    hits.push({
      url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/library_600x900.jpg`,
      label: item.name,
      source: "steam",
    });
    if (hits.length >= 6) break;
  }
  return hits;
}

export async function searchCovers(query: string): Promise<CoverHit[]> {
  const q = query.trim();
  if (!q) return [];
  const results = await Promise.allSettled([
    searchWikipedia(q),
    searchSteam(q),
  ]);
  const hits: CoverHit[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const hit of result.value) {
      if (seen.has(hit.url)) continue;
      if (hit.url.toLowerCase().includes(".svg")) continue;
      seen.add(hit.url);
      hits.push(hit);
    }
  }
  return hits.slice(0, 12);
}
