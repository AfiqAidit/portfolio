"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/content/profile";
import { featuredWork, featuredWorkIntro } from "@/content/featured-work";
import { FeaturedWorkCard } from "@/components/shared/FeaturedWorkCard";
import { ContactEmail } from "@/components/shared/SiteNav";

gsap.registerPlugin(ScrollTrigger);

const bentoSpans = ["sm:col-span-7", "sm:col-span-5", "sm:col-span-5", "sm:col-span-7"];

export function MotionHero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from(".motion-line", {
        y: 48,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
      gsap.from(".motion-accent", {
        scaleX: 0,
        duration: 1,
        ease: "power2.inOut",
        delay: 0.3,
        transformOrigin: "left center",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative overflow-hidden border-b border-border py-20 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top, var(--hero-glow), transparent 55%)`,
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="motion-line text-xs uppercase tracking-[0.3em] text-accent">
          {profile.title}
        </p>
        <div className="motion-accent mt-4 h-px w-24 bg-gradient-to-r from-accent to-transparent" />
        <h1 className="motion-line mt-8 text-5xl font-semibold tracking-tight text-foreground sm:text-7xl">
          {profile.shortName}
        </h1>
        <p className="motion-line mt-4 max-w-xl text-lg text-muted-foreground">
          {profile.location}
        </p>
        <p className="motion-line mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {profile.summary}
        </p>
        <div className="motion-line mt-10 flex flex-wrap gap-4">
          <a
            href="#projects"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-[#0a0a0a] hover:opacity-90 dark:text-[#050505]"
          >
            Explore work
          </a>
          <ContactEmail />
        </div>
      </div>
    </section>
  );
}

export function MotionFeaturedBento() {
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".motion-card").forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
          y: 40,
          opacity: 0,
          duration: 0.6,
          delay: i * 0.05,
          ease: "power2.out",
        });
      });
    }, grid);
    return () => ctx.revert();
  }, []);

  return (
    <section id="projects" ref={grid} className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted">
          {featuredWorkIntro.heading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {featuredWorkIntro.subheading}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-12">
          {featuredWork.map((p, i) => (
            <FeaturedWorkCard
              key={p.id}
              project={p}
              className={`motion-card ${bentoSpans[i] ?? "sm:col-span-6"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** @deprecated Use MotionFeaturedBento */
export const MotionProjectCards = MotionFeaturedBento;
