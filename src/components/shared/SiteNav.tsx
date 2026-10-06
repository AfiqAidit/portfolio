import Link from "next/link";
import { profile } from "@/content/profile";
import { ThemeToggle } from "./ThemeToggle";
import { LayoutStyleSwitcher } from "./LayoutStyleSwitcher";

const navLinks = [
  { href: "#projects", label: "Work" },
  { href: "#work", label: "Experience" },
  { href: "/resume", label: "Resume" },
];

export function SiteNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "var(--nav)" }}
    >
      <LayoutStyleSwitcher />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex flex-col">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">
            Portfolio
          </span>
          <span className="font-medium text-foreground group-hover:text-accent">
            {profile.shortName}
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {navLinks.map((link) =>
            link.href.startsWith("#") ? (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground"
              >
                {link.label}
              </Link>
            ),
          )}
          <ThemeToggle />
        </nav>
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
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:px-6">
        <p className="text-xs uppercase tracking-widest text-muted">Contact</p>
        <ContactEmail />
        <p className="mt-6 text-xs text-muted">
          © {new Date().getFullYear()} {profile.shortName}. Built with Next.js.
        </p>
      </div>
    </footer>
  );
}

/** @deprecated Use SiteNav on the main site; kept for archived layout previews */
export { SiteNav as StyleNav };
