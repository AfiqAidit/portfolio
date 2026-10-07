import Image from "next/image";
import Link from "next/link";
import type { SideProject, SideProjectStatus } from "@/content/side-projects";

const statusLabel: Record<SideProjectStatus, string> = {
  planned: "Planned",
  "in-progress": "In progress",
  live: "Live",
};

type Props = {
  project: SideProject;
  className?: string;
};

export function SideProjectCard({ project, className = "" }: Props) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${project.accent} ${className}`}
    >
      {project.image ? (
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
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-muted">
            Inspired by {project.inspiredBy}
          </p>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            {statusLabel[project.status]}
          </span>
        </div>
        <h3 className="mt-2 text-xl font-medium text-foreground">{project.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {project.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        {project.href ? (
          <Link
            href={project.href}
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Open project →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
