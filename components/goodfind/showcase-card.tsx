"use client";

import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { ResourceImage } from "@/components/resource-image";
import { defaultCoverAccent } from "@/lib/showcase";
import type { ShowcaseResource } from "@/lib/showcase";

const coverPatterns: Partial<Record<string, ShowcaseResource["artwork"]>> = {
  bitwarden: "grid",
  "search-browser": "stack",
  "nuvio-torbox": "rays",
};

export function ShowcaseLogo({ resource, size = 38 }: { resource: ShowcaseResource; size?: number }) {
  const initial = <span className="showcase-logo-fallback" aria-hidden="true">{resource.title.trim().charAt(0).toUpperCase()}</span>;
  const fallback = resource.fallbackFavicon
    ? <ResourceImage src={resource.fallbackFavicon} alt="" width={size} height={size} fallback={initial} />
    : initial;
  return (
    <ResourceImage
      src={resource.favicon}
      alt=""
      width={size}
      height={size}
      fallback={fallback}
    />
  );
}

export function ShowcaseCard({ resource, onOpen }: { resource: ShowcaseResource; onOpen?: (trigger: HTMLButtonElement) => void }) {
  const Title = onOpen ? "h3" : "h2";
  const hasDefaultChatGPTArt = onOpen && resource.slug === "chatgpt" &&
    resource.artwork === "orbit" &&
    resource.favicon === "/showcase-icons/chatgpt.webp";
  const logo = <ShowcaseLogo resource={resource} size={80} />;
  const defaultCover = resource.artwork === coverPatterns[resource.slug] &&
    resource.accent === defaultCoverAccent && !resource.background &&
    resource.favicon === `/showcase-icons/${resource.slug}.webp` ? resource.slug : undefined;
  const art = (
    <div
      className={hasDefaultChatGPTArt ? "showcase-card-art showcase-chatgpt-art" : "showcase-card-art"}
      data-artwork={resource.artwork}
      aria-hidden="true"
    >
      <div className="showcase-engraving"><i /><i /><i /></div>
      <span className="showcase-emblem">
        {defaultCover ? <ResourceImage src={`/showcase-icons/${defaultCover}-cover.webp`} width={160} height={160} alt="" fallback={logo} /> : logo}
      </span>
    </div>
  );
  const illustration = resource.artworkUrl
    ? <ResourceImage className="showcase-preview" width={720} height={490} loading="lazy" src={resource.artworkUrl} alt="" fallback={art} />
    : art;

  return (
    <article className="showcase-card" data-cover={defaultCover} style={{ "--resource-accent": resource.accent, "--resource-background": resource.background } as CSSProperties}>
      <div className="showcase-card-copy">
        <div className="showcase-card-title-row">
          <Title className="showcase-card-title">{resource.title}</Title>
          <span className="showcase-card-arrow" aria-hidden="true"><ArrowRight size={17} /></span>
        </div>
        <p>{resource.description || "Open the resource for more information."}</p>
      </div>
      <div className="showcase-artwork">
        <ResourceImage className="showcase-preview" width={720} height={490} loading="lazy" src={resource.screenshot} alt="" fallback={illustration} />
        {(resource.screenshot || resource.artworkUrl) && <span className="showcase-card-identity" aria-hidden="true"><ShowcaseLogo resource={resource} size={21} /></span>}
      </div>
      {onOpen && <button className="showcase-card-button" type="button" aria-label={`View ${resource.title} details`} aria-haspopup="dialog" onClick={(event) => onOpen(event.currentTarget)} />}
    </article>
  );
}
