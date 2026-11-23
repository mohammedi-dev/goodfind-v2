import { isBookmarkUrl } from "./utils";

export const showcaseCategories = [
  { id: "ai", label: "AI" },
  { id: "software", label: "Software" },
  { id: "gaming", label: "Gaming" },
  { id: "media", label: "Media" },
] as const;

export type ShowcaseCategory = (typeof showcaseCategories)[number]["id"];
export const artworkPatterns = ["orbit", "stack", "grid", "rays", "signal", "record", "swatches", "terminal"] as const;
export type Artwork = (typeof artworkPatterns)[number];

export function isArtworkPattern(value: string | null | undefined): value is Artwork {
  return artworkPatterns.some((pattern) => pattern === value);
}

export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && /^#[a-f\d]{6}$/i.test(value);
}

export const showcaseAssetUrl = (id: string) => `/api/showcase-assets/${id}`;

export type ShowcaseResource = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  overview: string | null;
  url: string;
  favicon: string | null;
  fallbackFavicon: string | null;
  screenshot: string | null;
  artworkUrl: string | null;
  recommendation: string | null;
  tags: string[];
  platforms: string[];
  github: string | null;
  category: ShowcaseCategory;
  accent: string;
  artwork: Artwork;
  background?: string;
};

const categoryAliases: Record<ShowcaseCategory, string[]> = {
  ai: ["ai", "ai learning", "artificial intelligence", "ai tools", "machine learning"],
  software: ["software"],
  gaming: ["gaming", "gaming utilities", "mods", "emulation", "game launchers"],
  media: ["media", "music media", "music and media", "music", "audio", "video", "streaming"],
};

const normalize = (text: string) => text.toLowerCase().trim().replace(/[-_&\s]+/g, " ");

export function showcaseCategory(category?: string, tags: string[] = []): ShowcaseCategory {
  const candidates = [category || "", ...tags].map(normalize);
  for (const candidate of candidates) {
    const match = showcaseCategories.find(({ id }) => categoryAliases[id].includes(candidate));
    if (match) return match.id;
  }
  return "software";
}

type ShowcaseGrouping = { tags: string | null; category: { slug: string } | null };
type ShowcaseOrder = { id: number; isFavorite: boolean; appearance: { position: number | null } | null };

export function resourceCategory(resource: ShowcaseGrouping): ShowcaseCategory {
  return showcaseCategory(resource.category?.slug, readShowcaseTags(resource.tags).tags);
}

export function compareShowcaseOrder(a: ShowcaseOrder, b: ShowcaseOrder) {
  const previous = a.appearance?.position ?? Infinity;
  const next = b.appearance?.position ?? Infinity;
  return (previous === next ? 0 : previous - next) || Number(b.isFavorite) - Number(a.isFavorite) || a.id - b.id;
}

export function isShowcaseCategory(value: string | undefined): value is ShowcaseCategory {
  return showcaseCategories.some(({ id }) => id === value);
}

export function defaultShowcaseCategory(resources: Pick<ShowcaseResource, "category">[]): ShowcaseCategory {
  if (resources.some(({ category }) => category === "software")) return "software";
  return showcaseCategories.find(({ id }) => resources.some(({ category }) => category === id))?.id ?? "software";
}

export function githubResourceUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:" && url.hostname === "github.com" && !url.username && !url.password &&
        url.pathname.split("/").filter(Boolean).length >= 2) return url.href;
  } catch {
    // An incomplete or unrelated URL is not a repository link.
  }
  return null;
}

function splitList(value?: string | null) {
  return [...new Set((value || "").split(",").map((item) => item.trim()).filter(Boolean))];
}

export function showcaseImageUrl(value?: string | null): string | null {
  const source = value?.trim();
  if (!source) return null;
  if (source.startsWith("/resources/")) {
    const origin = "https://showcase.invalid";
    const url = new URL(source, origin);
    if (url.origin === origin && url.pathname.startsWith("/resources/")) {
      return url.pathname + url.search;
    }
  }
  return isBookmarkUrl(source) ? source : null;
}

export function showcaseLogoUrl(value?: string | null): string | null {
  return value && /^\/showcase-icons\/[a-z\d-]+\.webp$/.test(value) ? value : showcaseImageUrl(value);
}

export function readShowcaseTags(value?: string | null) {
  const items = splitList(value);
  const platforms = items.filter((item) => item.toLowerCase().startsWith("platform:"))
    .map((item) => item.slice("platform:".length).trim()).filter(Boolean);
  const github = items.find((item) => item.toLowerCase().startsWith("github:"));
  function readExtra(key: string) {
    const item = items.find((entry) => entry.toLowerCase().startsWith(`${key}:`));
    if (!item) return null;
    try {
      return decodeURIComponent(item.slice(key.length + 1)).trim() || null;
    } catch {
      return null;
    }
  }
  return {
    tags: items.filter((item) => !/^(platform|github|artwork|recommendation):/i.test(item)),
    platforms,
    github: githubResourceUrl(github?.slice("github:".length)),
    artworkUrl: showcaseImageUrl(readExtra("artwork")),
    recommendation: readExtra("recommendation"),
  };
}

export function writeShowcaseTags(tags: string, platforms: string, github: string, extras?: {
  artworkUrl: string;
  recommendation: string;
}) {
  const parsed = readShowcaseTags(tags);
  const repo = githubResourceUrl(github);
  const artwork = showcaseImageUrl(extras?.artworkUrl);
  const recommendation = extras?.recommendation.trim();
  return [
    ...parsed.tags,
    ...splitList(platforms).map((platform) => `platform:${platform}`),
    ...(repo ? [`github:${repo}`] : []),
    ...(artwork ? [`artwork:${encodeURIComponent(artwork)}`] : []),
    ...(recommendation ? [`recommendation:${encodeURIComponent(recommendation)}`] : []),
  ].join(", ");
}
