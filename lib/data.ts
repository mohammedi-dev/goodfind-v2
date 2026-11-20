import { db } from "@/db/client";
import { bookmarks, categories, showcaseAppearance, showcaseSettings } from "@/db/schema";
import { and, eq, getTableColumns } from "drizzle-orm";
import type { DiscoveryResource } from "@/lib/discovery";

export type Bookmark = typeof bookmarks.$inferSelect;
export type Category = typeof categories.$inferSelect;

export async function getShowcaseBookmarks() {
  return db.select({
    id: bookmarks.id,
    slug: bookmarks.slug,
    title: bookmarks.title,
    url: bookmarks.url,
    description: bookmarks.description,
    overview: bookmarks.overview,
    tags: bookmarks.tags,
    favicon: bookmarks.favicon,
    screenshot: bookmarks.screenshot,
    isFavorite: bookmarks.isFavorite,
    category: { id: categories.id, slug: categories.slug, name: categories.name },
    appearance: showcaseAppearance,
  }).from(bookmarks)
    .leftJoin(categories, eq(bookmarks.categoryId, categories.id))
    .leftJoin(showcaseSettings, eq(bookmarks.id, showcaseSettings.bookmarkId))
    .where(eq(bookmarks.isArchived, false));
}

export async function getDiscoveryResources(): Promise<DiscoveryResource[]> {
  return db.select({
    id: bookmarks.id,
    slug: bookmarks.slug,
    title: bookmarks.title,
    url: bookmarks.url,
    description: bookmarks.description,
    overview: bookmarks.overview,
    notes: bookmarks.notes,
    tags: bookmarks.tags,
    favicon: bookmarks.favicon,
    createdAt: bookmarks.createdAt,
    isFavorite: bookmarks.isFavorite,
    isArchived: bookmarks.isArchived,
    category: { id: categories.id, slug: categories.slug, name: categories.name },
  }).from(bookmarks).leftJoin(categories, eq(bookmarks.categoryId, categories.id));
}

export async function getAllBookmarks() {
  return db
    .select({ ...getTableColumns(bookmarks), category: getTableColumns(categories), appearance: showcaseAppearance })
    .from(bookmarks)
    .leftJoin(categories, eq(bookmarks.categoryId, categories.id))
    .leftJoin(showcaseSettings, eq(bookmarks.id, showcaseSettings.bookmarkId));
}

export async function getAllCategories(): Promise<Category[]> {
  return await db.select().from(categories);
}

export async function getBookmarkById(id: number): Promise<(Bookmark & { category: Category | null }) | null> {
  const results = await db
    .select()
    .from(bookmarks)
    .leftJoin(categories, eq(bookmarks.categoryId, categories.id))
    .where(eq(bookmarks.id, id))
    .limit(1);
  
  if (results.length === 0) {
    return null;
  }

  return {
    ...results[0].bookmarks,
    category: results[0].categories,
  };
}

export async function getBookmarkBySlug(slug: string): Promise<(Bookmark & { category: Category | null }) | null> {
  const results = await db
    .select()
    .from(bookmarks)
    .leftJoin(categories, eq(bookmarks.categoryId, categories.id))
    .where(and(eq(bookmarks.slug, slug), eq(bookmarks.isArchived, false)))
    .limit(1);
  
  if (results.length === 0) {
    return null;
  }

  return {
    ...results[0].bookmarks,
    category: results[0].categories,
  };
}
