"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import { LoaderCircle, Search, X } from "lucide-react";

export function DiscoverySearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const currentTerm = params.get("search") ?? "";
  const [value, setValue] = useState(currentTerm);
  const [isPending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const pendingTerm = useRef<string | null>(null);

  function submit(term: string) {
    const url = new URL(window.location.href);
    if (url.pathname !== pathname) return;
    const cleaned = term.trim();
    const existing = url.searchParams.get("search") ?? "";
    // The current URL can match while an earlier search navigation is still pending.
    if (cleaned === existing && !isPending) return;

    pendingTerm.current = cleaned;
    url.searchParams.delete("page");
    if (cleaned) url.searchParams.set("search", cleaned);
    else url.searchParams.delete("search");
    startTransition(() => router.replace(`${pathname}${url.search}`, { scroll: false }));
  }

  const debouncedSubmit = useDebouncedCallback(submit, 280);

  useEffect(() => {
    const ownUpdate = currentTerm === pendingTerm.current;
    pendingTerm.current = null;
    if (!ownUpdate) {
      debouncedSubmit.cancel();
      setValue(currentTerm);
    }
  }, [currentTerm, debouncedSubmit]);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (document.querySelector('[role="dialog"][data-state="open"]')) return;
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  return (
    <form
      className="gf-search"
      role="search"
      aria-busy={isPending}
      action="/"
      onSubmit={(event) => {
        event.preventDefault();
        debouncedSubmit.cancel();
        submit(value);
      }}
    >
      <button className="gf-search-submit" aria-label="Submit search" type="submit">
        {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> : <Search aria-hidden="true" size={18} />}
      </button>
      <input
        ref={input}
        name="search"
        aria-label="Search resources"
        autoComplete="off"
        placeholder="Search resources…"
        value={value}
        onChange={(event) => {
          const term = event.target.value;
          setValue(term);
          debouncedSubmit(term);
        }}
      />
      {value ? (
        <button
          className="gf-search-clear"
          type="button"
          aria-label="Clear search"
          onClick={() => {
            debouncedSubmit.cancel();
            setValue("");
            submit("");
            input.current?.focus();
          }}
        >
          <X aria-hidden="true" size={16} />
        </button>
      ) : <kbd title="Control or Command + K" aria-hidden="true">⌘/Ctrl K</kbd>}
    </form>
  );
}
