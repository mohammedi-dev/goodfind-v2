import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { getAllCategories, getAllBookmarks } from "@/lib/data";
import { hasAdminSession } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/admin/category-manager";
import { BookmarkManager } from "@/components/admin/bookmark-manager";
import { Section, Container } from "@/components/craft";
import { Bookmark, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import "../showcase.css";

export default async function AdminPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const [categories, bookmarks] = await Promise.all([
    getAllCategories(),
    getAllBookmarks(),
  ]);
  const enrichmentAvailable = Boolean(process.env.EXASEARCH_API_KEY && process.env.ANTHROPIC_API_KEY);

  return (
    <Section>
      <Toaster position="top-center" />
      <Container>
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage the Goodfind collection.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {bookmarks.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Resources</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {categories.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="bookmarks" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="bookmarks" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Categories
                </TabsTrigger>
              </TabsList>
              <form action="/api/admin/logout" method="post">
                <Button type="submit" variant="outline" className="rounded-xl text-muted-foreground">
                  Sign Out
                </Button>
              </form>
            </div>

            <TabsContent value="bookmarks" className="space-y-4">
              <BookmarkManager bookmarks={bookmarks} enrichmentAvailable={enrichmentAvailable} />
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="rounded-xl border bg-card">
                <div className="border-b bg-muted/50 p-4">
                  <h2 className="text-lg font-semibold">Category Management</h2>
                  <p className="text-sm text-muted-foreground">
                    Organize and structure your bookmark categories
                  </p>
                </div>
                <div className="p-6">
                  <CategoryManager categories={categories} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </Section>
  );
}
