"use client";

import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Github, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Markdown from "react-markdown";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ShowcaseCarousel } from "./showcase-carousel";
import { ShowcaseLogo } from "./showcase-card";
import { githubResourceUrl, isShowcaseCategory, showcaseCategories } from "@/lib/showcase";
import type { ShowcaseCategory, ShowcaseResource } from "@/lib/showcase";

const resultsId = "showcase-results";
const views = [{ id: "all", label: "All" }, ...showcaseCategories] as const;
type ShowcaseView = (typeof views)[number]["id"];
const coverOrder = new Map<string, number>(["bitwarden", "search-browser", "nuvio-torbox"].map((slug, index) => [slug, index]));

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
        <div className="showcase-dialog-heading">
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

export function Showcase({ resources }: { resources: ShowcaseResource[] }) {
  const reduceMotion = useReducedMotion();
  const params = useSearchParams();
  const search = params.get("search")?.trim() ?? "";
  const requestedCategory = params.get("category") ?? undefined;
  const view: ShowcaseView = isShowcaseCategory(requestedCategory) ? requestedCategory : "all";
  const [draft, setDraft] = useState(search);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detail, setDetail] = useState<ShowcaseResource | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pointerFocus, setPointerFocus] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const tabs = useRef<Partial<Record<ShowcaseView, HTMLButtonElement | null>>>({});
  const allResources = useMemo(() => [...resources].sort((a, b) =>
    (coverOrder.get(a.slug) ?? coverOrder.size) - (coverOrder.get(b.slug) ?? coverOrder.size)
  ), [resources]);
  const shown = (view === "all" ? allResources : resources)
    .filter((resource) => (view === "all" || resource.category === view) && matchesQuery(resource, search));
  const label = view === "all" ? "All resources" : `${views.find(({ id }) => id === view)?.label} resources`;
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

  function updateView(nextView: ShowcaseView, query: string) {
    const url = new URL(window.location.href);
    if (nextView === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", nextView);
    if (query) url.searchParams.set("search", query);
    else url.searchParams.delete("search");
    window.history.replaceState(null, "", url);
  }

  function applySearch(query: string) {
    const trimmed = query.trim();
    updateView(view === "all" ? view : matchCategory(resources, view, trimmed), trimmed);
    setSearchOpen(false);
  }

  function moveTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = views.length;
    const nextIndex = {
      ArrowLeft: (index + count - 1) % count,
      ArrowRight: (index + 1) % count,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = views[nextIndex].id;
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
        <main className="showcase-frame" id="main" tabIndex={-1}>
          <div className="showcase-intro">
            <h1>The good stuff<br /> on the internet.</h1>
            <p>A personal collection of useful software, good tools, and websites worth keeping.</p>
          </div>

          <div className="showcase-filter" id="browse" tabIndex={-1}>
            <h2 className="sr-only">Browse the collection</h2>
            <LayoutGroup>
              <div className="showcase-tabs" role="tablist" aria-label="Resource categories">
                {views.map(({ id, label }, index) => (
                    <button
                      id={`showcase-tab-${id}`}
                      ref={(node) => { tabs.current[id] = node; }}
                      className="showcase-tab"
                      key={id}
                      role="tab"
                      type="button"
                      aria-selected={view === id}
                      aria-controls={resultsId}
                      tabIndex={view === id ? 0 : -1}
                      onClick={() => updateView(id, search)}
                      onKeyDown={(event) => moveTabs(event, index)}
                    >
                      {view === id && <motion.span className="showcase-active-rule" layoutId="showcase-active-rule" transition={tabMotion} />}
                      <span>{label}</span>
                    </button>
                ))}
              </div>
            </LayoutGroup>
            <button ref={searchTrigger} className="showcase-search-button" type="button" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" onClick={() => { setDraft(search); setSearchOpen(true); }}>
              <Search aria-hidden="true" size={16} /> Search Goodfind
            </button>
          </div>

          <section role="tabpanel" id={resultsId} aria-labelledby={`showcase-tab-${view}`} className="showcase-results">
            <div className="sr-only" role="status">
              {shown.length} {shown.length === 1 ? "resource" : "resources"}{search && <> for “{search}”</>}
            </div>
            {search && (
              <div className="showcase-results-top">
                <p>Results for <strong>“{search}”</strong></p>
                <button className="showcase-clear" type="button" onClick={() => { applySearch(""); tabs.current[view]?.focus({ preventScroll: true }); }}><X size={14} aria-hidden="true" /> Clear search</button>
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <ShowcaseCarousel
                key={view + ":" + search}
                resources={shown}
                label={label}
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
