import Image from "next/image";
import Link from "next/link";
import preview from "../../../../public/demos/motion-lab/preview.jpg";

export function MotionLabCardPreview() {
  return (
    <Link
      href="/demos/motion-lab"
      className="group/preview relative block aspect-[16/10] w-full overflow-hidden border-b border-border bg-[#0f2918]"
    >
      <Image
        src={preview}
        placeholder="blur"
        alt="WebGL grass field at golden hour with a kampung stilt house, chicken coop, and pond"
        fill
        sizes="(min-width: 1024px) 640px, 100vw"
        className="object-cover transition-transform duration-500 group-hover/preview:scale-[1.03]"
      />
      <p className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-white/90 uppercase backdrop-blur-sm">
        Grass field
      </p>
      <span className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
        Open motion lab
      </span>
    </Link>
  );
}
