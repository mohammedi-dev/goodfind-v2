import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, Compass, FolderOpen, Layers3, LayoutGrid, LibraryBig, Search, Star, Timer } from "lucide-react";
import { Brand } from "@/components/goodfind/brand";
import { DiscoverySidebar, MobileDiscoveryMenu } from "@/components/goodfind/discovery-navigation";
import { DiscoverySearch } from "@/components/goodfind/discovery-search";
import { topicIcons } from "@/components/goodfind/discovery-icons";
import { DiscoveryCard } from "@/components/goodfind/resource-card";
import { NewsletterDialog } from "@/components/goodfind/newsletter-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllCategories, getDiscoveryResources } from "@/lib/data";
import {
  collections, discoveryHref, discoveryPageSize, matchesCollection, matchesSearch, matchesTopic, topics,
} from "@/lib/discovery";

type Query = Record<string, string | string[] | undefined>;

function readQuery(query: Query, key: string) {
  const value = query[key];
  return (typeof value === "string" ? value : value?.[0])?.trim() || undefined;
}

function SectionHeading({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="gf-section-heading">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}

function ResourceCount({ count }: { count: number }) {
  return <>{count} {count === 1 ? "resource" : "resources"}</>;
}

export default async function Home({ searchParams }: { searchParams: Promise<Query> }) {
  const [query, resources, categories] = await Promise.all([
    searchParams,
    getDiscoveryResources(),
    getAllCategories(),
  ]);
  const search = readQuery(query, "search");
  const categoryId = readQuery(query, "category");
  const topicId = readQuery(query, "topic");
  const subtopicId = readQuery(query, "subtopic");
  const collectionId = readQuery(query, "collection");
  const view = readQuery(query, "view");
  const topic = topics.find((item) => item.id === topicId);
  const subtopic = topic?.subtopics.find((item) => item.id === subtopicId);
  const collection = collections.find((item) => item.id === collectionId);
  const category = categories.find((item) => String(item.id) === categoryId);
  const isCatalog = Boolean(search || categoryId || topicId || collectionId || view === "all");
  const navCategories = categories.map(({ id, name }) => ({ id: String(id), name }));
  const location = {
    home: !isCatalog, topic: topic?.id, subtopic: subtopic?.id, category: category && String(category.id),
    all: view === "all" && !topicId && !collectionId && !categoryId,
  };

  const recent = resources.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0) || b.id - a.id);
  const featured = [...recent].reverse().filter((item) => item.isFavorite && !item.isArchived).slice(0, 3);
  const recentAdditions = recent.filter((item) => !item.isArchived).slice(0, 6);
  const matches = isCatalog ? recent.filter((item) =>
    (!categoryId || item.category?.id.toString() === categoryId) &&
    (!topicId || (topic && (!subtopicId || subtopic) && matchesTopic(item, topic, subtopicId))) &&
    (!collectionId || (collection && matchesCollection(item, collection))) &&
    (!search || matchesSearch(item, search)),
  ) : [];
  const pages = Math.max(1, Math.ceil(matches.length / discoveryPageSize));
  const page = Math.max(1, Math.min(pages, Number.parseInt(readQuery(query, "page") ?? "", 10) || 1));
  const results = matches.slice((page - 1) * discoveryPageSize, page * discoveryPageSize);
  const resultTitle = subtopic?.name || topic?.name || collection?.name || category?.name ||
    (search ? "Search results" : "All resources");
  const paginatedHref = (newPage: number) => discoveryHref({
    search, view, category: categoryId, topic: topicId, subtopic: subtopicId,
    collection: collectionId, page: newPage > 1 ? String(newPage) : undefined,
  });
  const allHref = discoveryHref({ view: "all" });

  return (
    <div className="gf-shell">
      <a className="gf-skip" href="#main">Skip to main content</a>
      <DiscoverySidebar location={location} categories={navCategories} />
      <div className="gf-workspace">
        <header className="gf-toolbar">
          <div className="gf-toolbar-identity">
            <div className="gf-mobile-brand">
              <MobileDiscoveryMenu location={location} categories={navCategories} />
              <Brand />
            </div>
            <Link className="gf-toolbar-title" href="/">
              <Compass aria-hidden="true" size={17} /> Discover
            </Link>
          </div>
          <DiscoverySearch />
          <div className="gf-toolbar-actions">
            <NewsletterDialog compact />
            <ThemeToggle className="gf-icon-button" />
          </div>
        </header>
        <main className="gf-main" id="main" tabIndex={-1}>
          {isCatalog ? (
            <div className="gf-results">
              <div className="gf-results-heading">
                <Link className="gf-text-link" href="/">Discover</Link>
                <h1>{resultTitle}</h1>
                {collection && <p className="gf-collection-description">{collection.description}</p>}
                <p className="gf-result-count" role="status">
                  <ResourceCount count={matches.length} />{search && <> matching “{search}”</>}
                </p>
              </div>
              {topic && (
                <nav className="gf-topic-filters" aria-label={`${topic.name} filters`}>
                  <Link aria-current={!subtopic ? "page" : undefined} href={discoveryHref({ topic: topic.id, search })}>All {topic.name}</Link>
                  {topic.subtopics.map((child) => (
                    <Link
                      aria-current={subtopic?.id === child.id ? "page" : undefined}
                      href={discoveryHref({ topic: topic.id, subtopic: child.id, search })}
                      key={child.id}
                    >{child.name}</Link>
                  ))}
                </nav>
              )}
              {results.length > 0 ? (
                <div className="gf-card-grid">
                  {results.map((resource) => <DiscoveryCard key={resource.id} resource={resource} />)}
                </div>
              ) : (
                <div className="gf-empty">
                  {search ? <Search aria-hidden="true" /> : <FolderOpen aria-hidden="true" />}
                  <h2>{search ? "No matching resources" : "No resources here yet"}</h2>
                  <p>{search ? "Try a different search, or explore the full library." : "Explore another topic or browse what’s already in the library."}</p>
                  <Link className="gf-button gf-button-outline" href={subtopic && topic ? discoveryHref({ topic: topic.id }) : allHref}>
                    {subtopic && topic ? `Browse ${topic.name}` : "Browse all resources"}
                  </Link>
                </div>
              )}
              {pages > 1 && (
                <nav className="gf-pagination" aria-label="Resource pages">
                  {page > 1 && <Link className="gf-button gf-button-outline" href={paginatedHref(page - 1)}>Previous</Link>}
                  <span>Page {page} of {pages}</span>
                  {page < pages && <Link className="gf-button gf-button-outline" href={paginatedHref(page + 1)}>Next</Link>}
                </nav>
              )}
            </div>
          ) : (
            <>
              <section className="gf-hero" aria-labelledby="goodfind-title">
                <div className="gf-hero-visual" aria-hidden="true">
                  <Image src="/goodfind-discovery.webp" alt="" fill priority unoptimized sizes="(max-width: 640px) 100vw, 62vw" />
                </div>
                <div className="gf-hero-copy">
                  <div className="gf-hero-label"><Compass aria-hidden="true" size={15} /> The Goodfind library</div>
                  <h1 id="goodfind-title">The internet,<br /><span>well curated.</span></h1>
                  <p>Handpicked tools, learning resources, and hidden gems worth a closer look.</p>
                  <div className="gf-hero-actions">
                    <Link className="gf-button gf-button-primary" href={allHref}>
                      <LayoutGrid aria-hidden="true" size={17} /> Browse resources
                    </Link>
                    <Link className="gf-button gf-button-hero-outline" href="#categories">Explore categories</Link>
                  </div>
                </div>
              </section>
              <section id="featured" className="gf-section">
                <SectionHeading title="Featured resources" text="A few favorites from the library." action={
                  <Link className="gf-text-link" href={allHref}>View all resources</Link>
                } />
                {featured.length ? (
                  <div className="gf-card-grid gf-featured-grid">
                    {featured.map((resource) => <DiscoveryCard key={resource.id} resource={resource} />)}
                  </div>
                ) : <p className="gf-section-empty"><Star aria-hidden="true" size={17} /> No featured resources yet.</p>}
              </section>
              <section id="categories" className="gf-section">
                <SectionHeading title="Categories" text="Find your way into the library by topic." />
                <div className="gf-category-grid">
                  {topics.map((item) => {
                    const Icon = topicIcons[item.id as keyof typeof topicIcons];
                    const count = resources.filter((resource) => matchesTopic(resource, item)).length;
                    return (
                      <Link className="gf-category-card" href={discoveryHref({ topic: item.id })} key={item.id}>
                        <span className="gf-category-icon"><Icon aria-hidden="true" size={19} /></span>
                        <span><strong>{item.name}</strong><small><ResourceCount count={count} /></small></span>
                      </Link>
                    );
                  })}
                </div>
                {navCategories.length > 0 && (
                  <nav className="gf-library-categories" aria-label="Library categories">
                    {navCategories.map(({ id, name }) => (
                      <Link className="gf-tag gf-tag-category" key={id} href={discoveryHref({ category: id })}>{name}</Link>
                    ))}
                  </nav>
                )}
              </section>
              <section id="recent" className="gf-section">
                <SectionHeading title="Recently added" text="The newest additions to the library." action={
                  <Link className="gf-text-link" href={allHref}>Browse all</Link>
                } />
                {recentAdditions.length ? (
                  <div className="gf-card-grid gf-recent-grid">
                    {recentAdditions.map((resource) => <DiscoveryCard compact key={resource.id} resource={resource} />)}
                  </div>
                ) : <p className="gf-section-empty"><Timer aria-hidden="true" size={17} /> No resources have been added yet.</p>}
              </section>
              <section id="collections" className="gf-section">
                <SectionHeading title="Curated collections" text="Small, focused starting points for what you want to do." />
                <div className="gf-card-grid gf-collection-grid">
                  {collections.map((item, index) => {
                    const Icon = [Layers3, LibraryBig, BookOpen][index];
                    const count = resources.filter((resource) => matchesCollection(resource, item)).length;
                    return (
                      <Link className="gf-collection-card" href={discoveryHref({ collection: item.id })} key={item.id}>
                        <span className="gf-category-icon"><Icon aria-hidden="true" size={20} /></span>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <span className="gf-collection-count"><ResourceCount count={count} /></span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </>
          )}
          <footer className="gf-footer">
            <span>© {new Date().getFullYear()} Goodfind</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
