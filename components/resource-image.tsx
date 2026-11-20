"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ResourceImageProps = Omit<ComponentPropsWithoutRef<"img">, "src" | "alt" | "onError"> & {
  src?: string | null;
  alt: string;
  fallback: ReactNode;
};

export function ResourceImage({ src, alt, fallback, ...props }: ResourceImageProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (src && image?.complete && image.naturalWidth === 0) setFailedSource(src);
  }, [src]);

  if (!src || src === failedSource) return fallback;
  // External resource images come from user-selected sites.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} ref={imageRef} src={src} alt={alt} onError={() => setFailedSource(src)} />;
}
