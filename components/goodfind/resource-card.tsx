import Link from "next/link";
import { Archive, Bookmark, ExternalLink, Star } from "lucide-react";
import { ResourceImage } from "@/components/resource-image";
import { discoveryHref, resourceTags, type DiscoveryResource } from "@/lib/discovery";

const knownIcons: Record<string, { label: string; tone: string }> = {
  github: { label: "GH", tone: "light" },
  figma: { label: "Fi", tone: "coral" },
  notion: { label: "N", tone: "neutral" },
  coursera: { label: "C", tone: "blue" },
  react: { label: "Re", tone: "blue" },
  dribbble: { label: "Dr", tone: "coral" },
};

function websiteHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function DiscoveryCard({ resource, compact = false }: { resource: DiscoveryResource; compact?: boolean }) {
  const icon = knownIcons[resource.slug];
  const tags = resourceTags(resource.tags).slice(0, 2);
  const host = websiteHost(resource.url);
  return (
    <article className={compact ? "gf-resource gf-resource-compact" : "gf-resource"}>
      <div className="gf-resource-top">
        <span className="gf-resource-icon" data-tone={icon?.tone ?? "neutral"} aria-hidden="true">
          <ResourceImage
            src={resource.favicon}
            alt=""
            width={24}
            height={24}
            loading="lazy"
            fallback={icon?.label ?? <Bookmark size={20} />}
          />
        </span>
        <div className="gf-resource-actions">
          {resource.isFavorite && <Star aria-label="Featured resource" size={15} />}
          {resource.isArchived && <Archive aria-label="Archived resource" size={16} />}
          <a className="gf-external" href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${resource.title} (opens in a new tab)`}>
            <ExternalLink aria-hidden="true" size={17} />
          </a>
        </div>
      </div>
      <div className="gf-resource-content">
        <h3><Link className="gf-resource-link" href={`/${encodeURIComponent(resource.slug)}`}>{resource.title}</Link></h3>
        <p>{resource.description?.trim() || host}</p>
      </div>
      <div className="gf-resource-tags">
        {resource.category && (
          <Link className="gf-tag gf-tag-category" href={discoveryHref({ category: resource.category.id })}>{resource.category.name}</Link>
        )}
        {tags.map((tag) => <span className="gf-tag" key={tag}>{tag}</span>)}
        {tags.length === 0 && resource.description?.trim() && <span className="gf-tag gf-tag-domain">{host}</span>}
      </div>
    </article>
  );
}
