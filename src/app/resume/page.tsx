import Link from "next/link";
import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { skillGroups } from "@/content/skills";
import { LayoutStyleSwitcher } from "@/components/shared/LayoutStyleSwitcher";

export default function ResumePage() {
  return (
    <div className="min-h-full bg-[#f3f2ef] text-[#1a1a1a] print:bg-white">
      <div className="sticky top-0 z-50 border-b border-border bg-background print:hidden">
        <LayoutStyleSwitcher />
      </div>
      <div className="border-b border-[#ead7a0] bg-[#fff8e6] px-4 py-2 text-center text-sm text-[#333] print:hidden">
        HTML resume preview. PDF download coming later.{" "}
        <Link href="/" className="underline">
          Back to layouts
        </Link>
      </div>
      <article className="mx-auto my-6 max-w-[820px] bg-white px-10 py-10 shadow-sm print:my-0 print:shadow-none sm:px-12">
        <header className="border-b border-[#222] pb-4 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">{profile.name}</h1>
          <p className="mt-1 text-base font-bold">{profile.title}</p>
          <p className="mt-2 text-sm text-[#444]">
            {profile.email} | {profile.phone} | {profile.location} |{" "}
            <a href={profile.linkedIn} className="text-[#444] underline">
              linkedin.com/in/afiq-aidit
            </a>
          </p>
        </header>

        <section className="mt-5">
          <h2 className="border-b border-[#222] pb-1 text-xs font-bold uppercase tracking-wider">
            Summary
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{profile.summary}</p>
        </section>

        <section className="mt-5">
          <h2 className="border-b border-[#222] pb-1 text-xs font-bold uppercase tracking-wider">
            Experience
          </h2>
          {experience.map((job) => (
            <div key={job.company} className="mt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-bold">{job.title}</p>
                <p className="text-sm">{job.period}</p>
              </div>
              <p className="text-sm">{job.company}</p>
              {job.note ? (
                <p className="text-xs italic text-[#444]">({job.note})</p>
              ) : null}
              <ul className="mt-2 list-disc pl-5 text-[13.5px] leading-snug">
                {job.highlights.map((h, i) => (
                  <li key={i} className="mb-1">
                    {h.label ? (
                      <>
                        <strong>{h.label}:</strong> {h.text}
                      </>
                    ) : (
                      h.text
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-5">
          <h2 className="border-b border-[#222] pb-1 text-xs font-bold uppercase tracking-wider">
            Education
          </h2>
          {education.map((e) => (
            <div key={e.school} className="mt-3">
              <div className="flex flex-wrap justify-between gap-2 text-sm font-bold">
                <span>
                  {e.degree} | {e.school}
                </span>
                <span className="font-normal text-[#444]">{e.period}</span>
              </div>
              <p className="text-sm">{e.result.label}: {e.result.value}</p>
              {e.bullets.map((b) => (
                <p key={b} className="text-sm">
                  • {b}
                </p>
              ))}
            </div>
          ))}
        </section>

        <section className="mt-5">
          <h2 className="border-b border-[#222] pb-1 text-xs font-bold uppercase tracking-wider">
            Skills
          </h2>
          <div className="mt-2 space-y-1 text-[13.5px]">
            {skillGroups.map((g) => (
              <p key={g.label}>
                <strong>{g.label}:</strong> {g.items.join(", ")}
              </p>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
