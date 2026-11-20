import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { bookmarks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adminApiDenied } from "@/lib/admin-session";
import { revalidatePath } from "next/cache";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ url: string }> },
) {
  const denied = await adminApiDenied();
  if (denied) return denied;
  try {
    const { url } = await params;
    const [deleted] = await db.delete(bookmarks).where(eq(bookmarks.url, url))
      .returning({ slug: bookmarks.slug });
    if (!deleted) return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/${deleted.slug}`);
    return NextResponse.json({ message: "Bookmark deleted successfully" });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 },
    );
  }
}
