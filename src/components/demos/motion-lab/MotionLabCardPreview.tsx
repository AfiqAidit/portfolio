import Link from "next/link";

export function MotionLabCardPreview() {
  return (
    <Link
      href="/demos/motion-lab"
      className="group/preview relative block aspect-[16/10] w-full overflow-hidden border-b border-border"
    >
      <div
        className="absolute inset-0 bg-[#0f2918]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to top, rgb(5 16 8), rgb(22 58 28)), radial-gradient(circle at 50% 20%, rgb(200 230 160 / 0.35), transparent 55%)",
        }}
      />
      <div className="absolute inset-0 flex items-end justify-center gap-0.5 pb-6" aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-[#1e4d22] to-[#9edc55]"
            style={{ height: `${22 + (i % 6) * 5}px`, opacity: 0.75 + (i % 3) * 0.08 }}
          />
        ))}
      </div>
      <p className="absolute top-4 left-4 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-white/75 uppercase backdrop-blur-sm">
        Grass field
      </p>
      <span className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
        Open motion lab
      </span>
    </Link>
  );
}
