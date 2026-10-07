import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SideProject, SideProjectStatus } from "@/content/side-projects";
import { Spotlight } from "./Spotlight";

const statusLabel: Record<SideProjectStatus, string> = {
  planned: "Planned",
  "in-progress": "In progress",
  live: "Live",
};

type Props = {
  project: SideProject;
  className?: string;
  preview?: ReactNode;
};

export function SideProjectCard({ project, className = "", preview }: Props) {
  return (
    <Spotlight
      as="article"
      className={`overflow-hidden rounded-2xl border border-border bg-card bg-gradient-to-br ${project.accent} ${className}`}
    >
      {preview ? (
        preview
      ) : project.image ? (
        <div className="relative aspect-[16/10] w-full border-b border-border bg-background/30">
          <Image
            src={`/projects/${project.image}`}
            alt={project.imageAlt ?? project.title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      ) : null}
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted">Inspired by {project.inspiredBy}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${project.status === "live" ? "bg-emerald-500" : "bg-amber-500"}`}
              aria-hidden
            />
            {statusLabel[project.status]}
          </span>
        </div>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        <ul className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {project.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        {project.href ? (
          <Link
            href={project.href}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            Open project
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </Spotlight>
  );
}
