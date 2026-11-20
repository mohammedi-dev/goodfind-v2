import { Mail } from "lucide-react";
import { EmailForm } from "@/components/email-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function NewsletterDialog({ compact = false }: { compact?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={compact ? "gf-toolbar-newsletter" : "gf-button gf-button-outline"}>
          <Mail aria-hidden="true" size={17} />
          Newsletter
        </button>
      </DialogTrigger>
      <DialogContent className="gf-dialog">
        <DialogHeader>
          <DialogTitle>The Goodfind newsletter</DialogTitle>
          <DialogDescription>Get new additions and curated collections in your inbox.</DialogDescription>
        </DialogHeader>
        <EmailForm />
      </DialogContent>
    </Dialog>
  );
}
