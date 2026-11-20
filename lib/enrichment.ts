import Anthropic from "@anthropic-ai/sdk";
import { load } from "cheerio";
import { fetchPublicMetadata, publicHttpUrl } from "@/lib/public-fetch";

function repositoryUrl(url: URL) {
  if (url.hostname !== "github.com") return "";
  const [owner, name] = url.pathname.split("/").filter(Boolean);
  if (!owner || !name || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(name)) return "";
  return `https://github.com/${owner}/${name.replace(/\.git$/, "")}`;
}

const cleanMetadata = (value: unknown, limit: number) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, limit) : "";

function metadataLink(value: unknown, base: URL) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    return publicHttpUrl(new URL(value, base).href).href;
  } catch {
    return "";
  }
}

export async function getUrlMetadata(input: string) {
  const original = publicHttpUrl(input);
  const github = repositoryUrl(original);
  const signal = AbortSignal.timeout(9000);
  if (github) {
    try {
      const { text } = await fetchPublicMetadata(
        `https://api.github.com/repos${new URL(github).pathname}`, signal, "json",
      );
      const repo = JSON.parse(text);
      if (typeof repo.name === "string" && repo.name) {
        return {
          url: original.href,
          title: cleanMetadata(repo.name, 120),
          description: cleanMetadata(repo.description, 600),
          favicon: "https://github.githubassets.com/favicons/favicon.svg",
          ogImage: "",
          github,
          website: metadataLink(repo.homepage, original),
        };
      }
    } catch {
      signal.throwIfAborted();
      // The normal repository page is still useful if the anonymous API limit is reached.
    }
  }

  const { text, url: pageUrl } = await fetchPublicMetadata(original.href, signal, "html");
  const $ = load(text);
  const absoluteUrl = (value?: string) => metadataLink(value, pageUrl);

  return {
    url: original.href,
    title: cleanMetadata($('meta[property="og:title"]').attr("content") || $("title").text(), 120) || pageUrl.hostname,
    description: cleanMetadata($('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content"), 600),
    favicon: absoluteUrl($('link[rel~="icon"], link[rel="apple-touch-icon"]').attr("href") || "/favicon.ico"),
    ogImage: absoluteUrl($('meta[property="og:image"], meta[name="twitter:image"]').attr("content")),
    github: github || repositoryUrl(pageUrl),
    website: pageUrl.href === original.href ? "" : pageUrl.href,
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
