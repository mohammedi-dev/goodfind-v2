import { NextResponse } from "next/server";
import { adminApiDenied } from "@/lib/admin-session";
import { getUrlMetadata } from "@/lib/enrichment";
import { publicHttpUrl } from "@/lib/public-fetch";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await adminApiDenied();
  if (denied) return denied;

  const url = new URL(request.url).searchParams.get("url") ?? "";
  try {
    publicHttpUrl(url);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  try {
    return NextResponse.json(await getUrlMetadata(url));
  } catch {
    return NextResponse.json({ error: "Could not retrieve metadata from this website. You can still enter the resource manually." }, { status: 502 });
  }
}
