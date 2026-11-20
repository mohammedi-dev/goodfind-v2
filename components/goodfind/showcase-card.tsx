"use client";

import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { ResourceImage } from "@/components/resource-image";
import type { ShowcaseResource } from "@/lib/showcase";

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
  const art = (
    <div className="showcase-card-art" data-artwork={resource.artwork} aria-hidden="true">
      <div className="showcase-engraving"><i /><i /><i /></div>
      <span className="showcase-emblem"><ShowcaseLogo resource={resource} size={56} /></span>
    </div>
  );
  const illustration = resource.artworkUrl
    ? <ResourceImage className="showcase-preview" width={720} height={490} loading="lazy" src={resource.artworkUrl} alt="" fallback={art} />
    : art;

  return (
    <article className="showcase-card" style={{ "--resource-accent": resource.accent, "--resource-background": resource.background } as CSSProperties}>
      <div className="showcase-artwork">
        <ResourceImage className="showcase-preview" width={720} height={490} loading="lazy" src={resource.screenshot} alt="" fallback={illustration} />
        {(resource.screenshot || resource.artworkUrl) && <span className="showcase-card-identity" aria-hidden="true"><ShowcaseLogo resource={resource} size={21} /></span>}
      </div>
      <div className="showcase-card-copy">
        <div className="showcase-card-title-row">
          <h2>{resource.title}</h2>
          <span className="showcase-card-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
        </div>
        <p>{resource.description || "Open the resource for more information."}</p>
      </div>
      {onOpen && <button className="showcase-card-button" type="button" aria-label={`View ${resource.title} details`} aria-haspopup="dialog" onClick={(event) => onOpen(event.currentTarget)} />}
    </article>
  );
}
