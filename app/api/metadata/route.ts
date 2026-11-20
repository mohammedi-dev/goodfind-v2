import { NextResponse } from "next/server";
import { adminApiDenied } from "@/lib/admin-session";
import { getUrlMetadata } from "@/lib/enrichment";
import { isBookmarkUrl } from "@/lib/utils";

export async function GET(request: Request) {
  const denied = await adminApiDenied();
  if (denied) return denied;

  const url = new URL(request.url).searchParams.get("url");
  if (!isBookmarkUrl(url)) {
    return NextResponse.json({ error: "A valid HTTP(S) URL is required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await getUrlMetadata(url));
  } catch {
    return NextResponse.json({ error: "Could not retrieve website metadata" }, { status: 502 });
  }
}
