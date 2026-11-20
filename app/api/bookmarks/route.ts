import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { bookmarks } from "@/db/schema";
import { adminApiDenied } from "@/lib/admin-session";
import { revalidatePath } from "next/cache";
import { getAllBookmarks, getAllCategories } from "@/lib/data";
import { isBookmarkUrl } from "@/lib/utils";

export async function GET() {
  const denied = await adminApiDenied();
  if (denied) return denied;
  try {
    const allBookmarks = await getAllBookmarks();
    return NextResponse.json(allBookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await adminApiDenied();
  if (denied) return denied;
  try {
    const body = await request.json();
    if (typeof body?.title !== "string" || !body.title.trim() ||
        typeof body.slug !== "string" || !body.slug.trim() ||
        !isBookmarkUrl(body.url)) {
      return NextResponse.json({ error: "A title, slug and HTTP(S) URL are required" }, { status: 400 });
    }

    let categoryId = body.categoryId || null;
    if (!categoryId && typeof body.category === "string" && body.category.trim()) {
      const name = body.category.trim().toLowerCase();
      const categories = await getAllCategories();
      categoryId = categories.find((category) =>
        [category.id, category.slug, category.name].some((value) => value.toLowerCase() === name),
      )?.id;
      if (!categoryId) return NextResponse.json({ error: "Category was not found" }, { status: 400 });
    }

    // Insert the new bookmark
    await db.insert(bookmarks).values({
      url: body.url,
      title: body.title,
      slug: body.slug,
      description: body.description || null,
      categoryId,
      overview: body.overview || null,
      favicon: body.favicon || null,
      screenshot: body.screenshot || null,
      ogImage: body.ogImage || null,
      ogTitle: body.ogTitle || null,
      ogDescription: body.ogDescription || null,
      notes: body.notes || null,
      tags: body.tags || null,
      isArchived: body.isArchived || false,
      isFavorite: body.isFavorite || false,
      search_results: body.search_results || null,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json(
      { message: "Bookmark created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 },
    );
  }
}
