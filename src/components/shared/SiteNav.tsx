import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LinkedInIcon } from "./BrandIcons";
import { profile } from "@/content/profile";
import { ThemeToggle } from "./ThemeToggle";
import { LayoutStyleSwitcher } from "./LayoutStyleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { GlowBackdrop } from "./GlowBackdrop";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#know-me", label: "Know me" },
  { href: "#contact", label: "Contact" },
  { href: "/resume", label: "Resume" },
];

/** `showLayoutSwitcher` is only for the archived `/style/*` comparison pages. */
export function SiteNav({ showLayoutSwitcher = false }: { showLayoutSwitcher?: boolean }) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "var(--nav)" }}
    >
      {showLayoutSwitcher ? <LayoutStyleSwitcher /> : null}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
          {profile.shortName}
        </Link>
        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <MobileMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}

export function ContactEmail() {
  return (
    <a
      href={`mailto:${profile.email}`}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      {profile.email}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact" className="group relative scroll-mt-28 overflow-hidden border-t border-border">
      <GlowBackdrop placement="bottom" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="font-mono text-xs text-accent">07</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Get in touch
        </h2>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Email is the fastest way to reach me. You can also find me on LinkedIn.
        </p>
        <a
          href={`mailto:${profile.email}`}
          className="group/email mt-8 inline-flex items-center gap-2 break-all text-xl font-medium text-foreground transition-colors hover:text-accent sm:text-3xl"
        >
          {profile.email}
          <ArrowUpRight
            className="h-6 w-6 shrink-0 transition-transform group-hover/email:-translate-y-0.5 group-hover/email:translate-x-0.5"
            aria-hidden
          />
        </a>
        <div className="mt-6">
          <a
            href={profile.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/50 hover:text-accent"
          >
            <LinkedInIcon className="h-4 w-4" />
            LinkedIn
          </a>
        </div>
      </div>
      <div className="relative border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-xs text-muted sm:px-6">
          <p>
            © {new Date().getFullYear()} {profile.shortName}
          </p>
          <p>Built with Next.js</p>
        </div>
      </div>
    </footer>
  );
}
