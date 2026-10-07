"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/content/profile";
import { sideProjects } from "@/content/side-projects";
import { ContactEmail } from "@/components/shared/SiteNav";
import { SideProjectCard } from "@/components/shared/SideProjectCard";
import { SideProjectsHeader } from "@/components/shared/sections";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MotionHero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

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
        <p className="motion-line mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {profile.tagline}
        </p>
        <div className="motion-line mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#experience"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-[#0a0a0a] hover:opacity-90 dark:text-[#050505]"
          >
            View experience
          </a>
          <ContactEmail />
        </div>
      </div>
    </section>
  );
}

export function MotionSideProjects() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".motion-card").forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: { trigger: card, start: "top 85%" },
          y: 40,
          opacity: 0,
          duration: 0.6,
          delay: i * 0.05,
          ease: "power2.out",
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="projects" ref={root} className="border-t border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SideProjectsHeader />
        <div className={`mt-8 grid gap-4 ${sideProjects.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {sideProjects.map((p) => (
            <SideProjectCard key={p.id} project={p} className="motion-card" />
          ))}
        </div>
      </div>
    </section>
  );
}
