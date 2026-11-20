import { Showcase } from "@/components/goodfind/showcase";
import { getShowcaseBookmarks } from "@/lib/data";
import { compareShowcaseOrder, isShowcaseCategory, showcaseCategories } from "@/lib/showcase";
import { toShowcaseResource } from "@/lib/showcase-catalog";
import { isBookmarkUrl } from "@/lib/utils";
import "./showcase.css";

type Query = Record<string, string | string[] | undefined>;

const firstValue = (value: Query[string]) => typeof value === "string" ? value : value?.[0];

export default async function Home({ searchParams }: { searchParams: Promise<Query> }) {
  const [query, bookmarks] = await Promise.all([searchParams, getShowcaseBookmarks()]);
  const resources = bookmarks
    .filter((bookmark) => isBookmarkUrl(bookmark.url))
    .sort(compareShowcaseOrder)
    .map(toShowcaseResource);
  const queryCategory = firstValue(query.category);
  const pinnedCategory = isShowcaseCategory(queryCategory);
  const initialCategory = pinnedCategory
    ? queryCategory
    : resources.some((resource) => resource.category === "software") ? "software"
      : showcaseCategories.find(({ id }) => resources.some((resource) => resource.category === id))?.id ?? "software";
  return <Showcase resources={resources} initialCategory={initialCategory} pinnedCategory={pinnedCategory} initialSearch={firstValue(query.search)?.trim() ?? ""} />;
}
