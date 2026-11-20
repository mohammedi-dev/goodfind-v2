import { NextResponse } from "next/server";
import { adminApiDenied } from "@/lib/admin-session";
import { generateOverview } from "@/lib/enrichment";
import { isBookmarkUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const denied = await adminApiDenied();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!isBookmarkUrl(body?.url) || !body.searchResults) {
    return NextResponse.json({ error: "A valid URL and search results are required" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Anthropic is unconfigured" }, { status: 503 });
  }

  try {
    let searchResults = body.searchResults;
    if (typeof searchResults === "string") {
      try {
        searchResults = JSON.parse(searchResults);
      } catch {
        // Plain text is also valid reference material.
      }
    }
    return NextResponse.json({ overview: await generateOverview(body.url, searchResults) });
  } catch {
    return NextResponse.json({ error: "Could not generate an overview" }, { status: 502 });
  }
}
