import type { Artwork } from "./showcase";

type ResourceStyle = {
  accent: string;
  artwork: Artwork;
  platforms?: string[];
  tags?: string[];
  github?: string;
  stockFavicon?: string;
};

const resourceStyles: Record<string, ResourceStyle> = {
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
