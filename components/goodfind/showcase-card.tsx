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

export function ShowcaseCard({ resource, onOpen }: { resource: ShowcaseResource; onOpen: (trigger: HTMLButtonElement) => void }) {
  const art = (
    <div className="showcase-card-art" data-artwork={resource.artwork} aria-hidden="true">
      <div className="showcase-engraving"><i /><i /><i /></div>
      <span className="showcase-emblem"><ShowcaseLogo resource={resource} size={56} /></span>
    </div>
  );

  return (
    <article className="showcase-card" style={{ "--resource-accent": resource.accent } as CSSProperties}>
      <div className="showcase-artwork">
          {resource.screenshot ? (
            <ResourceImage className="showcase-preview" width={480} height={300} loading="lazy" src={resource.screenshot} alt="" fallback={art} />
          ) : art}
      </div>
      <div className="showcase-card-copy">
          <div className="showcase-card-title-row">
            <h2>{resource.title}</h2>
            <span className="showcase-card-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
          </div>
          <p>{resource.description || "Open the resource for more information."}</p>
          {resource.tags.length > 0 && (
            <ul className="showcase-tags" aria-label="Resource tags">
              {resource.tags.slice(0, 2).map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          )}
      </div>
      <button className="showcase-card-button" type="button" aria-label={`View ${resource.title} details`} aria-haspopup="dialog" onClick={(event) => onOpen(event.currentTarget)} />
    </article>
  );
}
