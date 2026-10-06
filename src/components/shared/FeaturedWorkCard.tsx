import Image from "next/image";
import type { FeaturedWork } from "@/content/featured-work";

type Props = {
  project: FeaturedWork;
  className?: string;
};

export function FeaturedWorkCard({ project, className = "" }: Props) {
  const hasImage = Boolean(project.image);

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${project.accent} ${className}`}
    >
      <div className="relative aspect-[16/10] w-full border-b border-border bg-background/30">
        {hasImage && project.image ? (
          <Image
            src={`/projects/${project.image}`}
            alt={project.imageAlt ?? project.title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="text-xs uppercase tracking-widest text-muted">Screenshot soon</span>
            <span className="text-sm font-medium text-muted-foreground">{project.title}</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <p className="text-xs uppercase tracking-wider text-muted">{project.company}</p>
        <h3 className="mt-2 text-xl font-medium text-foreground">{project.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{project.blurb}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        {project.demoHref ? (
          <a
            href={project.demoHref}
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Explore demo →
          </a>
        ) : (
          <p className="mt-4 text-xs text-muted">Interactive demo coming soon</p>
        )}
      </div>
    </article>
  );
}
