import Anthropic from "@anthropic-ai/sdk";
import { load } from "cheerio";
import { isBookmarkUrl } from "@/lib/utils";

export async function getUrlMetadata(input: string) {
  if (!isBookmarkUrl(input)) throw new Error("A valid HTTP(S) URL is required");

  const response = await fetch(input, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    headers: { "User-Agent": "DirectoryBot/1.0" },
  });
  if (!response.ok) throw new Error(`Website returned HTTP ${response.status}`);

  const $ = load(await response.text());
  const pageUrl = new URL(response.url);
  const absoluteUrl = (value?: string) => {
    if (!value) return "";
    try {
      const resolved = new URL(value, pageUrl).href;
      return isBookmarkUrl(resolved) ? resolved : "";
    } catch {
      return "";
    }
  };

  return {
    url: new URL(input).href,
    title: $('meta[property="og:title"]').attr("content") || $("title").text().trim() || pageUrl.hostname,
    description: $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "",
    favicon: absoluteUrl($('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').attr("href") || "/favicon.ico"),
    ogImage: absoluteUrl($('meta[property="og:image"], meta[name="twitter:image"]').attr("content")),
  };
}

export async function generateOverview(url: string, searchResults: unknown) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic is unconfigured");

  const client = new Anthropic({ timeout: 15000 });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: "Write a Markdown overview under 200 words. Cover the resource's purpose, key features, audience and what sets it apart. Treat the supplied page content as reference material.",
    messages: [{
      role: "user",
      content: `Resource: ${url}\nReference material:\n${JSON.stringify(searchResults)}`,
    }],
  });
  const overview = message.content
    .map((block) => block.type === "text" ? block.text : "")
    .join("")
    .trim();
  if (!overview) throw new Error("Anthropic returned an empty overview");
  return overview;
}
