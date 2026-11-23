"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Gamepad2, Github, Layers3, Search, Sparkles, Tv, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import Markdown from "react-markdown";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Brand } from "./brand";
import { ShowcaseCarousel } from "./showcase-carousel";
import { ShowcaseLogo } from "./showcase-card";
import { githubResourceUrl, isShowcaseCategory, showcaseCategories } from "@/lib/showcase";
import type { ShowcaseCategory, ShowcaseResource } from "@/lib/showcase";

const resultsId = "showcase-results";
const categoryLabel = (category: ShowcaseCategory) => showcaseCategories.find(({ id }) => id === category)?.label;
const categoryIcons = { ai: Sparkles, software: Layers3, gaming: Gamepad2, media: Tv };

function matchesQuery(resource: ShowcaseResource, query: string) {
  const q = query.toLowerCase();
  return !q || [resource.title, resource.description, resource.overview, ...resource.tags].some((item) => item?.toLowerCase().includes(q));
}

function matchCategory(resources: ShowcaseResource[], preferred: ShowcaseCategory, query: string) {
  if (!query || resources.some((resource) => resource.category === preferred && matchesQuery(resource, query))) return preferred;
  return showcaseCategories.find(({ id }) => resources.some((resource) => resource.category === id && matchesQuery(resource, query)))?.id ?? preferred;
}

function ResourceDetails({ resource, open, pointerFocus, onOpenChange, restoreFocus }: {
  resource: ShowcaseResource;
  open: boolean;
  pointerFocus: boolean;
  onOpenChange: (open: boolean) => void;
  restoreFocus: () => void;
}) {
  const source = resource.github;
  const showSource = source && githubResourceUrl(resource.url) !== source;
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="showcase-dialog showcase-resource-dialog"
        data-pointer-focus={pointerFocus || undefined}
        onOpenAutoFocus={(event) => { event.preventDefault(); title.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(); }}
      >
        <div className="showcase-dialog-heading" style={{ "--resource-accent": resource.accent } as CSSProperties}>
          <div className="showcase-dialog-icon"><ShowcaseLogo resource={resource} size={32} /></div>
          <div>
            <DialogTitle ref={title} tabIndex={-1}>{resource.title}</DialogTitle>
            <DialogDescription>{resource.description || `${resource.title} is in the Goodfind collection.`}</DialogDescription>
          </div>
        </div>
        <div className="showcase-detail-body">
          {resource.overview?.trim() && resource.overview.trim() !== resource.description?.trim() && (
            <section className="showcase-detail-section">
              <h3>What it’s useful for</h3>
              <div className="showcase-detail-prose">
                <Markdown components={{
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
                }}>{resource.overview}</Markdown>
              </div>
            </section>
          )}
          {resource.recommendation && (
            <section className="showcase-detail-section showcase-recommendation">
              <h3>My recommendation</h3>
              <p>{resource.recommendation}</p>
            </section>
          )}
          <div className="showcase-detail-meta">
            <section className="showcase-detail-section">
              <h3>Platforms</h3>
              {resource.platforms.length ? <ul className="showcase-tags">{resource.platforms.map((platform) => <li key={platform}>{platform}</li>)}</ul> : <p>Check the official site for compatibility.</p>}
            </section>
            {resource.tags.length > 0 && (
              <section className="showcase-detail-section">
                <h3>Tags</h3>
                <ul className="showcase-tags">{resource.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
              </section>
            )}
          </div>
        </div>
        <div className="showcase-dialog-links">
          <a className="showcase-link-primary" href={resource.url} target="_blank" rel="noopener noreferrer">Official website<ArrowUpRight aria-hidden="true" size={16} /></a>
          {showSource && <a className="showcase-link-secondary" href={source} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true" size={16} />GitHub</a>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Showcase({ resources, homeCategory }: {
  resources: ShowcaseResource[];
  homeCategory: ShowcaseCategory;
}) {
  const reduceMotion = useReducedMotion();
  const params = useSearchParams();
  const search = params.get("search")?.trim() ?? "";
  const requestedCategory = params.get("category") ?? undefined;
  const category = isShowcaseCategory(requestedCategory) ? requestedCategory : matchCategory(resources, homeCategory, search);
  const [draft, setDraft] = useState(search);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detail, setDetail] = useState<ShowcaseResource | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pointerFocus, setPointerFocus] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const tabs = useRef<Partial<Record<ShowcaseCategory, HTMLButtonElement | null>>>({});
  const shown = resources.filter((resource) => resource.category === category && matchesQuery(resource, search));
  const fmhyUrl = resources.find((resource) => resource.slug === "fmhy")?.url;
  const virgilUrl = resources.find((resource) => resource.slug === "virgil-search")?.url;

  useEffect(() => {
    function shortcut(event: globalThis.KeyboardEvent) {
      if ((!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== "k" || detail || searchOpen) return;
      event.preventDefault();
      setDraft(search);
      setSearchOpen(true);
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [detail, search, searchOpen]);

  function updateView(nextCategory: ShowcaseCategory, query: string) {
    const url = new URL(window.location.href);
    if (nextCategory === homeCategory && !query) url.searchParams.delete("category");
    else url.searchParams.set("category", nextCategory);
    if (query) url.searchParams.set("search", query);
    else url.searchParams.delete("search");
    window.history.replaceState(null, "", url);
  }

  function applySearch(query: string) {
    const trimmed = query.trim();
    updateView(matchCategory(resources, category, trimmed), trimmed);
    setSearchOpen(false);
  }

  function moveTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = showcaseCategories.length;
    const nextIndex = {
      ArrowLeft: (index + count - 1) % count,
      ArrowRight: (index + 1) % count,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = showcaseCategories[nextIndex].id;
    updateView(next, search);
    tabs.current[next]?.focus();
  }

  const easing = [.22, .68, .24, 1] as const;
  const tabMotion = reduceMotion ? { duration: 0 } : { duration: 0.24, ease: easing };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="showcase"
        data-pointer-focus={pointerFocus || undefined}
        onPointerDownCapture={() => setPointerFocus(true)}
        onKeyDownCapture={(event) => {
          // Bare modifiers can match :focus-visible in Chromium without moving focus.
          if (/^(Tab|Arrow(Left|Right|Up|Down)|Home|End|Enter| |Escape)$/.test(event.key)) {
            setPointerFocus(false);
          }
        }}
      >
        <a className="showcase-skip" href="#browse">Skip to resources</a>
        <header className="showcase-header">
          <div className="showcase-frame showcase-header-inner">
            <Brand />
            <a className="showcase-browse-link" href="#browse">Browse resources <ArrowDown aria-hidden="true" size={15} /></a>
          </div>
        </header>
        <main className="showcase-frame" id="main" tabIndex={-1}>
          <div className="showcase-intro">
            <div>
              <h1>The good stuff on the internet<span>.</span></h1>
              <p>A personal collection of useful software, good tools, and websites worth keeping.</p>
            </div>
            <button ref={searchTrigger} className="showcase-search-button" type="button" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" onClick={() => { setDraft(search); setSearchOpen(true); }}>
              <span className="showcase-search-icon"><Search aria-hidden="true" size={19} /></span>
              <span className="showcase-search-label">Search Goodfind</span>
              <ArrowRight className="showcase-search-arrow" aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="showcase-filter" id="browse" tabIndex={-1}>
            <h2>Browse the collection</h2>
            <LayoutGroup>
              <div className="showcase-tabs" role="tablist" aria-label="Resource categories">
                {showcaseCategories.map(({ id, label }, index) => {
                  const Icon = categoryIcons[id];
                  return (
                    <button
                      id={`showcase-tab-${id}`}
                      ref={(node) => { tabs.current[id] = node; }}
                      className="showcase-tab"
                      key={id}
                      role="tab"
                      type="button"
                      aria-selected={category === id}
                      aria-controls={resultsId}
                      tabIndex={category === id ? 0 : -1}
                      onClick={() => updateView(id, search)}
                      onKeyDown={(event) => moveTabs(event, index)}
                    >
                      {category === id && <motion.span className="showcase-active-pill" layoutId="showcase-active-pill" transition={tabMotion} />}
                      <Icon size={15} aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>

          <section role="tabpanel" id={resultsId} aria-labelledby={`showcase-tab-${category}`} className="showcase-results">
            <div className="sr-only" role="status">
              {shown.length} {shown.length === 1 ? "resource" : "resources"}{search && <> for “{search}”</>}
            </div>
            {search && (
              <div className="showcase-results-top">
                <p>Results for <strong>“{search}”</strong></p>
                <button className="showcase-clear" type="button" onClick={() => { applySearch(""); tabs.current[category]?.focus({ preventScroll: true }); }}><X size={14} aria-hidden="true" /> Clear search</button>
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <ShowcaseCarousel
                key={category + ":" + search}
                resources={shown}
                label={categoryLabel(category) + " resources"}
                sourceUrl={fmhyUrl}
                emptyMessage={search ? "No resources match this search." : "This category is waiting for its first resource."}
                reduceMotion={Boolean(reduceMotion)}
                onOpen={(resource, button) => {
                  trigger.current = button;
                  setDetail(resource);
                  setDetailOpen(true);
                }}
              />
            </AnimatePresence>
          </section>
        </main>

        {detail && (
          <ResourceDetails
            resource={detail}
            open={detailOpen}
            pointerFocus={pointerFocus}
            onOpenChange={setDetailOpen}
            restoreFocus={() => { trigger.current?.focus({ preventScroll: true }); setDetail(null); }}
          />
        )}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="showcase-dialog showcase-search-dialog" data-pointer-focus={pointerFocus || undefined} onCloseAutoFocus={(event) => { event.preventDefault(); searchTrigger.current?.focus({ preventScroll: true }); }}>
            <DialogTitle>Search Goodfind</DialogTitle>
            <DialogDescription>Filter the collection by name, description, or tag.</DialogDescription>
            <form onSubmit={(event) => { event.preventDefault(); applySearch(draft); }} role="search">
              <input aria-label="Search resources" placeholder="Try “Open Source”" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} />
              <button className="showcase-link-primary" type="submit" aria-label="Apply search"><ArrowRight size={19} aria-hidden="true" /></button>
            </form>
            {virgilUrl && (
              <a className="showcase-external-link" href={virgilUrl} target="_blank" rel="noopener noreferrer">
                Search software on Virgil <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
