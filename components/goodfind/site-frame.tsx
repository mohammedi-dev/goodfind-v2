import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/craft";
import { ThemeToggle } from "@/components/theme-toggle";
import { NewsletterDialog } from "./newsletter-dialog";

export function SiteFrame({ children, showNewsletter = true }: { children: ReactNode; showNewsletter?: boolean }) {
  return (
    <>
      <header className="gf-inner-header">
        <Container className="flex flex-wrap items-center justify-between gap-3">
          <Link className="gf-home-link" href="/"><ArrowLeft size={16} aria-hidden="true" /> All resources</Link>
          <div className="flex items-center gap-2">
            {showNewsletter && <NewsletterDialog compact />}
            <ThemeToggle />
          </div>
        </Container>
      </header>
      {children}
    </>
  );
}
