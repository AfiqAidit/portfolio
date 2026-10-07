"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./clinic-queue.css";
import { motion, useReducedMotion } from "framer-motion";

const FAKE = ["A014", "A015", "W003", "A016"];

export function ClinicQueueCardPreview() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % FAKE.length), 2200);
    return () => clearInterval(id);
  }, [reduced]);

  const num = FAKE[reduced ? 0 : i];

  return (
    <Link
      href="/demos/clinic-queue"
      className="group/preview relative block aspect-[16/10] w-full overflow-hidden border-b border-border bg-background/30"
    >
      <div className="clinic-demo-root flex h-full flex-col justify-center bg-gradient-to-br from-sky-500/10 to-cyan-500/5 p-6">
        <p className="text-xs font-medium text-muted-foreground">Waiting room</p>
        <p className="mt-1 text-sm text-foreground">Now serving</p>
        <motion.p
          key={num}
          initial={reduced ? false : { opacity: 0.5, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-4xl font-bold tabular-nums text-foreground"
        >
          {num}
        </motion.p>
        <p className="mt-2 text-xs text-muted-foreground">Room 1 · Dr Afiq</p>
      </div>
      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
        Open full demo
      </span>
    </Link>
  );
}
