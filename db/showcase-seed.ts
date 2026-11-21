import { and, eq, inArray } from "drizzle-orm";
import { db } from "./client";
import { bookmarks, categories } from "./schema";
import type { NewBookmark } from "./schema";
import { showcaseCategories, writeShowcaseTags } from "@/lib/showcase";
import type { ShowcaseCategory } from "@/lib/showcase";

type CatalogEntry = Pick<NewBookmark, "url" | "title" | "slug" | "isFavorite"> & {
  category: ShowcaseCategory;
  description: string;
  overview: string;
  tags: string;
  platforms: string;
  github?: string;
};

const videoGuide = "https://fmhy.net/video#stream-aggregators";
const videoGrades = "https://github.com/fmhy/FMHY/wiki/Stream-Site-Grading";
const nuvioSetup = "https://docs.google.com/document/d/1_1wh-6qug8bT-X9IfAnTYdpDzelavH2QP93igP8Zkfg/edit?tab=t.0#heading=h.6vnt2s1hn9uj";

const catalog: CatalogEntry[] = [
  {
    category: "media", slug: "nuvio-torbox", title: "Nuvio + TorBox", url: "https://www.nuvio.tv/",
    description: "Watch your movie and TV library on a television, computer, or phone.",
    overview: [
      "Nuvio is a media player that organizes movies and shows and adds subtitles, watch history, and support for add-ons. TorBox is a separate cloud download service that can make compatible files available to the player.",
      "[Nuvio + TorBox setup guide](" + nuvioSetup + ") · [Nuvio quick start](https://nuvio.wiki/quick-start) · [TorBox](https://torbox.app/)",
    ].join("\n\n"),
    tags: "Media player, Streaming, Debrid", platforms: "Android, Android TV, iOS, Windows, macOS, Linux, Samsung Tizen, LG webOS",
  },
  {
    category: "media", slug: "shuttletv", title: "ShuttleTV", url: "https://shuttletv.pk/",
    description: "Watch movies and series in your browser and keep a watchlist across devices.",
    overview: [
      "ShuttleTV brings movies, series, and anime into one browser player. FMHY highlights its watchlists, subtitles, automatic next episode, and ability to switch sources when one fails.",
      "[FMHY video guide](" + videoGuide + ") · [ShuttleTV comparison](" + videoGrades + "#shuttletv)",
    ].join("\n\n"),
    tags: "Streaming, Movies, Series", platforms: "Web",
  },
  {
    category: "media", slug: "vivarium", title: "Vivarium", url: "https://vivarium.st/",
    description: "Stream movies, series, and anime with a watchlist and optional Simkl tracking.",
    overview: [
      "Vivarium finds streams from multiple sources and plays them in your browser. It offers synced watchlists and integrates with Simkl, a separate service for tracking what you have watched.",
      "[FMHY video guide](" + videoGuide + ") · [Vivarium comparison](" + videoGrades + "#vivarium)",
    ].join("\n\n"),
    tags: "Streaming, Watchlists, Simkl", platforms: "Web",
  },
  {
    category: "media", slug: "arrowtv", title: "ArrowTV", url: "https://arrowtv.net/",
    description: "Find movies, shows, and anime by genre, with subtitles and language options.",
    overview: [
      "ArrowTV is a browser streaming index with watchlists, genre and franchise collections, and a continue-watching list. Language and playback options vary by title and source.",
      "[FMHY video guide](" + videoGuide + ") · [ArrowTV comparison](" + videoGrades + "#arrowtv--cinezo)",
    ].join("\n\n"),
    tags: "Streaming, Movies, Anime", platforms: "Web",
  },
  {
    category: "media", slug: "clean-your-tv", title: "CleanYourTV", url: "https://cleanyour.tv/",
    description: "Turn off sponsored rows and bundled clutter on a compatible smart TV.",
    overview: [
      "CleanYourTV is a setup guide and toolkit for Android TV and Google TV. It shows how to check your model, replace the home screen with a simpler launcher, and undo the changes later.",
      "[TV compatibility and setup](https://cleanyour.tv/#setup) · [Community tutorials](https://cleanyour.tv/tutorials)",
    ].join("\n\n"),
    tags: "Smart TV, Launcher, Debloat", platforms: "Android TV, Google TV", github: "https://github.com/Gathin23/cleanyourtv",
  },
  {
    category: "gaming", slug: "ascendara", title: "Ascendara", url: "https://www.ascendara.app/",
    description: "One launcher for your installed games, Steam library, and downloads.",
    overview: [
      "Ascendara is a free, open-source game launcher for Windows, macOS, and Linux. Add games you already installed, bring in an existing library such as Steam, and manage downloads from supported sources.",
      "[Ascendara documentation](https://www.ascendara.app/docs)",
    ].join("\n\n"),
    tags: "Game launcher, Library manager, Open Source", platforms: "Windows, macOS, Linux", github: "https://github.com/ascendara/Ascendara",
  },
  {
    category: "gaming", slug: "pirated-games-megathread", title: "Pirated Games Megathread", url: "https://rentry.org/pgames",
    description: "A community guide to unofficial PC game downloads, tools, and sites to avoid.",
    overview: [
      "This community-maintained reference lists unofficial game-download sources, emulators, common setup tools, and sites or uploaders the community flags as unsafe.",
      "[Read the megathread and its safety notes](https://rentry.org/pgames)",
    ].join("\n\n"),
    tags: "Community guide, PC gaming, Emulation", platforms: "Web",
  },
  {
    category: "software", slug: "fmhy", title: "FMHY", url: "https://fmhy.net/", isFavorite: true,
    description: "A community-maintained directory and Goodfind’s main discovery source.",
    overview: [
      "FMHY collects community recommendations for software, privacy tools, media, gaming, and more. Its beginner’s guide explains how to navigate the directory, and its changelog shows what has been added or removed.",
      "[FMHY beginner’s guide](https://fmhy.net/beginners-guide) · [Video directory](https://fmhy.net/video)",
    ].join("\n\n"),
    tags: "Directory, Community guide, Discovery", platforms: "Web",
  },
  {
    category: "software", slug: "search-browser", title: "Search Browser", url: "https://searchbrowser.app/",
    description: "A lightweight Mac browser with tab spaces, reading mode, and ad blocking.",
    overview: [
      "Search is a free browser for macOS 14 or later that uses the WebKit engine already on your Mac. It keeps separate groups of tabs for work or projects and includes reading mode and picture-in-picture video.",
      "[Download for macOS](https://searchbrowser.app/download) · [Source and releases](https://github.com/driceroland/Search)",
    ].join("\n\n"),
    tags: "Browser, WebKit, Open Source", platforms: "macOS", github: "https://github.com/driceroland/Search",
  },
  {
    category: "software", slug: "bitwarden", title: "Bitwarden", url: "https://bitwarden.com/",
    description: "Create, store, and autofill passwords across your browser and devices.",
    overview: [
      "Bitwarden is an open-source password manager. It stores logins and secure notes in an encrypted vault and can fill them in from a browser extension or mobile app. A free personal plan is available.",
      "[Get started with Bitwarden](https://bitwarden.com/help/getting-started-webvault/) · [Download the app or extension](https://bitwarden.com/download/)",
    ].join("\n\n"),
    tags: "Password manager, Privacy, Open Source", platforms: "Web, Windows, macOS, Linux, iOS, Android",
  },
  {
    category: "software", slug: "ad-blockers", title: "Browser ad blockers", url: "https://github.com/gorhill/uBlock",
    description: "Pick uBlock Origin, AdGuard, or uBO Lite to cut browser ads and trackers.",
    overview: [
      "Start with uBlock Origin on Firefox. uBO Lite is a lighter option for browsers like Chrome and Edge. AdGuard is another browser extension with its own filters and supported-browser list.",
      "[uBlock Origin for Firefox](https://addons.mozilla.org/firefox/addon/ublock-origin/) · [AdGuard browser extension](https://adguard.com/en/adguard-browser-extension/overview.html) · [uBO Lite and its install links](https://github.com/uBlockOrigin/uBOL-home)",
    ].join("\n\n"),
    tags: "Ad blocking, Privacy, Browser extensions", platforms: "Firefox, Chrome, Edge, Safari",
  },
  {
    category: "software", slug: "virgil-search", title: "Virgil Search", url: "https://virgil.samidy.com/?engine=software",
    description: "Search a community index of desktop software, games, and Android apps.",
    overview: [
      "Virgil searches links from software and gaming indexes in one place. This shortcut opens its Software tab. Select Games or Android when you are looking for a different kind of app.",
      "[Virgil FAQ](https://virgil.samidy.com/FAQ/)",
    ].join("\n\n"),
    tags: "Search, Software discovery, Directory", platforms: "Web", github: "https://github.com/SamidyFR/Virgil",
  },
];

const starterSlugs = [
  "github", "figma", "notion", "coursera", "react", "dribbble",
  "chatgpt", "claude", "ollama", "hugging-face", "steam", "heroic",
  "retroarch", "pcgamingwiki", "vlc", "audacity", "jellyfin", "handbrake",
];

export async function seedShowcase(replaceStarters = false) {
  return db.transaction(async (tx) => {
    await tx.insert(categories).values(showcaseCategories.map(({ id, label }) => ({
      id, slug: id, name: label,
    }))).onConflictDoNothing();

    const categoryIds = new Map((await tx.select().from(categories)).map(({ slug, id }) => [slug, id]));
    const resources: NewBookmark[] = catalog.map(({ category, tags, platforms, github, ...resource }) => {
      const categoryId = categoryIds.get(category);
      if (!categoryId) throw new Error("Missing showcase category " + category);
      return { ...resource, categoryId, tags: writeShowcaseTags(tags, platforms, github ?? "") };
    });
    const removed = replaceStarters ? await tx.delete(bookmarks)
      .where(and(inArray(bookmarks.slug, starterSlugs), eq(bookmarks.isArchived, false)))
      .returning({ id: bookmarks.id }) : [];
    const added = await tx.insert(bookmarks).values(resources).onConflictDoNothing().returning({ id: bookmarks.id });
    return { removed: removed.length, added: added.length };
  });
}
