"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ExternalLink, Eye, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ResultDisplay } from "./result-display";
import { ShowcaseCard } from "@/components/goodfind/showcase-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetClose, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { generateContent } from "@/lib/actions";
import type { getAllBookmarks } from "@/lib/data";
import { saveShowcaseResource } from "@/lib/resource-actions";
import {
  artworkPatterns, isArtworkPattern, isHexColor, isShowcaseCategory,
  resourceCategory, showcaseCategories, writeShowcaseTags,
} from "@/lib/showcase";
import { toShowcaseResource } from "@/lib/showcase-catalog";
import { generateSlug, isBookmarkUrl } from "@/lib/utils";

export type AdminResource = Awaited<ReturnType<typeof getAllBookmarks>>[number];

type ImportedMetadata = {
  title: string;
  description: string;
  url: string;
  favicon: string;
  ogImage: string;
  github: string;
  website: string;
};

const patternLabels = {
  orbit: "Orbits", stack: "Stack", grid: "Grid", rays: "Rays",
  signal: "Waveform", record: "Record", swatches: "Swatches", terminal: "Terminal",
};

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function useFilePreview(file: File | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return url;
}

function ImageUpload({ kind, file, hasUpload, removed, onChange }: {
  kind: "logo" | "artwork";
  file: File | null;
  hasUpload: boolean;
  removed: boolean;
  onChange: (file: File | null, remove: boolean) => void;
}) {
  const id = `resource-${kind}-file`;
  const input = useRef<HTMLInputElement>(null);
  const label = kind === "logo" ? "logo" : "artwork";
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input
        ref={input}
        id={id}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label={`Upload ${label} file`}
        onChange={(event) => {
          const selected = event.currentTarget.files?.[0];
          if (!selected) return;
          if (selected.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(selected.type)) {
            toast.error("Choose a PNG, JPEG, or WebP image under 2 MB.");
          } else {
            onChange(selected, false);
          }
          event.currentTarget.value = "";
        }}
      />
      <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()}>
        <Upload className="mr-2 h-4 w-4" aria-hidden="true" /> Upload {label}
      </Button>
      {(file || (hasUpload && !removed)) && (
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null, !file)}>
          {file ? "Discard selected file" : `Remove uploaded ${label}`}
        </Button>
      )}
      {!file && hasUpload && removed && (
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null, false)}>Undo removal</Button>
      )}
      {file && <span className="min-w-0 break-all text-xs text-muted-foreground">{file.name}</span>}
      {!file && hasUpload && !removed && <span className="text-xs text-muted-foreground">Uploaded image in use</span>}
    </div>
  );
}

function ColorField({ name, label, value, fallback, onChange }: {
  name: "accent" | "background";
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={`resource-${name}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color" className="h-10 w-10 shrink-0 cursor-pointer rounded-md border bg-background p-1"
          aria-label={`Pick ${label.toLowerCase()}`}
          value={isHexColor(value) ? value : fallback} onChange={(event) => onChange(event.target.value)}
        />
        <Input
          id={`resource-${name}`} name={name} value={value} onChange={(event) => onChange(event.target.value)}
          placeholder="Default" pattern="#[a-fA-F0-9]{6}" maxLength={7} className="min-w-0"
        />
        {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>Reset</Button>}
      </div>
    </div>
  );
}

export function ResourceEditor({ resource, mode, category, enrichmentAvailable, onSavingChange, onSaved }: {
  resource: AdminResource | null;
  mode: "manual" | "url";
  category: string;
  enrichmentAvailable: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: () => void;
}) {
  const current = resource ? toShowcaseResource(resource) : null;
  const [values, setValues] = useState(() => ({
    url: resource?.url ?? "",
    title: resource?.title ?? "",
    slug: resource?.slug ?? "",
    description: resource?.description ?? "",
    overview: resource?.overview ?? "",
    recommendation: current?.recommendation ?? "",
    category: resource ? (isShowcaseCategory(resource.category?.slug) ? resource.category!.slug : "keep") : category,
    github: current?.github ?? "",
    platforms: current?.platforms.join(", ") ?? "",
    tags: current?.tags.join(", ") ?? "",
    favicon: resource?.favicon ?? "",
    screenshot: resource?.screenshot ?? "",
    artwork: current?.artworkUrl ?? "",
    ogImage: resource?.ogImage ?? "",
    accent: resource?.appearance?.accent ?? "",
    background: resource?.appearance?.background ?? "",
    pattern: resource?.appearance?.pattern ?? "",
    favorite: resource?.isFavorite ?? false,
  }));
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeArtwork, setRemoveArtwork] = useState(false);
  const [busy, setBusy] = useState<"metadata" | "draft" | "publish" | "enrichment" | null>(null);
  const [metadata, setMetadata] = useState<ImportedMetadata | null>(null);
  const [searchResults, setSearchResults] = useState<string>();
  const [error, setError] = useState("");
  const logoPreview = useFilePreview(logoFile);
  const artworkPreview = useFilePreview(artworkFile);
  const request = useRef<AbortController | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => request.current?.abort(), []);

  const editValue = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };
  const imageIntent = busy === "draft" || busy === "publish";
  const originalCategory = resource ? resourceCategory(resource) : undefined;
  const keepLegacyCategory = resource && !isShowcaseCategory(resource.category?.slug);
  const preview = toShowcaseResource({
    id: resource?.id ?? 0,
    slug: resource?.slug ?? (values.slug || generateSlug(values.title)),
    url: values.url,
    title: values.title.trim() || "Resource name",
    description: values.description || null,
    overview: values.overview || null,
    category: values.category === "keep" ? resource?.category ?? null : { slug: values.category },
    favicon: values.favicon,
    screenshot: values.screenshot,
    tags: writeShowcaseTags(values.tags, values.platforms, values.github, {
      artworkUrl: values.artwork,
      recommendation: values.recommendation,
    }),
    appearance: {
      accent: values.accent,
      background: values.background,
      pattern: values.pattern,
      logoId: removeLogo ? null : resource?.appearance?.logoId ?? null,
      artworkId: removeArtwork ? null : resource?.appearance?.artworkId ?? null,
    },
  });
  if (logoPreview) preview.favicon = logoPreview;
  if (artworkPreview) preview.screenshot = artworkPreview;

  async function importMetadata() {
    setError("");
    setMetadata(null);
    const pasted = values.url.trim();
    const url = !pasted || /^[a-z][a-z0-9+.-]*:/i.test(pasted) ? pasted : `https://${pasted}`;
    if (!isBookmarkUrl(url)) {
      setError("Enter a website or GitHub URL to import.");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy("metadata");
    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`, { signal: controller.signal });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) throw new Error("Sign in again to import metadata.");
        throw new Error(result.error ?? "Could not import this URL.");
      }
      setMetadata(result);
      setValues((previous) => ({
        ...previous,
        url: result.url,
        title: previous.title || result.title,
        description: previous.description || result.description,
        github: previous.github || result.github,
        favicon: previous.favicon || result.favicon,
        ogImage: previous.ogImage || result.ogImage,
      }));
    } catch (failure) {
      if (!controller.signal.aborted) setError((failure as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy(null);
    }
  }

  async function enrich() {
    setBusy("enrichment");
    setError("");
    try {
      const result = await generateContent(values.url);
      if (result.error) {
        setError(result.error);
        return;
      }
      setValues((previous) => ({
        ...previous, overview: result.overview || previous.overview,
        title: previous.title || result.title, description: previous.description || result.description,
        favicon: previous.favicon || result.favicon, ogImage: previous.ogImage || result.ogImage,
      }));
      setSearchResults(result.search_results);
      toast.success("Overview prepared for review.");
    } catch {
      setError("Could not generate an overview.");
    } finally {
      setBusy(null);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value === "publish" ? "publish" : "draft";
    const form = new FormData(event.currentTarget);
    form.set("intent", intent);
    form.set("favorite", String(values.favorite));
    if (resource) form.set("id", String(resource.id));
    if (logoFile) form.set("logoFile", logoFile);
    if (artworkFile) form.set("artworkFile", artworkFile);
    if (removeLogo) form.set("removeLogo", "true");
    if (removeArtwork) form.set("removeArtwork", "true");
    if (searchResults) form.set("searchResults", searchResults);
    setError("");
    setBusy(intent);
    onSavingChange(true);
    try {
      const result = await saveShowcaseResource(form);
      if (result.error) setError(result.error);
      else {
        toast.success(intent === "publish" ? "Resource published." : "Draft saved.");
        onSaved();
      }
    } catch {
      setError("Could not save the resource. Please try again.");
    } finally {
      setBusy(null);
      onSavingChange(false);
    }
  }

  const scrollToPreview = () => {
    previewHeading.current?.scrollIntoView({ block: "start" });
    previewHeading.current?.focus({ preventScroll: true });
  };
  const published = Boolean(resource && !resource.isArchived);

  return (
    <>
      <SheetHeader className="border-b px-5 py-4 pr-12 text-left sm:px-6 sm:pr-12">
        <SheetTitle className="text-xl">{resource ? "Edit resource" : mode === "url" ? "Import from URL" : "Add resource"}</SheetTitle>
        <SheetDescription>{resource ? "Update the resource and preview its public card." : "Review the resource and its artwork before publishing."}</SheetDescription>
      </SheetHeader>
      <form onSubmit={save} aria-busy={imageIntent} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid min-w-0 items-start gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)]">
            <div className="min-w-0 space-y-5">
              <fieldset className="space-y-3 rounded-xl border bg-card px-4 pb-4">
                <legend className="px-1 text-sm font-semibold">Resource</legend>
                <div className="grid gap-2">
                  <Label htmlFor="resource-url">Website URL</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input className="min-w-0 flex-1 basis-48" id="resource-url" name="url" required value={values.url}
                      placeholder="https://example.com" disabled={busy === "metadata"} maxLength={2048}
                      onChange={(event) => { editValue("url", event.target.value); setMetadata(null); }} />
                    <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={importMetadata}>
                      {busy === "metadata" && <Loader2 className="mr-1 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                      {busy === "metadata" ? "Reading metadata" : "Read metadata"}
                    </Button>
                  </div>
                </div>
                {metadata && (
                  <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                    <p role="status">Metadata filled in where fields were empty.</p>
                    {metadata.website && metadata.website !== values.url && (
                      <Button variant="outline" size="sm" type="button" onClick={() => editValue("url", metadata.website)}>
                        <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" /> Use project website
                      </Button>
                    )}
                    <details className="space-y-2">
                      <summary className="cursor-pointer text-muted-foreground">Review imported metadata</summary>
                      <ResultDisplay metadata={metadata} error={null} />
                      {metadata.ogImage && <Button variant="outline" size="sm" type="button" onClick={() => editValue("artwork", metadata.ogImage)}>Use image as linked artwork</Button>}
                    </details>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="resource-name">Resource name</Label>
                  <Input id="resource-name" name="title" value={values.title} onChange={(event) => editValue("title", event.target.value)} required maxLength={120} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-category">Showcase category</Label>
                  <select id="resource-category" name="category" className={selectClass} value={values.category} onChange={(event) => editValue("category", event.target.value)}>
                    {keepLegacyCategory && <option value="keep">Keep current assignment ({showcaseCategories.find((item) => item.id === originalCategory)?.label})</option>}
                    {showcaseCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-description">Card description</Label>
                  <Textarea id="resource-description" name="description" rows={2} maxLength={1000} value={values.description} onChange={(event) => editValue("description", event.target.value)} />
                </div>
              </fieldset>

              <fieldset className="space-y-3 rounded-xl border bg-card px-4 pb-4">
                <legend className="px-1 text-sm font-semibold">Details</legend>
                <div className="grid gap-2">
                  <Label htmlFor="resource-overview">Overview</Label>
                  <Textarea id="resource-overview" name="overview" rows={3} value={values.overview} onChange={(event) => editValue("overview", event.target.value)} />
                  {enrichmentAvailable && <Button type="button" className="w-fit" size="sm" variant="outline" disabled={Boolean(busy) || !isBookmarkUrl(values.url)} onClick={enrich}>Generate overview</Button>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-recommendation">Public recommendation</Label>
                  <Textarea id="resource-recommendation" name="recommendation" rows={2} value={values.recommendation} onChange={(event) => editValue("recommendation", event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-github">GitHub repository URL</Label>
                  <Input id="resource-github" name="github" value={values.github} onChange={(event) => editValue("github", event.target.value)} placeholder="https://github.com/owner/repository" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="resource-platforms">Platforms</Label>
                    <Input id="resource-platforms" name="platforms" value={values.platforms} onChange={(event) => editValue("platforms", event.target.value)} placeholder="Web, macOS, Linux" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="resource-tags">Tags</Label>
                    <Input id="resource-tags" name="tags" value={values.tags} onChange={(event) => editValue("tags", event.target.value)} placeholder="Design, Open Source" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-3 rounded-xl border bg-card px-4 pb-4">
                <legend className="px-1 text-sm font-semibold">Appearance</legend>
                <p className="text-xs text-muted-foreground">Use authentic logos and permitted artwork. PNG, JPEG, or WebP uploads can be up to 2 MB each.</p>
                <div className="grid gap-2">
                  <Label htmlFor="resource-logo">Logo URL</Label>
                  <Input id="resource-logo" name="favicon" value={values.favicon} onChange={(event) => editValue("favicon", event.target.value)} placeholder="https://…" />
                  <ImageUpload kind="logo" file={logoFile} hasUpload={Boolean(resource?.appearance?.logoId)} removed={removeLogo} onChange={(file, remove) => { setError(""); setLogoFile(file); setRemoveLogo(remove); }} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-artwork">Artwork URL</Label>
                  <Input id="resource-artwork" name="artwork" value={values.artwork} onChange={(event) => editValue("artwork", event.target.value)} placeholder="https://…" />
                  <ImageUpload kind="artwork" file={artworkFile} hasUpload={Boolean(resource?.appearance?.artworkId)} removed={removeArtwork} onChange={(file, remove) => { setError(""); setArtworkFile(file); setRemoveArtwork(remove); }} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-screenshot">Screenshot URL</Label>
                  <Input id="resource-screenshot" name="screenshot" value={values.screenshot} onChange={(event) => editValue("screenshot", event.target.value)} placeholder="https://…" />
                  <p className="text-xs text-muted-foreground">Uploaded artwork takes priority, followed by the linked screenshot and linked artwork.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ColorField name="accent" label="Accent color" value={values.accent} fallback={preview.accent} onChange={(value) => editValue("accent", value)} />
                  <ColorField name="background" label="Background color" value={values.background} fallback="#19191e" onChange={(value) => editValue("background", value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-pattern">Fallback pattern</Label>
                  <select id="resource-pattern" name="pattern" className={selectClass} value={isArtworkPattern(values.pattern) ? values.pattern : ""} onChange={(event) => editValue("pattern", event.target.value)}>
                    <option value="">Default</option>
                    {artworkPatterns.map((pattern) => <option key={pattern} value={pattern}>{patternLabels[pattern]}</option>)}
                  </select>
                </div>
              </fieldset>

              <details className="space-y-3 rounded-xl border bg-card p-4">
                <summary className="cursor-pointer text-sm font-semibold">Page and ordering options</summary>
                <div className="grid gap-2">
                  <Label htmlFor="resource-slug">Page slug</Label>
                  <Input id="resource-slug" name="slug" value={values.slug} onChange={(event) => editValue("slug", event.target.value)} placeholder={generateSlug(values.title) || "resource-name"} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resource-sharing">Social preview image URL</Label>
                  <Input id="resource-sharing" name="ogImage" value={values.ogImage} onChange={(event) => editValue("ogImage", event.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="resource-favorite" checked={values.favorite} onCheckedChange={(checked) => editValue("favorite", checked === true)} />
                  <Label htmlFor="resource-favorite">Favorite</Label>
                </div>
              </details>
            </div>

            <aside className="min-w-0 space-y-3 md:sticky md:top-5" aria-labelledby="resource-preview">
              <h3 ref={previewHeading} tabIndex={-1} className="scroll-mt-3 text-sm font-semibold" id="resource-preview">Card preview</h3>
              <div className="showcase-card-preview"><ShowcaseCard resource={preview} /></div>
              {values.recommendation && <p className="break-words rounded-lg border p-3 text-sm text-muted-foreground">{values.recommendation}</p>}
            </aside>
          </div>
        </div>
        <div className="space-y-2 border-t bg-background px-5 py-3 sm:px-6">
          {error && <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" className="md:hidden" onClick={scrollToPreview}>
              <Eye className="mr-2 h-4 w-4" aria-hidden="true" /> Preview
            </Button>
            <div className="ml-auto flex flex-wrap gap-2">
              <SheetClose asChild><Button type="button" variant="ghost" size="sm" disabled={imageIntent}>Cancel</Button></SheetClose>
              <Button type="submit" value={published ? "publish" : "draft"} size="sm" variant={published ? "default" : "outline"} disabled={Boolean(busy)}>
                {published ? "Save changes" : "Save draft"}
              </Button>
              <Button type="submit" value={published ? "draft" : "publish"} size="sm" variant={published ? "outline" : "default"} disabled={Boolean(busy)}>
                {published ? "Hide resource" : "Publish resource"}
              </Button>
            </div>
          </div>
          {imageIntent && <p role="status" className="text-xs text-muted-foreground">Saving resource…</p>}
        </div>
      </form>
    </>
  );
}
