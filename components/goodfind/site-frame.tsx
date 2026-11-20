import type { ReactNode } from "react";
import { Container } from "@/components/craft";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "./brand";
import { NewsletterDialog } from "./newsletter-dialog";

export function SiteFrame({ children, showNewsletter = true }: { children: ReactNode; showNewsletter?: boolean }) {
  return (
    <>
      <header className="gf-inner-header">
        <Container className="flex flex-wrap items-center justify-between gap-3">
          <Brand />
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
