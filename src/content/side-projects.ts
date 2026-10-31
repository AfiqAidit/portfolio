export type SideProjectStatus = "planned" | "in-progress" | "live";

export type SideProject = {
  id: string;
  title: string;
  /** Employer or source this project recreates */
  inspiredBy: string;
  description: string;
  features: string[];
  stack: string[];
  status: SideProjectStatus;
  accent: string;
  /** Route or URL once the project is live */
  href?: string;
  /** File in /public/projects/ */
  image?: string;
  imageAlt?: string;
};

export const sideProjectsIntro = {
  heading: "Side projects",
  subheading:
    "Small, self-built versions of the systems I worked on at each company, plus a hanging pass you can pull and flip on this site.",
};

export const sideProjects: SideProject[] = [
  {
    id: "gis-map",
    title: "Interactive GIS map",
    inspiredBy: "Puncak Tegap",
    description:
      "A standalone web map showing the kind of mapping features I built for land administration.",
    features: [
      "Daerah and mukim boundaries with area details",
      "10 open data layers: places, roads, rail, rivers, parks",
      "Switch between street, satellite, and terrain base maps",
      "Measure distance and area on the map",
      "Search places, businesses, and map features",
      "Drop pins to read coordinates, or locate me",
    ],
    stack: ["C#", "JavaScript", "Leaflet", "CSS", "PostgreSQL"],
    status: "live",
    href: "/demos/gis-map",
    accent: "from-emerald-500/20 to-teal-500/5",
  },
  {
    id: "clinic-queue",
    title: "Clinic booking and live queue",
    inspiredBy: "Selangkah Ventures",
    description:
      "A simplified clinic booking and live queue system with fictional data, showing the kind of patient and staff flows I build.",
    features: [
      "Book a 15-minute slot at a fictional GP clinic",
      "Patient, staff, and doctor views with clear roles",
      "Staff check-in and walk-ins; doctor calls next and TV board",
      "Queue position and estimated wait on your ticket",
      "Syncs across browser tabs on your device",
      "Sample day and auto-play for a quick tour",
    ],
    stack: ["Laravel", "PHP", "Voyager", "CSS", "Cron", "MySQL"],
    status: "live",
    href: "/demos/clinic-queue",
    accent: "from-sky-500/20 to-blue-500/5",
  },
  {
    id: "motion-lab",
    title: "Motion lab",
    inspiredBy: "interactive nature scenes",
    description:
      "A green WebGL meadow: grass bends and parts under your cursor, then springs back, with soft pollen in the air.",
    features: [
      "Thousands of green grass blades with wind sway",
      "Cursor gust bends the tips; roots stay planted",
      "Looping wind track, on when the page opens",
      "Quality scaling and reduced-motion fallback",
    ],
    stack: ["TypeScript", "Three.js", "WebGL", "React Three Fiber"],
    status: "live",
    href: "/demos/motion-lab",
    accent: "from-emerald-500/25 to-lime-500/5",
  },
  {
    id: "pass",
    title: "Hanging pass",
    inspiredBy: "a studio pass",
    description:
      "A full-page version of the badge on the home page. Pull the strap, let it bounce, and flip it to see the back.",
    features: [
      "Nylon webbing strap with a metal clip",
      "Click to flip, drag to stretch and swing",
      "Elastic bounce when you let go",
      "CSS 3D thickness, tilt, and floor shadow",
      "Cursor sand and a click wave on the studio page",
    ],
    stack: ["TypeScript", "CSS", "SVG"],
    status: "live",
    href: "/demos/pass",
    accent: "from-neutral-500/20 to-stone-500/5",
  },
];
