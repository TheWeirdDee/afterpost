"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";

type LenisWindow = Window & { __lenis?: Lenis };

/** Wrap every word in a masked span so lines can slide up out of a clip. */
function splitWords(root: HTMLElement) {
  if (root.dataset.splitDone) return;
  root.dataset.splitDone = "1";
  const walk = (node: Node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (child.textContent ?? "").split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const w = document.createElement("span");
          w.className = "w";
          w.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.12em;margin-bottom:-.12em";
          const i = document.createElement("span");
          i.className = "w-i";
          i.style.cssText = "display:inline-block;will-change:transform";
          i.textContent = part;
          w.appendChild(i);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(root);
}

export function MotionProvider() {
  const pathname = usePathname();

  // Smooth scroll, driven by the GSAP ticker so ScrollTrigger stays in sync.
  useEffect(() => {
    registerGsap();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      document.documentElement.classList.add("reduced");
      return;
    }
    const lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    (window as LenisWindow).__lenis = lenis;
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  // Section animations, re-scanned on every route change.
  useEffect(() => {
    registerGsap();
    const root = document.documentElement;
    const reduced = root.classList.contains("reduced");
    (window as LenisWindow).__lenis?.scrollTo(0, { immediate: true });
    if (reduced) return;

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();

        // headline: word-by-word mask reveal
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          splitWords(el);
          const words = el.querySelectorAll(".w-i");
          gsap.set(el, { opacity: 1 });
          gsap.fromTo(
            words,
            { yPercent: 118, rotate: 4 },
            {
              yPercent: 0,
              rotate: 0,
              duration: 1.4,
              ease: "expo.out",
              stagger: 0.045,
              delay: Number(el.dataset.delay ?? 0),
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            },
          );
        });

        // generic fade / rise / un-blur
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 56, opacity: 0, filter: "blur(10px)", scale: 0.985 },
            {
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              scale: 1,
              duration: 1.3,
              ease: "expo.out",
              delay: Number(el.dataset.delay ?? 0),
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
              clearProps: "filter,transform",
            },
          );
        });

        // staggered children
        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((el) => {
          gsap.fromTo(
            el.children,
            { y: 48, opacity: 0, scale: 0.97 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 1.1,
              ease: "expo.out",
              stagger: Number(el.dataset.stagger || 0.09),
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
              clearProps: "transform",
            },
          );
        });

        // scroll-scrubbed parallax
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amt = Number(el.dataset.parallax);
          gsap.to(el, {
            yPercent: amt * 100,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 0.8 },
          });
        });

        // zoom-in frame driven by scroll
        mm.add("(min-width: 901px)", () => {
          gsap.utils.toArray<HTMLElement>("[data-zoom]").forEach((el) => {
            gsap.fromTo(
              el,
              { scale: 0.78, rotateX: 14, y: 80, opacity: 0.4, transformOrigin: "50% 100%" },
              { scale: 1, rotateX: 0, y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "top 25%", scrub: 0.9 } },
            );
          });
        });
        mm.add("(max-width: 900px)", () => {
          gsap.utils.toArray<HTMLElement>("[data-zoom]").forEach((el) => {
            gsap.fromTo(
              el,
              { scale: 0.94, y: 40, opacity: 0.5 },
              { scale: 1, y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "top 55%", scrub: 0.7 } },
            );
          });
        });

        // number counters
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const end = Number(el.dataset.count);
          const o = { v: 0 };
          gsap.to(o, {
            v: end,
            duration: 2,
            ease: "power3.out",
            onUpdate: () => {
              el.textContent = String(Math.round(o.v));
            },
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });

        // marquee that speeds up with scroll velocity
        gsap.utils.toArray<HTMLElement>("[data-marquee]").forEach((el) => {
          const loop = gsap.to(el, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
          ScrollTrigger.create({
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 260);
              gsap.to(loop, { timeScale: 1 + Math.abs(v), duration: 0.3, overwrite: true });
              gsap.to(loop, { timeScale: 1, duration: 1.4, delay: 0.3 });
            },
          });
        });

        // ambient glows drift as the page moves
        gsap.utils.toArray<HTMLElement>(".glow").forEach((el, i) => {
          gsap.to(el, {
            y: (i % 2 ? -1 : 1) * 160,
            x: (i % 2 ? 1 : -1) * 80,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: 1.2 },
          });
        });

        // magnetic primary buttons (fine pointers only)
        mm.add("(hover: hover) and (pointer: fine)", () => {
          const cleanups: (() => void)[] = [];
          gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
            const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
            const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
            const move = (e: MouseEvent) => {
              const r = el.getBoundingClientRect();
              xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
              yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
            };
            const leave = () => {
              xTo(0);
              yTo(0);
            };
            el.addEventListener("mousemove", move);
            el.addEventListener("mouseleave", leave);
            cleanups.push(() => {
              el.removeEventListener("mousemove", move);
              el.removeEventListener("mouseleave", leave);
            });
          });
          return () => cleanups.forEach((c) => c());
        });
      });
    } catch (e) {
      console.error("motion init failed; revealing content", e);
      root.classList.add("reduced");
    }

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
