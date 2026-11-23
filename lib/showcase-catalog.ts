import { defaultCoverAccent, githubResourceUrl, isArtworkPattern, isHexColor, readShowcaseTags, showcaseAssetUrl, showcaseCategory, showcaseImageUrl, showcaseLogoUrl } from "./showcase";
import type { Artwork, ShowcaseResource } from "./showcase";

type ResourceStyle = {
  accent: string;
  artwork: Artwork;
  platforms?: string[];
  tags?: string[];
  github?: string;
  stockFavicon?: string;
};

const resourceStyles: Record<string, ResourceStyle> = {
  "nuvio-torbox": { accent: "#a8a1ff", artwork: "rays" },
  shuttletv: { accent: "#71b5fb", artwork: "orbit" },
  vivarium: { accent: "#f58b92", artwork: "swatches" },
  arrowtv: { accent: "#82dce5", artwork: "signal" },
  "clean-your-tv": { accent: "#74c7bd", artwork: "stack" },
  ascendara: { accent: "#a794ff", artwork: "rays" },
  "pirated-games-megathread": { accent: "#a7b6c3", artwork: "terminal" },
  fmhy: { accent: "#a298fb", artwork: "orbit" },
  "search-browser": { accent: "#b8c1cc", artwork: "stack" },
  bitwarden: { accent: "#75a4ff", artwork: "grid" },
  "ad-blockers": { accent: "#e68185", artwork: "grid" },
  github: { accent: "#8c9dae", artwork: "orbit", platforms: ["Web", "iOS", "Android"], tags: ["Development"], stockFavicon: "https://github.githubassets.com/favicons/favicon.svg" },
  figma: { accent: "#b598f1", artwork: "swatches", platforms: ["Web", "macOS", "Windows"], tags: ["Design", "Collaboration"], stockFavicon: "https://static.figma.com/app/icon/1/favicon.svg" },
  notion: { accent: "#bfbab4", artwork: "grid", platforms: ["Web", "macOS", "Windows", "iOS", "Android"], tags: ["Productivity"], stockFavicon: "https://www.notion.so/images/favicon.ico" },
  react: { accent: "#5bd4ee", artwork: "rays", platforms: ["Web"], tags: ["Open Source", "Development"], github: "https://github.com/facebook/react", stockFavicon: "https://react.dev/favicon.ico" },
  coursera: { accent: "#71a4ff", artwork: "swatches", platforms: ["Web", "iOS", "Android"], tags: ["Learning"], stockFavicon: "https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/favicon-v2-96x96.png" },
  dribbble: { accent: "#ff88a9", artwork: "orbit", platforms: ["Web"], tags: ["Design"], stockFavicon: "https://cdn.dribbble.com/assets/favicon-b38525134603b9513174ec887944bde1a869eb6cd414f4d640ee48ab2a15a26b.ico" },
  chatgpt: { accent: "#78bbad", artwork: "orbit" },
  claude: { accent: "#f29771", artwork: "rays" },
  ollama: { accent: "#c5b5ff", artwork: "terminal" },
  "hugging-face": { accent: "#f4cf70", artwork: "grid" },
  steam: { accent: "#74b8ff", artwork: "orbit" },
  heroic: { accent: "#62dbd4", artwork: "stack" },
  retroarch: { accent: "#b398ff", artwork: "terminal" },
  "pcgamingwiki": { accent: "#a5cd75", artwork: "grid" },
  vlc: { accent: "#ff9d59", artwork: "record" },
  audacity: { accent: "#73b9ff", artwork: "signal" },
  jellyfin: { accent: "#bb9aff", artwork: "stack" },
  handbrake: { accent: "#eeb176", artwork: "swatches" },
};

export function getResourceStyle(slug: string): ResourceStyle | undefined {
  return Object.hasOwn(resourceStyles, slug) ? resourceStyles[slug] : undefined;
}

const defaultArtwork = { ai: "rays", software: "grid", gaming: "stack", media: "orbit" } as const;

type ShowcaseSource = Pick<ShowcaseResource, "id" | "slug" | "title" | "description" | "overview" | "url" | "favicon" | "screenshot"> & {
  tags: string | null;
  category: { slug: string } | null;
  appearance: { accent: string | null; background: string | null; pattern: string | null; logoId: string | null; artworkId: string | null } | null;
};

export function toShowcaseResource(bookmark: ShowcaseSource): ShowcaseResource {
  const editorial = getResourceStyle(bookmark.slug);
  const metadata = readShowcaseTags(bookmark.tags);
  const tags = bookmark.tags === null ? editorial?.tags ?? [] : metadata.tags;
  const category = showcaseCategory(bookmark.category?.slug, tags);
  const { appearance } = bookmark;
  const bundledFavicon = editorial ? `/showcase-icons/${bookmark.slug}.webp` : null;
  const originalFavicon = (bookmark.favicon !== editorial?.stockFavicon ? showcaseLogoUrl(bookmark.favicon) : null) ?? bundledFavicon;
  const favicon = appearance?.logoId ? showcaseAssetUrl(appearance.logoId) : originalFavicon;
  return {
    id: bookmark.id,
    slug: bookmark.slug,
    title: bookmark.title,
    description: bookmark.description,
    overview: bookmark.overview,
    url: bookmark.url,
    favicon,
    fallbackFavicon: favicon === bundledFavicon ? null : bundledFavicon,
    screenshot: appearance?.artworkId ? showcaseAssetUrl(appearance.artworkId) : showcaseImageUrl(bookmark.screenshot),
    artworkUrl: metadata.artworkUrl,
    recommendation: metadata.recommendation,
    tags,
    platforms: bookmark.tags === null ? editorial?.platforms ?? [] : metadata.platforms,
    github: metadata.github ?? (bookmark.tags === null ? githubResourceUrl(editorial?.github) : null) ?? githubResourceUrl(bookmark.url),
    category,
    accent: isHexColor(appearance?.accent) ? appearance.accent : defaultCoverAccent,
    background: isHexColor(appearance?.background) ? appearance.background : undefined,
    artwork: isArtworkPattern(appearance?.pattern) ? appearance.pattern : editorial?.artwork ?? defaultArtwork[category],
  };
}
