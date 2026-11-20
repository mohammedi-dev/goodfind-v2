import { db } from "./client";
import { bookmarks, categories } from "./schema";
import type { NewBookmark } from "./schema";
import { writeShowcaseTags } from "@/lib/showcase";

const rows = [
  ["ai", "chatgpt", "ChatGPT", "https://chatgpt.com/", "Draft, brainstorm, and work through questions in a conversation.", "Good for turning rough ideas into outlines and getting a first pass on unfamiliar topics.", "Assistant, Writing", "Web, Windows, macOS, iOS, Android", ""],
  ["ai", "claude", "Claude", "https://claude.ai/", "Work through long documents, writing tasks, and code with Anthropic’s assistant.", "Useful for summarizing source material, editing drafts, and explaining a piece of code.", "Assistant, Writing", "Web, Windows, macOS, iOS, Android", ""],
  ["ai", "ollama", "Ollama", "https://ollama.com/", "Run and manage language models on your own computer.", "Try local models, switch between them, and connect supported tools to a local model server.", "Local AI", "macOS, Windows, Linux", "https://github.com/ollama/ollama"],
  ["ai", "hugging-face", "Hugging Face", "https://huggingface.co/", "Explore a community hub for models, datasets, and interactive demos.", "Useful for comparing model cards, finding datasets, and trying community demos in Spaces.", "Models, Datasets", "Web", "https://github.com/huggingface/huggingface_hub"],
  ["gaming", "steam", "Steam", "https://store.steampowered.com/", "Browse, install, and organize your PC game library.", "Useful for keeping games, updates, and community guides in one place. Check each game’s platform support.", "Launcher, Store", "Windows, macOS, Linux", ""],
  ["gaming", "heroic", "Heroic Games Launcher", "https://heroicgameslauncher.com/", "A desktop launcher for Epic, GOG, and Amazon game libraries.", "Useful for managing games from several stores in one client, especially when setting up a Linux gaming library.", "Open Source, Launcher", "Windows, macOS, Linux", "https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher"],
  ["gaming", "retroarch", "RetroArch", "https://www.retroarch.com/", "A unified frontend for emulators and other software cores.", "Useful for sharing controller mappings, shaders, and settings across several systems.", "Open Source, Emulation", "Windows, macOS, Linux, Android, iOS", "https://github.com/libretro/RetroArch"],
  ["gaming", "pcgamingwiki", "PCGamingWiki", "https://www.pcgamingwiki.com/", "Find PC game fixes, settings, and compatibility notes.", "Start here when an older game needs a fullscreen fix or you want to know where it keeps saves.", "Reference, Troubleshooting", "Web", ""],
  ["media", "vlc", "VLC", "https://www.videolan.org/vlc/", "Play local media and streams in a wide range of formats.", "A handy player for unfamiliar file formats, subtitles, and network streams.", "Open Source, Playback", "Windows, macOS, Linux, iOS, Android", ""],
  ["media", "audacity", "Audacity", "https://www.audacityteam.org/", "Record, trim, and edit audio on your desktop.", "Useful for cleaning up voice recordings, trimming clips, and exporting a finished audio file.", "Open Source, Audio editing", "Windows, macOS, Linux", "https://github.com/audacity/audacity"],
  ["media", "jellyfin", "Jellyfin", "https://jellyfin.org/", "Stream your own media library from a self-hosted server.", "Organize a local collection and play it on compatible browsers, phones, and TV clients.", "Open Source, Self-hosting", "Windows, macOS, Linux, Web", "https://github.com/jellyfin/jellyfin"],
  ["media", "handbrake", "HandBrake", "https://handbrake.fr/", "Convert video files with presets for common playback needs.", "Useful for making a smaller copy of a video or converting it for another device.", "Open Source, Video", "Windows, macOS, Linux", "https://github.com/HandBrake/HandBrake"],
] as const;

export async function seedShowcase() {
  const groups = ["ai", "software", "gaming", "media"] as const;
  await db.transaction(async (tx) => {
    await tx.insert(categories).values(groups.map((id) => ({
      id,
      slug: id,
      name: id === "ai" ? "AI" : id[0].toUpperCase() + id.slice(1),
    }))).onConflictDoNothing();
    const current = await tx.select().from(categories);
    const resources: NewBookmark[] = [];
    for (const [category, slug, title, url, description, overview, tags, platforms, github] of rows) {
      const categoryId = current.find((item) => item.slug === category)?.id;
      if (categoryId) resources.push({ categoryId, slug, title, url, description, overview, tags: writeShowcaseTags(tags, platforms, github) });
    }
    if (resources.length) await tx.insert(bookmarks).values(resources).onConflictDoNothing();
  });
}
