"use client";

import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ShowcaseResource } from "@/lib/showcase";
import { ShowcaseCard } from "./showcase-card";

const railId = "showcase-rail";
const easing = [.22, .68, .24, 1] as const;

export function ShowcaseCarousel({ resources, label, sourceUrl, emptyMessage, reduceMotion, onOpen }: {
  resources: ShowcaseResource[];
  label: string;
  sourceUrl?: string;
  emptyMessage: string;
  reduceMotion: boolean;
  onOpen: (resource: ShowcaseResource, button: HTMLButtonElement) => void;
}) {
  const wheel = useMemo(() => [WheelGesturesPlugin({ forceWheelAxis: "x" })], []);
  const count = resources.length;
  const [viewport, carousel] = useEmblaCarousel({
    align: "start",
    loop: true,
    duration: reduceMotion ? 0 : 32,
    active: count > 3,
    // Match the whole-card capacities in showcase.css.
    breakpoints: {
      "(max-width: 67rem)": { active: count > 2 },
      "(max-width: 43rem)": { active: count > 1 },
    },
  }, wheel);
  const [controls, setControls] = useState({ previous: false, next: false });

  useEffect(() => {
    if (!carousel) return;
    const rail = carousel.rootNode();
    function sync() {
      if (!carousel) return;
      const capacity = Number(getComputedStyle(rail).getPropertyValue("--sc-visible-cards"));
      const overflows = count > capacity;
      const previous = overflows && carousel.canScrollPrev();
      const next = overflows && carousel.canScrollNext();
      setControls((current) => current.previous === previous && current.next === next ? current : { previous, next });
    }
    const startDrag = () => { rail.dataset.dragging = "true"; };
    const endDrag = () => { delete rail.dataset.dragging; };
    sync();
    carousel.on("select", sync).on("reInit", sync).on("pointerDown", startDrag).on("pointerUp", endDrag);
    return () => {
      carousel.off("select", sync).off("reInit", sync).off("pointerDown", startDrag).off("pointerUp", endDrag);
      endDrag();
    };
  }, [carousel, count]);

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (!carousel || event.target !== event.currentTarget || !(controls.previous || controls.next)) return;
    switch (event.key) {
      case "ArrowLeft":
        carousel.scrollPrev(reduceMotion);
        break;
      case "ArrowRight":
        carousel.scrollNext(reduceMotion);
        break;
      case "Home":
        carousel.scrollTo(0, reduceMotion);
        break;
      case "End":
        carousel.scrollTo(carousel.scrollSnapList().length - 1, reduceMotion);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <motion.div
      initial={{ opacity: reduceMotion ? 1 : 0.8, y: reduceMotion ? 0 : 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: reduceMotion ? 1 : 0.58, transition: { duration: reduceMotion ? 0 : 0.1 } }}
      transition={{ duration: reduceMotion ? 0 : 0.17, ease: easing }}
    >
      <div className="showcase-rail-controls">
        {sourceUrl && (
          <a className="showcase-external-link showcase-discovery-source" href={sourceUrl} target="_blank" rel="noopener noreferrer">
            Discovery source <span>FMHY</span> <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        )}
        <button type="button" onClick={() => carousel?.scrollPrev(reduceMotion)} disabled={!controls.previous} aria-controls={railId} aria-label="Previous resources">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => carousel?.scrollNext(reduceMotion)} disabled={!controls.next} aria-controls={railId} aria-label="Next resources">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <div
        id={railId}
        ref={count ? viewport : undefined}
        className="showcase-rail"
        role="region"
        tabIndex={count ? 0 : undefined}
        aria-label={label}
        onKeyDown={navigate}
      >
        {count ? (
          <motion.ul className="showcase-cards" initial="hidden" animate="visible">
            {resources.map((resource, index) => (
              <li className="showcase-card-item" key={resource.id}>
                <motion.div
                  className="showcase-card-motion"
                  variants={{
                    hidden: { opacity: reduceMotion ? 1 : 0.72, y: reduceMotion ? 0 : 5 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : Math.min(index, 5) * 0.025, ease: easing },
                    },
                  }}
                >
                  <ShowcaseCard resource={resource} onOpen={(button) => onOpen(resource, button)} />
                </motion.div>
              </li>
            ))}
          </motion.ul>
        ) : (
          <div className="showcase-empty"><p>{emptyMessage}</p></div>
        )}
      </div>
    </motion.div>
  );
}
