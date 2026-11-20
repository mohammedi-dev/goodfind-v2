import { Showcase } from "@/components/goodfind/showcase";
import { getShowcaseBookmarks } from "@/lib/data";
import { githubResourceUrl, isShowcaseCategory, readShowcaseTags, showcaseCategories, showcaseCategory, showcaseImageUrl } from "@/lib/showcase";
import type { Artwork, ShowcaseResource } from "@/lib/showcase";
import { getResourceStyle } from "@/lib/showcase-catalog";
import { isBookmarkUrl } from "@/lib/utils";
import "./showcase.css";

type Query = Record<string, string | string[] | undefined>;

const defaultStyles = {
  ai: { accent: "#ac9afa", artwork: "rays" },
  software: { accent: "#87a8f4", artwork: "grid" },
  gaming: { accent: "#8fcfa7", artwork: "stack" },
  media: { accent: "#e9a583", artwork: "orbit" },
} satisfies Record<string, { accent: string; artwork: Artwork }>;

const firstValue = (value: Query[string]) => typeof value === "string" ? value : value?.[0];

export default async function Home({ searchParams }: { searchParams: Promise<Query> }) {
  const [query, bookmarks] = await Promise.all([searchParams, getShowcaseBookmarks()]);
  const resources: ShowcaseResource[] = bookmarks
    .filter((bookmark) => isBookmarkUrl(bookmark.url))
    .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.id - b.id)
    .map((bookmark) => {
      const editorial = getResourceStyle(bookmark.slug);
      const metadata = readShowcaseTags(bookmark.tags);
      const tags = bookmark.tags === null ? editorial?.tags ?? [] : metadata.tags;
      const category = showcaseCategory(bookmark.category?.slug, tags);
      const style = editorial ?? defaultStyles[category];
      const bundledFavicon = editorial ? `/showcase-icons/${bookmark.slug}.webp` : null;
      const favicon = bookmark.favicon && bookmark.favicon !== editorial?.stockFavicon
        ? bookmark.favicon : bundledFavicon;
      return {
        id: bookmark.id,
        slug: bookmark.slug,
        title: bookmark.title,
        description: bookmark.description,
        overview: bookmark.overview,
        url: bookmark.url,
        favicon,
        fallbackFavicon: favicon === bundledFavicon ? null : bundledFavicon,
        screenshot: showcaseImageUrl(bookmark.screenshot),
        artworkUrl: metadata.artworkUrl,
        recommendation: metadata.recommendation,
        tags,
        platforms: bookmark.tags === null ? editorial?.platforms ?? [] : metadata.platforms,
        github: metadata.github ?? (bookmark.tags === null ? githubResourceUrl(editorial?.github) : null) ?? githubResourceUrl(bookmark.url),
        category,
        accent: style.accent,
        artwork: style.artwork,
      };
    });
  const queryCategory = firstValue(query.category);
  const pinnedCategory = isShowcaseCategory(queryCategory);
  const initialCategory = pinnedCategory
    ? queryCategory
    : resources.some((resource) => resource.category === "software") ? "software"
      : showcaseCategories.find(({ id }) => resources.some((resource) => resource.category === id))?.id ?? "software";
  return <Showcase resources={resources} initialCategory={initialCategory} pinnedCategory={pinnedCategory} initialSearch={firstValue(query.search)?.trim() ?? ""} />;
}
