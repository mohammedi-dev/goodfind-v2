import type { Bookmark, Category } from "@/lib/data";

export type DiscoveryResource = Pick<
  Bookmark,
  "id" | "slug" | "title" | "url" | "description" | "overview" | "notes" |
  "tags" | "favicon" | "createdAt" | "isFavorite" | "isArchived"
> & { category: Pick<Category, "id" | "slug" | "name"> | null };

type Subtopic = { id: string; name: string; matches: string[] };
type Topic = { id: string; name: string; subtopics: Subtopic[] };

export const topics: Topic[] = [
  { id: "ai-learning", name: "AI & Learning", subtopics: [
    { id: "ai-tools", name: "AI tools", matches: ["ai", "artificial intelligence", "ai tools", "machine learning"] },
    { id: "ai-workflows", name: "AI workflows", matches: ["ai workflows", "automation", "prompt engineering"] },
    { id: "courses", name: "Courses & tutorials", matches: ["learning", "education", "tutorials", "courses"] },
  ] },
  { id: "gaming", name: "Gaming", subtopics: [
    { id: "launchers", name: "Launchers & utilities", matches: ["gaming", "launchers", "gaming utilities"] },
    { id: "mods", name: "Mods", matches: ["mods", "modding"] },
    { id: "emulation", name: "Emulation", matches: ["emulation", "emulators"] },
  ] },
  { id: "media", name: "Music & Media", subtopics: [
    { id: "music", name: "Music & audio", matches: ["music", "audio"] },
    { id: "video", name: "Video & streaming", matches: ["media", "video", "streaming"] },
    { id: "clients", name: "Alternative clients", matches: ["alternative clients", "modified clients"] },
  ] },
  { id: "software", name: "Software", subtopics: [
    { id: "productivity", name: "Productivity", matches: ["software", "productivity", "notes"] },
    { id: "browsers", name: "Browsers", matches: ["browsers", "browser"] },
    { id: "design", name: "Design", matches: ["design", "design tools"] },
  ] },
  { id: "open-source", name: "Open Source", subtopics: [
    { id: "alternatives", name: "Open-source alternatives", matches: ["open source", "open source alternatives", "foss"] },
    { id: "self-hosting", name: "Self-hosting", matches: ["self hosting", "self hosted"] },
  ] },
  { id: "privacy-security", name: "Privacy & Security", subtopics: [
    { id: "privacy", name: "Privacy tools", matches: ["privacy", "ad blocking", "adblock", "vpn"] },
    { id: "security", name: "Security", matches: ["security", "cybersecurity", "password managers"] },
  ] },
  { id: "development", name: "Development", subtopics: [
    { id: "web", name: "Web development", matches: ["development", "web development", "frontend", "backend"] },
    { id: "dev-tools", name: "Developer tools", matches: ["developer tools", "devtools", "cli", "git"] },
  ] },
  { id: "utilities", name: "Utilities", subtopics: [
    { id: "web-utilities", name: "Web utilities", matches: ["utilities", "web utilities", "internet resources"] },
    { id: "desktop-utilities", name: "Desktop utilities", matches: ["desktop utilities", "system utilities"] },
  ] },
];

export const collections = [
  { id: "web-starter", name: "Build for the web", description: "Tools for designing, coding, and sharing your next project.", topics: ["development"], subtopics: ["design"] },
  { id: "work-better", name: "A better workday", description: "A short list for capturing ideas and keeping work organized.", topics: [], subtopics: ["productivity"] },
  { id: "keep-learning", name: "Keep learning", description: "Courses and tutorials for the next skill on your list.", topics: [], subtopics: ["courses"] },
];

export const discoveryPageSize = 18;

export function discoveryHref(params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  return query.size ? `/?${query}` : "/";
}

export function resourceTags(tags: string | null) {
  return [...new Set(tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [])];
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[-_\s]+/g, " ");
}

function resourceKeys(resource: DiscoveryResource) {
  return new Set([
    resource.category?.slug,
    resource.category?.name,
    ...resourceTags(resource.tags),
  ].filter((value): value is string => Boolean(value)).map(normalize));
}

function matchesSubtopic(keys: Set<string>, subtopic: Subtopic) {
  return subtopic.matches.some((match) => keys.has(match));
}

export function matchesTopic(resource: DiscoveryResource, topic: Topic, subtopicId?: string) {
  const keys = resourceKeys(resource);
  return topic.subtopics.some((subtopic) =>
    (!subtopicId || subtopic.id === subtopicId) && matchesSubtopic(keys, subtopic),
  );
}

export function matchesCollection(resource: DiscoveryResource, collection: (typeof collections)[number]) {
  const keys = resourceKeys(resource);
  return topics.some((topic) => topic.subtopics.some((subtopic) =>
    (collection.topics.includes(topic.id) || collection.subtopics.includes(subtopic.id)) &&
      matchesSubtopic(keys, subtopic),
  ));
}

export function matchesSearch(resource: DiscoveryResource, search: string) {
  const term = search.toLowerCase();
  return [
    resource.title, resource.description, resource.category?.name,
    resource.notes, resource.overview, resource.tags, resource.url,
  ].some((value) => value?.toLowerCase().includes(term));
}
