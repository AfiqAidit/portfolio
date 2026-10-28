import Link from "next/link";
import { profile } from "@/content/profile";

export function PassCardPreview() {
  return (
    <Link
      href="/demos/pass"
      className="group/preview relative block aspect-[16/10] w-full overflow-hidden border-b border-border bg-background/40"
    >
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
      />
      <div className="absolute inset-0 flex items-center justify-center [perspective:700px]">
        <div className="relative w-[7.2rem] [transform:rotateY(-22deg)_rotateX(10deg)_rotateZ(8deg)] [transform-style:preserve-3d] transition duration-500 group-hover/preview:[transform:rotateY(-8deg)_rotateX(4deg)_rotateZ(3deg)]">
          <span
            aria-hidden
            className="absolute top-[-2.6rem] left-1/2 h-11 w-5 -translate-x-1/2 rounded-sm bg-[#2c3138] shadow-sm"
          />
          <div className="overflow-hidden rounded-2xl border border-black/15 bg-[#f6f5f2] shadow-[0_22px_40px_-18px_rgb(0_0_0/0.55)]">
            <div className="mx-3 mt-3 aspect-[5/4] overflow-hidden rounded-xl bg-[#e4dfd6]">
              {profile.cardPhoto ? (
                <img
                  src={profile.cardPhoto}
                  alt=""
                  className="h-full w-full object-cover object-[center_42%]"
                />
              ) : (
                <div className="h-full w-full bg-[#d8d2c8]" />
              )}
            </div>
            <div className="px-3 pt-2 pb-3">
              <p className="text-[11px] leading-none font-semibold text-neutral-900">{profile.shortName}</p>
              <p className="mt-1 text-[9px] text-neutral-500">{profile.title}</p>
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/55 to-transparent opacity-0 transition group-hover/preview:opacity-100"
        aria-hidden
      />
      <span className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
        Open pass
      </span>
    </Link>
  );
}
