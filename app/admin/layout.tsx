import type { ReactNode } from "react";
import { SiteFrame } from "@/components/goodfind/site-frame";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
