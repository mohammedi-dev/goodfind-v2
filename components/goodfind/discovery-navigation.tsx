"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Compass, FolderKanban, LayoutGrid, Layers3, Menu, Sparkles, Timer } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { discoveryHref, topics } from "@/lib/discovery";
import { topicIcons } from "./discovery-icons";

export type DiscoveryLocation = {
  home: boolean;
  topic?: string;
  subtopic?: string;
  category?: string;
  all: boolean;
};

type LibraryCategory = { id: string; name: string };

const libraryLinks = [
  { label: "Discover", href: "/", Icon: Compass },
  { label: "All resources", href: discoveryHref({ view: "all" }), Icon: LayoutGrid },
  { label: "Featured resources", href: "/#featured", Icon: Sparkles },
  { label: "Recently added", href: "/#recent", Icon: Timer },
  { label: "Collections", href: "/#collections", Icon: Layers3 },
];

function Navigation({ location, categories, close }: {
  location: DiscoveryLocation;
  categories: LibraryCategory[];
  close?: () => void;
}) {
  const [selection, setSelection] = useState({ topic: location.topic, expanded: location.topic });
  const expanded = selection.topic === location.topic ? selection.expanded : location.topic;

  return (
    <nav className="gf-nav" aria-label="Library navigation">
      <p className="gf-nav-label">Explore</p>
      {libraryLinks.map(({ label, href, Icon }, index) => (
        <Link
          className="gf-nav-link"
          href={href}
          aria-current={(index === 0 && location.home) || (index === 1 && location.all) ? "page" : undefined}
          onClick={close}
          key={href}
        >
          <Icon aria-hidden="true" size={17} />
          {label}
        </Link>
      ))}

      <p className="gf-nav-label gf-nav-separator">Browse topics</p>
      {topics.map((topic) => {
        const Icon = topicIcons[topic.id as keyof typeof topicIcons];
        const isExpanded = expanded === topic.id;
        return (
          <div className="gf-nav-topic" key={topic.id}>
            <div className="gf-nav-topic-row" data-active={location.topic === topic.id || undefined}>
              <Link
                className="gf-nav-link"
                href={discoveryHref({ topic: topic.id })}
                aria-current={location.topic === topic.id && !location.subtopic ? "page" : undefined}
                onClick={close}
              >
                <Icon aria-hidden="true" size={17} /> {topic.name}
              </Link>
              <button
                className="gf-nav-expand"
                type="button"
                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${topic.name}`}
                aria-expanded={isExpanded}
                onClick={() => setSelection({ topic: location.topic, expanded: isExpanded ? undefined : topic.id })}
              >
                <ChevronDown aria-hidden="true" size={15} />
              </button>
            </div>
            {isExpanded && (
              <ul className="gf-nav-children">
                {topic.subtopics.map((subtopic) => (
                  <li key={subtopic.id}>
                    <Link
                      href={discoveryHref({ topic: topic.id, subtopic: subtopic.id })}
                      aria-current={location.topic === topic.id && location.subtopic === subtopic.id ? "page" : undefined}
                      onClick={close}
                    >
                      {subtopic.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {categories.length > 0 && (
        <details className="gf-nav-categories" open={Boolean(location.category)}>
          <summary className="gf-nav-label gf-nav-separator">
            Library categories <ChevronDown aria-hidden="true" size={15} />
          </summary>
          {categories.map((category) => (
            <Link
              className="gf-nav-link"
              href={discoveryHref({ category: category.id })}
              aria-current={location.category === category.id ? "page" : undefined}
              onClick={close}
              key={category.id}
            >
              <FolderKanban aria-hidden="true" size={16} /> {category.name}
            </Link>
          ))}
        </details>
      )}
    </nav>
  );
}

export function DiscoverySidebar({ location, categories }: {
  location: DiscoveryLocation;
  categories: LibraryCategory[];
}) {
  return (
    <aside className="gf-sidebar">
      <Navigation location={location} categories={categories} />
    </aside>
  );
}

export function MobileDiscoveryMenu({ location, categories }: {
  location: DiscoveryLocation;
  categories: LibraryCategory[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="gf-icon-button" type="button" aria-label="Open library navigation">
          <Menu aria-hidden="true" size={21} />
        </button>
      </SheetTrigger>
      <SheetContent className="gf-mobile-panel" side="left">
        <SheetTitle className="sr-only">Library navigation</SheetTitle>
        <SheetDescription className="sr-only">Browse Goodfind sections, topics and categories.</SheetDescription>
        <Navigation close={() => setOpen(false)} location={location} categories={categories} />
      </SheetContent>
    </Sheet>
  );
}
