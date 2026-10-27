"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let ready = false;
export function registerGsap() {
  if (!ready && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    ready = true;
  }
  return { gsap, ScrollTrigger };
}
export { gsap, ScrollTrigger };
