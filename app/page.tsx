import { Showcase } from "@/components/goodfind/showcase";
import { getShowcaseBookmarks } from "@/lib/data";
import { compareShowcaseOrder, defaultShowcaseCategory } from "@/lib/showcase";
import { toShowcaseResource } from "@/lib/showcase-catalog";
import { isBookmarkUrl } from "@/lib/utils";
import "./showcase.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const bookmarks = await getShowcaseBookmarks();
  const resources = bookmarks
    .filter((bookmark) => isBookmarkUrl(bookmark.url))
    .sort(compareShowcaseOrder)
    .map(toShowcaseResource);
  return <Showcase resources={resources} homeCategory={defaultShowcaseCategory(resources)} />;
}
