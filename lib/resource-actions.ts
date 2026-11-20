"use server";

import { and, eq, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { bookmarks, categories, showcaseSettings } from "@/db/schema";
import { hasAdminSession } from "@/lib/admin-session";
import { prepareShowcaseImage } from "@/lib/resource-assets";
import { getResourceStyle } from "@/lib/showcase-catalog";
import {
  compareShowcaseOrder, githubResourceUrl, isArtworkPattern, isHexColor, isShowcaseCategory,
  resourceCategory, showcaseCategories, showcaseImageUrl, showcaseLogoUrl, writeShowcaseTags,
} from "@/lib/showcase";
import { generateSlug, isBookmarkUrl } from "@/lib/utils";

function refreshShowcase() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/sitemap.xml");
}

export async function saveShowcaseResource(form: FormData) {
  if (!(await hasAdminSession())) return { error: "Admin sign-in required" };
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const currentId = field("id");
  const id = Number(currentId);
  const title = field("title");
  const url = field("url");
  const slug = field("slug") || generateSlug(title);
  const category = field("category");
  const draft = field("intent") === "draft";
  const github = field("github");
  const accent = field("accent") || null;
  const background = field("background") || null;
  const pattern = field("pattern") || null;
  const logoUrl = showcaseLogoUrl(field("favicon"));
  const screenshot = showcaseImageUrl(field("screenshot"));
  const artworkUrl = showcaseImageUrl(field("artwork"));
  const ogImage = showcaseImageUrl(field("ogImage"));
  if (currentId && (!Number.isSafeInteger(id) || id < 1)) return { error: "Invalid resource ID." };
  if (!title || title.length > 120) return { error: "Enter a resource name of up to 120 characters." };
  if (!isBookmarkUrl(url) || url.length > 2048) return { error: "Enter a valid website URL." };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120 || ["admin", "api"].includes(slug)) {
    return { error: "Enter a unique page slug using letters, numbers, and hyphens." };
  }
  if (!isShowcaseCategory(category) && !(id && category === "keep")) return { error: "Choose a showcase category." };
  if (!draft && field("intent") !== "publish") return { error: "Choose Save draft or Publish." };
  if (github && !githubResourceUrl(github)) return { error: "Enter a full GitHub repository URL." };
  if ((field("favicon") && !logoUrl) || (field("screenshot") && !screenshot) ||
      (field("artwork") && !artworkUrl) || (field("ogImage") && !ogImage)) {
    return { error: "Image links must use HTTP, HTTPS, or a supported local image path." };
  }
  if ((accent && !isHexColor(accent)) || (background && !isHexColor(background)) || (pattern && !isArtworkPattern(pattern))) {
    return { error: "Choose a valid background pattern and six-digit hex colors." };
  }
  const description = field("description");
  const overview = field("overview");
  const recommendation = field("recommendation");
  if (description.length > 1000 || overview.length > 20000 || recommendation.length > 4000 ||
    field("tags").length > 1000 || field("platforms").length > 1000) {
    return { error: "Shorten the description, overview, recommendation, tags, or platforms." };
  }

  let logo, artwork;
  try {
    [logo, artwork] = await Promise.all([
      prepareShowcaseImage(form.get("logoFile"), "logo"),
      prepareShowcaseImage(form.get("artworkFile"), "artwork"),
    ]);
  } catch (error) {
    return { error: (error as Error).message };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [previous] = id ? await tx
        .select({ bookmark: bookmarks, category: categories })
        .from(bookmarks).leftJoin(categories, eq(bookmarks.categoryId, categories.id))
        .where(eq(bookmarks.id, id)).limit(1) : [];
      if (id && !previous) return { error: "This resource was removed." };

      const normalizedUrl = new URL(url);
      const rootAlias = normalizedUrl.pathname === "/" && !normalizedUrl.search && !normalizedUrl.hash
        ? (url.endsWith("/") ? url.slice(0, -1) : url + "/") : url;
      const [existing] = await tx.select({ slug: bookmarks.slug }).from(bookmarks).where(and(
        or(eq(bookmarks.slug, slug), eq(bookmarks.url, url), eq(bookmarks.url, rootAlias)),
        id ? ne(bookmarks.id, id) : undefined,
      )).limit(1);
      if (existing) return { error: existing.slug === slug ? "That page slug is already in use." : "That website URL is already in the collection." };

      let categoryId = previous?.bookmark.categoryId ?? null;
      let categorySlug = previous?.category?.slug;
      if (isShowcaseCategory(category)) {
        const [stored] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.slug, category)).limit(1);
        if (stored) {
          categoryId = stored.id;
        } else {
          categoryId = `showcase-${category}`;
          await tx.insert(categories).values({
            id: categoryId, slug: category, name: showcaseCategories.find((item) => item.id === category)!.label,
          });
        }
        categorySlug = category;
      }
      const tags = writeShowcaseTags(field("tags"), field("platforms"), github, {
        artworkUrl: artworkUrl ?? "",
        recommendation,
      });
      const previousStyle = previous && previous.bookmark.slug !== slug ? getResourceStyle(previous.bookmark.slug) : undefined;
      const keepBundledLogo = previousStyle && logoUrl === previous.bookmark.favicon &&
        (!logoUrl || logoUrl === previousStyle.stockFavicon);
      const update = {
        title, slug, url, categoryId, tags, description: description || null, overview: overview || null,
        favicon: keepBundledLogo ? `/showcase-icons/${previous.bookmark.slug}.webp` : logoUrl,
        ogImage, screenshot, isArchived: draft, isFavorite: field("favorite") === "true",
        search_results: field("searchResults") || undefined,
        updatedAt: new Date(),
      };
      const bookmarkId = id || (await tx.insert(bookmarks).values(update).returning({ id: bookmarks.id }))[0].id;
      if (id) await tx.update(bookmarks).set(update).where(eq(bookmarks.id, id));
      const changedCategory = previous && resourceCategory({ tags: previous.bookmark.tags, category: previous.category })
        !== resourceCategory({ tags, category: categorySlug ? { slug: categorySlug } : null });
      const appearance = {
        accent: accent ?? previousStyle?.accent ?? null,
        background,
        pattern: pattern ?? previousStyle?.artwork ?? null,
        ...(changedCategory ? { position: null } : {}),
        ...(logo || field("removeLogo") === "true" ? { logoId: logo?.id ?? null, logo: logo?.data ?? null } : {}),
        ...(artwork || field("removeArtwork") === "true" ? { artworkId: artwork?.id ?? null, artwork: artwork?.data ?? null } : {}),
      };
      await tx.insert(showcaseSettings).values({ bookmarkId, ...appearance })
        .onConflictDoUpdate({ target: showcaseSettings.bookmarkId, set: appearance });
      return { success: true, oldSlug: previous?.bookmark.slug };
    });
    if (result.error) return { error: result.error };
    refreshShowcase();
    revalidatePath(`/${slug}`);
    if (result.oldSlug && result.oldSlug !== slug) revalidatePath(`/${result.oldSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Error saving resource:", error);
    return { error: "Could not save this resource. Please try again." };
  }
}

export async function moveShowcaseResource(id: number, neighbourId: number, category: string, direction: -1 | 1) {
  if (!(await hasAdminSession())) return { error: "Admin sign-in required" };
  if (!isShowcaseCategory(category) || !Number.isSafeInteger(id) || !Number.isSafeInteger(neighbourId) ||
      (direction !== -1 && direction !== 1)) {
    return { error: "Invalid resource order." };
  }
  try {
    const moved = await db.transaction(async (tx) => {
      const rows = await tx.select({
        id: bookmarks.id, isFavorite: bookmarks.isFavorite, tags: bookmarks.tags,
        category: { slug: categories.slug },
        appearance: { bookmarkId: showcaseSettings.bookmarkId, position: showcaseSettings.position },
      }).from(bookmarks).leftJoin(categories, eq(bookmarks.categoryId, categories.id))
        .leftJoin(showcaseSettings, eq(bookmarks.id, showcaseSettings.bookmarkId));
      const ordered = rows.filter((item) => resourceCategory(item) === category).sort(compareShowcaseOrder);
      const from = ordered.findIndex((item) => item.id === id);
      const to = ordered.findIndex((item) => item.id === neighbourId);
      if (from < 0 || to < 0 || to - from !== direction) return false;
      [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
      const positions = ordered.map((item, position) => ({ bookmarkId: item.id, position }));
      // Keep each statement below SQLite's bind-parameter limit.
      for (let offset = 0; offset < positions.length; offset += 100) {
        await tx.insert(showcaseSettings).values(positions.slice(offset, offset + 100))
          .onConflictDoUpdate({ target: showcaseSettings.bookmarkId, set: { position: sql`excluded.position` } });
      }
      return true;
    });
    refreshShowcase();
    return moved ? { success: true } : { error: "The order changed. Review the refreshed list and try again." };
  } catch (error) {
    console.error("Error reordering resources:", error);
    return { error: "Could not move the resource. Please try again." };
  }
}
