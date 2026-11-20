"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Github, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import Markdown from "react-markdown";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Brand } from "./brand";
import { ShowcaseCard, ShowcaseLogo } from "./showcase-card";
import { githubResourceUrl, showcaseCategories } from "@/lib/showcase";
import type { ShowcaseCategory, ShowcaseResource } from "@/lib/showcase";

const resultsId = "showcase-results";
const railId = "showcase-rail";
const defaultCategory: ShowcaseCategory = "software";
const categoryLabel = (category: ShowcaseCategory) => showcaseCategories.find(({ id }) => id === category)?.label;

function matchesQuery(resource: ShowcaseResource, query: string) {
  const q = query.toLowerCase();
  return !q || [resource.title, resource.description, resource.overview, ...resource.tags].some((item) => item?.toLowerCase().includes(q));
}

function matchCategory(resources: ShowcaseResource[], preferred: ShowcaseCategory, query: string) {
  if (!query || resources.some((resource) => resource.category === preferred && matchesQuery(resource, query))) return preferred;
  return showcaseCategories.find(({ id }) => resources.some((resource) => resource.category === id && matchesQuery(resource, query)))?.id ?? preferred;
}

function ResourceDetails({ resource, onClose, restoreFocus }: {
  resource: ShowcaseResource;
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const source = resource.github;
  const showSource = source && githubResourceUrl(resource.url) !== source;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="showcase-dialog" onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(); }}>
        <div className="showcase-dialog-heading" style={{ "--resource-accent": resource.accent } as CSSProperties}>
          <div className="showcase-dialog-icon"><ShowcaseLogo resource={resource} size={32} /></div>
          <div>
            <DialogTitle>{resource.title}</DialogTitle>
            <DialogDescription>{resource.description || `${resource.title} is in the Goodfind collection.`}</DialogDescription>
          </div>
        </div>
        {resource.overview?.trim() && resource.overview.trim() !== resource.description?.trim() && (
          <section className="showcase-detail-section">
            <h3>What it’s useful for</h3>
            <div className="showcase-detail-prose"><Markdown>{resource.overview}</Markdown></div>
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
        <div className="showcase-dialog-links">
          <a className="showcase-link-primary" href={resource.url} target="_blank" rel="noopener noreferrer">Official website<ArrowUpRight aria-hidden="true" size={16} /></a>
          {showSource && <a className="showcase-link-secondary" href={source} target="_blank" rel="noopener noreferrer"><Github aria-hidden="true" size={16} />GitHub</a>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Showcase({ resources, initialCategory, pinnedCategory, initialSearch }: {
  resources: ShowcaseResource[];
  initialCategory: ShowcaseCategory;
  pinnedCategory: boolean;
  initialSearch: string;
}) {
  const reduceMotion = useReducedMotion();
  const [category, setCategory] = useState(() => pinnedCategory ? initialCategory : matchCategory(resources, initialCategory, initialSearch));
  const [search, setSearch] = useState(initialSearch);
  const [draft, setDraft] = useState(initialSearch);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detail, setDetail] = useState<ShowcaseResource | null>(null);
  const [scroll, setScroll] = useState({ back: false, next: false });
  const rail = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const tabs = useRef<Partial<Record<ShowcaseCategory, HTMLButtonElement | null>>>({});
  const shown = resources.filter((resource) => resource.category === category && matchesQuery(resource, search));

  const syncArrows = useCallback(() => {
    const node = rail.current;
    if (!node) return;
    const back = node.scrollLeft > 3;
    const next = node.scrollWidth - node.clientWidth - node.scrollLeft > 3;
    setScroll((previous) => previous.back === back && previous.next === next ? previous : { back, next });
  }, []);
  const resetRail = useCallback((node: HTMLDivElement | null) => {
    if (node && rail.current) {
      rail.current.scrollLeft = 0;
      syncArrows();
    }
  }, [syncArrows]);

  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const observer = new ResizeObserver(syncArrows);
    observer.observe(node);
    syncArrows();
    return () => observer.disconnect();
  }, [syncArrows, shown.length]);

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
    setCategory(nextCategory);
    setSearch(query);
    const url = new URL(window.location.href);
    if (nextCategory === defaultCategory && !query) url.searchParams.delete("category");
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

  function moveRail(direction: number) {
    const node = rail.current;
    const item = node?.querySelector("li");
    if (!node || !item) return;
    const list = item.parentElement;
    const gap = list ? parseFloat(getComputedStyle(list).columnGap) || 0 : 0;
    node.scrollBy({ left: direction * (item.getBoundingClientRect().width + gap), behavior: reduceMotion ? "auto" : "smooth" });
  }

  const tabMotion = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 };
  const step = reduceMotion ? 0 : 0.034;

  return (
    <MotionConfig reducedMotion="user">
      <div className="showcase">
        <a className="showcase-skip" href="#main">Skip to resources</a>
        <header className="showcase-header">
          <div className="showcase-frame showcase-header-inner">
            <Brand />
            <button ref={searchTrigger} className="showcase-search-button" type="button" aria-haspopup="dialog" onClick={() => { setDraft(search); setSearchOpen(true); }}>
              <Search aria-hidden="true" size={17} /> Search
            </button>
          </div>
        </header>
        <main className="showcase-frame" id="main" tabIndex={-1}>
          <div className="showcase-intro">
            <h1>The good stuff on the internet<span>.</span></h1>
            <p>A personal collection of useful software, good tools, and websites worth keeping.</p>
          </div>

          <div className="showcase-filter">
            <LayoutGroup>
              <div className="showcase-tabs" role="tablist" aria-label="Resource categories">
                {showcaseCategories.map(({ id, label }, index) => (
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
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>

          <section role="tabpanel" id={resultsId} aria-labelledby={`showcase-tab-${category}`} className="showcase-results">
            <div className="showcase-results-top">
              <div className="showcase-status" role="status">
                {shown.length} {shown.length === 1 ? "resource" : "resources"}{search && <> for “{search}”</>}
              </div>
              {search && <button className="showcase-clear" type="button" onClick={() => applySearch("")}><X size={14} aria-hidden="true" /> Clear search</button>}
            </div>
            <div id={railId} ref={rail} className="showcase-rail" onScroll={syncArrows} aria-label={`${categoryLabel(category)} resources`}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${category}:${search}`}
                  initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: reduceMotion ? 1 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.14 }}
                  ref={resetRail}
                  onAnimationComplete={syncArrows}
                >
                  {shown.length ? (
                    <motion.ul
                      className="showcase-cards"
                      initial="hidden"
                      animate="visible"
                      variants={{ hidden: {}, visible: { transition: { staggerChildren: step } } }}
                    >
                      {shown.map((resource) => (
                        <motion.li
                          className="showcase-card-item"
                          key={resource.id}
                          variants={{ hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 6 }, visible: { opacity: 1, y: 0 } }}
                          transition={{ duration: reduceMotion ? 0 : 0.22 }}
                        >
                          <ShowcaseCard resource={resource} onOpen={(button) => { trigger.current = button; setDetail(resource); }} />
                        </motion.li>
                      ))}
                    </motion.ul>
                  ) : (
                    <div className="showcase-empty">
                      <p>{search ? "No resources match this search." : "This category is waiting for its first resource."}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="showcase-rail-controls" aria-label="Browse resources">
              <button type="button" onClick={() => moveRail(-1)} disabled={!scroll.back} aria-controls={railId} aria-label="Previous resources">
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => moveRail(1)} disabled={!scroll.next} aria-controls={railId} aria-label="Next resources">
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          </section>
        </main>

        {detail && <ResourceDetails resource={detail} onClose={() => setDetail(null)} restoreFocus={() => trigger.current?.focus({ preventScroll: true })} />}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="showcase-dialog showcase-search-dialog" onCloseAutoFocus={(event) => { event.preventDefault(); searchTrigger.current?.focus({ preventScroll: true }); }}>
            <DialogTitle>Search Goodfind</DialogTitle>
            <DialogDescription>Filter the collection by name, description, or tag.</DialogDescription>
            <form onSubmit={(event) => { event.preventDefault(); applySearch(draft); }} role="search">
              <input aria-label="Search resources" placeholder="Try “Open Source”" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} />
              <button className="showcase-link-primary" type="submit" aria-label="Apply search"><ArrowRight size={19} aria-hidden="true" /></button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
