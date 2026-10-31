"use client";

import { useState } from "react";
import { Moon, Sparkle, Sun } from "lucide-react";

type Props = {
  night: boolean;
  onToggle: () => void;
};

export function MotionLabDayNightToggle({ night, onToggle }: Props) {
  const [touched, setTouched] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label={night ? "Switch to day" : "Switch to night"}
      onClick={() => {
        setTouched(true);
        onToggle();
      }}
      data-night={night}
      data-touched={touched}
      className="motion-lab-glass ml-dn pointer-events-auto relative block h-9 w-[104px] overflow-hidden rounded-full"
    >
      <span className="ml-dn-glow" aria-hidden />
      <span className="ml-dn-shine" aria-hidden />
      <span className="ml-dn-label ml-dn-label-day" aria-hidden>
        Day
      </span>
      <span className="ml-dn-label ml-dn-label-night" aria-hidden>
        Night
      </span>
      <span className="ml-dn-knob" aria-hidden>
        <span className="ml-dn-orb ml-dn-orb-day" />
        <span className="ml-dn-orb ml-dn-orb-night" />
        <Sun className="ml-dn-icon ml-dn-sun" strokeWidth={2.2} />
        <span className="ml-dn-icon ml-dn-moon">
          <Moon className="h-3.5 w-3.5" strokeWidth={2.2} fill="currentColor" />
          <Sparkle className="ml-dn-sparkle" strokeWidth={0} fill="currentColor" />
        </span>
      </span>
    </button>
  );
}
