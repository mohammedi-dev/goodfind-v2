"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Link2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ShowcaseLogo } from "@/components/goodfind/showcase-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { bulkUploadBookmarks, deleteBookmark } from "@/lib/actions";
import { moveShowcaseResource } from "@/lib/resource-actions";
import { compareShowcaseOrder, isShowcaseCategory, resourceCategory, showcaseCategories } from "@/lib/showcase";
import { toShowcaseResource } from "@/lib/showcase-catalog";
import { ResourceEditor } from "./resource-editor";
import type { AdminResource } from "./resource-editor";

const controlClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function BulkImport({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("urls");
    if (!(file instanceof File) || !file.size || file.size > 100_000) {
      toast.error("Choose a text or CSV file under 100 KB.");
      return;
    }
    setBusy(true);
    try {
      const urls = (await file.text()).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !/^url$/i.test(line));
      const result = await bulkUploadBookmarks(null, { urls: urls.join("\n") });
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? "Drafts imported.");
        onOpenChange(false);
      }
    } catch {
      toast.error("Could not import the file.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Bulk import</SheetTitle>
          <SheetDescription>Import one URL per line using the configured enrichment service. Entries are saved as drafts.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="bulk-urls">URL file</Label>
            <Input id="bulk-urls" name="urls" type="file" accept=".csv,.txt" required />
          </div>
          <div className="flex justify-end gap-2">
            <SheetClose asChild><Button type="button" variant="ghost" disabled={busy}>Cancel</Button></SheetClose>
            <Button disabled={busy}>{busy ? "Importing" : "Import drafts"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function BookmarkManager({ bookmarks, enrichmentAvailable }: { bookmarks: AdminResource[]; enrichmentAvailable: boolean }) {
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ resource: AdminResource | null; mode: "manual" | "url" } | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [toDelete, setToDelete] = useState<AdminResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [moving, setMoving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const editorTrigger = useRef<HTMLElement | null>(null);
  const deletionTrigger = useRef<HTMLElement | null>(null);
  const collectionHeading = useRef<HTMLHeadingElement>(null);
  const router = useRouter();

  const term = query.trim().toLowerCase();
  const visible = bookmarks.filter((item) => (
    (category === "all" || resourceCategory(item) === category) &&
    (status === "all" || item.isArchived === (status === "draft")) &&
    (!term || [item.title, item.description, item.url].some((value) => value?.toLowerCase().includes(term)))
  )).sort(compareShowcaseOrder);
  const canReorder = isShowcaseCategory(category) && status === "all" && !term;

  function openEditor(trigger: HTMLElement, resource: AdminResource | null, mode: "manual" | "url" = "manual") {
    toast.dismiss();
    editorTrigger.current = trigger;
    setEditor({ resource, mode });
  }

  async function move(item: AdminResource, direction: -1 | 1, neighbor?: AdminResource) {
    if (!neighbor || moving) return;
    setMoving(true);
    try {
      const result = await moveShowcaseResource(item.id, neighbor.id, category, direction);
      if (result.error) toast.error(result.error);
      else toast.success("Resource moved.");
      router.refresh();
    } catch {
      toast.error("Could not move the resource.");
    } finally {
      setMoving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteBookmark(null, { id: String(toDelete.id), url: toDelete.url });
      if (result.error) {
        setDeleteError(result.error);
      } else {
        toast.success("Resource deleted.");
        deletionTrigger.current = null;
        setToDelete(null);
        router.refresh();
      }
    } catch {
      setDeleteError("Could not delete the resource.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="collection-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="collection-heading" ref={collectionHeading} tabIndex={-1} className="text-xl font-semibold tracking-tight">Resources</h2>
          <p className="mt-1 text-sm text-muted-foreground">Keep drafts private and set the order of each showcase category.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {enrichmentAvailable && <Button size="sm" variant="ghost" onClick={() => setBulkOpen(true)}><Upload className="mr-2 h-4 w-4" aria-hidden="true" /> Bulk import</Button>}
          <Button size="sm" variant="outline" onClick={(event) => openEditor(event.currentTarget, null)}><Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add resource</Button>
          <Button size="sm" onClick={(event) => openEditor(event.currentTarget, null, "url")}><Link2 className="mr-2 h-4 w-4" aria-hidden="true" /> Import URL</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_10rem_9rem] sm:p-4">
        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <Label htmlFor="filter-resource-search">Find a resource</Label>
          <Input id="filter-resource-search" type="search" value={query} placeholder="Name or URL" onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="filter-resource-category">Category</Label>
          <select id="filter-resource-category" className={controlClass} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {showcaseCategories.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="filter-resource-status">Visibility</Label>
          <select id="filter-resource-status" className={controlClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft / hidden</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2 px-1 text-xs text-muted-foreground">
        <p role="status">{visible.length} {visible.length === 1 ? "resource" : "resources"}</p>
        <p>{canReorder ? "Use the arrows to set the order in this category." : "Select a category and clear other filters to reorder."}</p>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          {bookmarks.length ? "No resources match these filters." : "Your collection is empty. Add your first resource or import a URL."}
        </div>
      ) : (
        <ul aria-label="Resources" className="divide-y rounded-xl border bg-card">
          {visible.map((item, index) => {
            const resource = toShowcaseResource(item);
            const label = showcaseCategories.find((group) => group.id === resource.category)?.label;
            return (
              <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-3 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="showcase-admin-logo grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border bg-[#2a2b32] text-white">
                    <ShowcaseLogo resource={resource} size={21} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium" title={item.title}>{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.description || item.url}</p>
                  </div>
                </div>
                <div className="col-start-2 row-span-2 row-start-1 flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                  {canReorder && (
                    <div className="flex" role="group" aria-label="Resource order">
                      <Button size="icon" type="button" variant="ghost" className="h-9 w-8" aria-label={"Move " + item.title + " earlier"} title="Move earlier" disabled={moving || index === 0} onClick={() => move(item, -1, visible[index - 1])}><ArrowUp className="h-4 w-4" aria-hidden="true" /></Button>
                      <Button size="icon" type="button" variant="ghost" className="h-9 w-8" aria-label={"Move " + item.title + " later"} title="Move later" disabled={moving || index === visible.length - 1} onClick={() => move(item, 1, visible[index + 1])}><ArrowDown className="h-4 w-4" aria-hidden="true" /></Button>
                    </div>
                  )}
                  <Button size="sm" type="button" variant="outline" aria-label={"Edit " + item.title} onClick={(event) => openEditor(event.currentTarget, item)}>Edit</Button>
                  <Button size="icon" type="button" variant="ghost" className="h-9 w-8 text-muted-foreground hover:text-red-700 dark:hover:text-red-300" aria-label={"Delete " + item.title} title="Delete resource" onClick={(event) => {
                    deletionTrigger.current = event.currentTarget;
                    setDeleteError("");
                    setToDelete(item);
                  }}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                  {!item.isArchived && (
                    <Button size="icon" variant="ghost" asChild className="hidden h-9 w-8 text-muted-foreground sm:inline-flex">
                      <a href={"/" + encodeURIComponent(item.slug)} target="_blank" rel="noopener noreferrer" aria-label={"Open " + item.title + " public page"} title="Open public page"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
                    </Button>
                  )}
                </div>
                <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-1.5 pl-[3.25rem]">
                  <Badge variant="secondary" className="text-[.6875rem]">{label}</Badge>
                  <Badge variant="outline" className={item.isArchived ? "text-[.6875rem] text-muted-foreground" : "text-[.6875rem] text-emerald-700 dark:text-emerald-400"}>{item.isArchived ? "Draft / hidden" : "Published"}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={Boolean(editor)} onOpenChange={(open) => { if (!open && !editorSaving) setEditor(null); }}>
        <SheetContent
          className="flex w-full flex-col gap-0 p-0 sm:max-w-5xl"
          onOpenAutoFocus={(event) => {
            const input = document.getElementById("resource-url");
            if (input) { event.preventDefault(); input.focus(); }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            (editorTrigger.current?.isConnected ? editorTrigger.current : collectionHeading.current)?.focus();
          }}
        >
          {editor && <ResourceEditor resource={editor.resource} mode={editor.mode} category={isShowcaseCategory(category) ? category : "software"} enrichmentAvailable={enrichmentAvailable} onSavingChange={setEditorSaving} onSaved={() => { setEditor(null); router.refresh(); }} />}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => { if (!open && !isDeleting) setToDelete(null); }}>
        <DialogContent onCloseAutoFocus={(event) => {
          event.preventDefault();
          (deletionTrigger.current ?? collectionHeading.current)?.focus();
        }}>
          <DialogTitle>Delete resource?</DialogTitle>
          <DialogDescription>{toDelete?.title} and its uploaded images will be permanently removed from Goodfind.</DialogDescription>
          {deleteError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setToDelete(null)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? "Deleting" : "Delete resource"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      {enrichmentAvailable && <BulkImport open={bulkOpen} onOpenChange={setBulkOpen} />}
    </section>
  );
}
