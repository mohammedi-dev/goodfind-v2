import type { ReactNode } from "react";
import { SiteFrame } from "@/components/goodfind/site-frame";

export default function ResourceLayout({ children }: { children: ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
