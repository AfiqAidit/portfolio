export type SideProjectStatus = "planned" | "in-progress" | "live";

export type SideProject = {
  id: string;
  title: string;
  /** Previous employer whose work this project recreates */
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
    "Small, self-built versions of the systems I worked on at each company, made with open data so you can try them yourself.",
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
    stack: ["Leaflet", "GeoJSON", "OpenStreetMap", "Next.js"],
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
    stack: ["Next.js", "TypeScript", "React", "BroadcastChannel"],
    status: "live",
    href: "/demos/clinic-queue",
    accent: "from-sky-500/20 to-blue-500/5",
  },
];
