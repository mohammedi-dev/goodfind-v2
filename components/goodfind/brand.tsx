import Link from "next/link";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link className={cn("gf-brand", className)} href="/" aria-label="Goodfind home" onClick={onClick}>
      <span className="gf-brand-mark"><Compass aria-hidden="true" /></span>
      <span>goodfind<span className="gf-brand-period">.</span></span>
    </Link>
  );
}
