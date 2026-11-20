import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookmarks, showcaseSettings } from "@/db/schema";
import { hasAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(id)) return notFound();

  const [result] = await db.select({
    bytes: sql`case when ${showcaseSettings.logoId} = ${id}
      then ${showcaseSettings.logo} else ${showcaseSettings.artwork} end`.mapWith(showcaseSettings.logo),
  }).from(showcaseSettings)
    .innerJoin(bookmarks, eq(bookmarks.id, showcaseSettings.bookmarkId))
    .where(and(
      or(eq(showcaseSettings.logoId, id), eq(showcaseSettings.artworkId, id)),
      (await hasAdminSession()) ? undefined : eq(bookmarks.isArchived, false),
    ))
    .limit(1);

  const bytes = result?.bytes;
  if (!bytes) return notFound();
  return new Response(Uint8Array.from(bytes), { headers: {
    "Content-Type": "image/webp",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
