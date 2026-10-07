"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { BASE_MAPS, type BaseMapId } from "./config";

type Props = {
  value: BaseMapId;
  onChange: (id: BaseMapId) => void;
};

export function BaseMapDropdown({ value, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const current = BASE_MAPS.find((b) => b.id === value) ?? BASE_MAPS[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        id="gis-basemap"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Base map: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2 text-left text-sm text-foreground transition ${
          open ? "border-accent/60" : "border-border hover:border-accent/40"
        }`}
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby="gis-basemap"
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {BASE_MAPS.map((b) => {
            const selected = b.id === value;
            return (
              <li key={b.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(b.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-band ${
                    selected ? "text-accent" : "text-foreground"
                  }`}
                >
                  {b.label}
                  {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
