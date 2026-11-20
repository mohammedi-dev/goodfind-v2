"use server";

import { db } from "@/db/client";
import { bookmarks, categories } from "@/db/schema";
import { generateSlug, isBookmarkUrl } from "@/lib/utils";
import { hasAdminSession } from "@/lib/admin-session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Exa from "exa-js";
import { generateOverview, getUrlMetadata } from "@/lib/enrichment";

const signInError = { error: "Admin sign-in required" };

export type ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
  data?: any;
  progress?: {
    current: number;
    total: number;
    currentUrl?: string;
    lastAdded?: string;
  };
};

type BookmarkData = {
  title: string;
  description: string;
  url: string;
  overview: string;
  search_results: string;
  favicon: string;
  ogImage: string;
  slug: string;
  categoryId: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type GeneratedContent = {
  title: string;
  description: string;
  url: string;
  overview: string;
  search_results: string;
  favicon: string;
  ogImage: string;
  slug: string;
  error?: string;
};

// Category Actions
export async function createCategory(
  prevState: ActionState | null,
  formData: {
    name: string;
    description: string;
    slug: string;
    color: string;
    icon: string;
  },
): Promise<ActionState> {
  if (!(await hasAdminSession())) return signInError;
  try {
    const name = formData.name;
    const description = formData.description;
    const slug = formData.slug;
    const color = formData.color;
    const icon = formData.icon;
    const id = slug; // Using slug as the ID since it's unique

    await db.insert(categories).values({
      id,
      name,
      description,
      slug,
      color,
      icon,
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Error creating category:", err);
    return { error: "Failed to create category" };
  }
}

export async function updateCategory(
  prevState: ActionState | null,
  formData: {
    id: string;
    name: string;
    description: string;
    slug: string;
    color: string;
    icon: string;
  },
): Promise<ActionState> {
  if (!(await hasAdminSession())) return signInError;
  try {
    if (!formData) {
      return { error: "No form data provided" };
    }

    const id = formData.id;
    if (!id) {
      return { error: "No category ID provided" };
    }

    const name = formData.name;
    const description = formData.description;
    const slug = formData.slug;
    const color = formData.color;
    const icon = formData.icon;

    await db
      .update(categories)
      .set({
        name,
        description,
        slug,
        color,
        icon,
      })
      .where(eq(categories.id, id));

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    console.error("Error updating category:", err);
    return { error: "Failed to update category" };
  }
}

export async function deleteCategory(
  prevState: ActionState | null,
  formData: {
    id: string;
  },
): Promise<ActionState> {
  if (!(await hasAdminSession())) return signInError;
  try {
    if (!formData) {
      return { error: "No form data provided" };
    }

    const id = formData.id;
    if (!id) {
      return { error: "No category ID provided" };
    }

    await db.delete(categories).where(eq(categories.id, id));

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    console.error("Error deleting category:", err);
    return { error: "Failed to delete category" };
  }
}

// Bookmark Actions
export async function createBookmark(
  prevState: ActionState | null,
  formData: {
    title: string;
    description: string;
    url: string;
    slug: string;
    overview: string;
    favicon: string;
    ogImage: string;
    search_results: string;
    categoryId: string;
    isFavorite: string;
    isArchived: string;
  },
): Promise<ActionState> {
  if (!(await hasAdminSession())) return signInError;
  try {
    const title = formData.title;
    const description = formData.description;
    const url = formData.url;
    let slug = formData.slug;
    const overview = formData.overview;
    const favicon = formData.favicon;
    const ogImage = formData.ogImage;
    const search_results = formData.search_results;
    const categoryId = formData.categoryId;
    const isFavorite = formData.isFavorite === "true";
    const isArchived = formData.isArchived === "true";
    if (!isBookmarkUrl(url)) return { error: "A valid HTTP(S) URL is required" };

    // Generate slug if not provided
    if (!slug) {
      slug = generateSlug(title);
    }

    await db.insert(bookmarks).values({
      title,
      slug,
      url,
      description,
      categoryId: categoryId === "none" ? null : categoryId,
      search_results: search_results || null,
      isFavorite,
      isArchived,
      overview,
      favicon,
      ogImage,
    });

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    console.error("Error creating bookmark:", err);
    return { error: "Failed to create bookmark" };
  }
}

export async function updateBookmark(
  prevState: ActionState | null,
  formData: {
    id: string;
    title: string;
    description: string;
    url: string;
    slug: string;
    overview: string;
    favicon: string;
    ogImage: string;
    search_results: string;
    categoryId: string;
    isFavorite: string;
    isArchived: string;
  },
): Promise<ActionState> {
  if (!(await hasAdminSession())) return signInError;
  try {
    if (!formData) {
      return { error: "No form data provided" };
    }

    const id = formData.id;
    if (!id) {
      return { error: "No bookmark ID provided" };
    }

    const title = formData.title;
    const description = formData.description;
    const url = formData.url;
    let slug = formData.slug;
    const overview = formData.overview;
    const favicon = formData.favicon;
    const ogImage = formData.ogImage;
    const search_results = formData.search_results;
    const categoryId = formData.categoryId;
    const isFavorite = formData.isFavorite === "true";
    const isArchived = formData.isArchived === "true";
    if (!isBookmarkUrl(url)) return { error: "A valid HTTP(S) URL is required" };

    // Generate slug if not provided
    if (!slug) {
      slug = generateSlug(title);
    }

    await db
      .update(bookmarks)
      .set({
        title,
        slug,
        url,
        description,
        categoryId: categoryId === "none" ? null : categoryId,
        search_results: search_results || null,
        overview,
        favicon,
        ogImage,
        isFavorite,
        isArchived,
      })
      .where(eq(bookmarks.id, Number(id)));

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    console.error("Error updating bookmark:", err);
    return { error: "Failed to update bookmark" };
  }
}

export async function deleteBookmark(
  prevState: ActionState | null,
  formData: {
    id: string;
    url: string;
  },
): Promise<ActionState> {
  if (!(await hasAdminSession())) return signInError;
  try {
    if (!formData) {
      return { error: "No form data provided" };
    }

    const id = formData.id;
    if (!id) {
      return { error: "No bookmark ID provided" };
    }

    const [deleted] = await db.delete(bookmarks).where(eq(bookmarks.id, Number(id)))
      .returning({ slug: bookmarks.slug });
    if (!deleted) return { error: "Bookmark not found" };

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/${deleted.slug}`);

    return { success: true };
  } catch (err) {
    console.error("Error deleting bookmark:", err);
    return { error: "Failed to delete bookmark" };
  }
}

// Helper function to handle errors
type ErrorResponse = {
  message: string;
  status: number;
};

export async function handleError(
  error: Error | ErrorResponse,
): Promise<{ message: string }> {
  if (error instanceof Error) {
    return { message: error.message };
  } else {
    return { message: error.message };
  }
}

export async function bulkUploadBookmarks(
  prevState: ActionState | null,
  formData: {
    urls: string;
  },
): Promise<ActionState> {
  if (!(await hasAdminSession())) return signInError;
  try {
    const urls = formData.urls;
    if (!urls) {
      return { error: "No URLs provided" };
    }

    if (!process.env.EXASEARCH_API_KEY || !process.env.ANTHROPIC_API_KEY) {
      return { error: "Bulk import requires Exa and Anthropic configuration" };
    }
    const urlList = urls.split("\n").map((url) => url.trim()).filter(Boolean);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < urlList.length; i++) {
      const url = urlList[i].trim();
      if (!url) continue;

      try {
        const content = await generateContent(url);
        if (content.error) {
          errorCount++;
          continue;
        }

        // Create bookmark data with proper types
        const bookmarkData: BookmarkData = {
          title: content.title,
          description: content.description,
          url: content.url,
          overview: content.overview,
          search_results: content.search_results,
          favicon: content.favicon,
          ogImage: content.ogImage,
          slug: content.slug,
          categoryId: null,
          isFavorite: false,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.insert(bookmarks).values(bookmarkData);

        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error processing URL ${url}:`, error);
      }
    }

    if (successCount === 0) return { error: "No bookmarks were imported" };
    revalidatePath("/admin");
    revalidatePath("/");
    return {
      success: true,
      message: `Successfully imported ${successCount} bookmarks. ${errorCount > 0 ? `Failed to import ${errorCount} URLs.` : ""}`,
      progress: {
        current: urlList.length,
        total: urlList.length,
      },
    };
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to process bulk upload",
    };
  }
}

// URL Scraping Action
export async function scrapeUrl(
  prevState: ActionState | null,
  formData: {
    url: string;
  },
): Promise<ActionState> {
  if (!(await hasAdminSession())) return signInError;
  try {
    const url = formData.url;
    if (!url) return { error: "URL is required" };

    const apiKey = process.env.EXASEARCH_API_KEY;
    if (!apiKey) return { error: "Exa is unconfigured" };
    const metadata = await getUrlMetadata(url);
    const exa = new Exa(apiKey);
    const searchResults = await exa.getContents([metadata.url], {
      text: true,
      livecrawl: "fallback",
    });

    return {
      success: true,
      data: {
        title: metadata.title || "",
        description: metadata.description || "",
        favicon: metadata.favicon || "",
        ogImage: metadata.ogImage || "",
        url: metadata.url || url,
        search_results: JSON.stringify(searchResults),
      },
    };
  } catch (error) {
    console.error("Error scraping URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to scrape URL",
    };
  }
}

export async function generateContent(url: string): Promise<GeneratedContent> {
  try {
    if (!(await hasAdminSession())) throw new Error(signInError.error);
    const exaKey = process.env.EXASEARCH_API_KEY;
    if (!exaKey || !process.env.ANTHROPIC_API_KEY) {
      throw new Error("Content generation requires Exa and Anthropic configuration");
    }

    const metadata = await getUrlMetadata(url);
    const exa = new Exa(exaKey);
    const searchResults = await exa.getContents([metadata.url], {
      text: true,
      livecrawl: "fallback",
    });

    return {
      ...metadata,
      overview: await generateOverview(metadata.url, searchResults),
      search_results: JSON.stringify(searchResults),
      slug: generateSlug(metadata.title),
    };
  } catch (error) {
    console.error("Error generating content:", error);
    return {
      title: "",
      description: "",
      url: url,
      overview: "",
      search_results: "",
      favicon: "",
      ogImage: "",
      slug: "",
      error:
        error instanceof Error ? error.message : "Failed to generate content",
    };
  }
}
