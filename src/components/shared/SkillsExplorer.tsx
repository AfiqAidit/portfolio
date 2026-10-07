"use client";

import { useState } from "react";
import { experience } from "@/content/experience";
import { skillAliases, skillGroups } from "@/content/skills";
import { Reveal } from "./Reveal";
import { Spotlight } from "./Spotlight";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Companies whose stack or resume highlights mention the skill (or an alias) as a whole word. */
function companiesUsing(skill: string) {
  const terms = [skill, ...(skillAliases[skill] ?? [])];
  const word = new RegExp(`(?<![\\w])(${terms.map(escapeRegExp).join("|")})(?![\\w])`, "i");
  return experience
    .filter(
      (job) =>
        [...job.stack, ...(job.alsoUsed ?? [])].some((s) => word.test(s)) ||
        job.highlights.some((h) => word.test(h.text)),
    )
    .map((job) => job.company.replace(/\s+Sdn Bhd$/, ""));
}

const usage = new Map(
  skillGroups.flatMap((g) => g.items).map((item) => [item, companiesUsing(item)]),
);

export function SkillsExplorer() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <p className="mt-6 text-sm text-muted-foreground">
        Hover or tap a skill to see where I used it.
      </p>
      <div
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
      >
        {skillGroups.map((g, i) => {
          const activeHere = active !== null && g.items.includes(active) ? active : null;
          const companies = activeHere ? (usage.get(activeHere) ?? []) : [];
          return (
            <Reveal key={g.label} delay={(i % 3) * 0.06} className="h-full">
              <Spotlight className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground">{g.label}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {g.items.map((item) => {
                    const isActive = active === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={isActive}
                        onPointerEnter={(e) => e.pointerType === "mouse" && setActive(item)}
                        onFocus={() => setActive(item)}
                        onClick={() => setActive(item)}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          isActive
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                <p aria-live="polite" className="mt-auto pt-4 text-xs text-muted-foreground">
                  {activeHere ? (
                    companies.length > 0 ? (
                      <>
                        <span className="font-medium text-accent">{activeHere}</span>
                        {" used at "}
                        <span className="text-foreground">{companies.join(", ")}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-accent">{activeHere}</span>
                        {" is not tied to one specific role"}
                      </>
                    )
                  ) : (
                    <span aria-hidden>&nbsp;</span>
                  )}
                </p>
              </Spotlight>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
