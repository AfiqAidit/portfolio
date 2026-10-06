export type FeaturedWork = {
  id: string;
  title: string;
  company: string;
  blurb: string;
  tags: string[];
  accent: string;
  /** File in /public/projects/ e.g. "selangkah-plus.png" — omit until you add the file */
  image?: string;
  imageAlt?: string;
  /** Future: link to /demos/... or external URL */
  demoHref?: string | null;
};

/** Homepage highlights — deeper story lives in Experience + future demos */
export const featuredWork: FeaturedWork[] = [
  {
    id: "selangkah-plus",
    title: "Selangkah Plus",
    company: "Selangkah Ventures",
    blurb:
      "Spring Boot backend for the revamped Selangkah mobile app — dependents, auth, clinic booking integrations, Swagger-documented APIs.",
    tags: ["Java 21", "Spring Boot", "MySQL"],
    accent: "from-sky-500/20 to-blue-500/5",
    image: undefined,
    imageAlt: "Selangkah Plus backend and mobile integration",
    demoHref: null,
  },
  {
    id: "scms",
    title: "SCMS",
    company: "Selangkah Ventures",
    blurb:
      "Selcare Clinic Management System (Laravel) — stabilized after go-live, digital prescriptions, MSC Trustgate signing, Selangkah integration.",
    tags: ["Laravel", "Voyager", "SOAP"],
    accent: "from-indigo-500/20 to-blue-500/5",
    demoHref: null,
  },
  {
    id: "sdms",
    title: "SDMS",
    company: "Selangkah Ventures",
    blurb:
      "Selcare Dental Management System built end to end — appointments, charting, billing, inventory, staff guides, document delivery to Selangkah.",
    tags: ["Laravel", "Voyager", "Integrations"],
    accent: "from-violet-500/20 to-purple-500/5",
    demoHref: null,
  },
  {
    id: "gis",
    title: "GIS",
    company: "Puncak Tegap",
    blurb:
      "Land-administration GIS — Leaflet & OpenLayers, GeoServer, PostgreSQL; eTanah (Putrajaya & Labuan) and standalone mapping module.",
    tags: ["Leaflet", "OpenLayers", "GeoServer"],
    accent: "from-emerald-500/20 to-teal-500/5",
    demoHref: null,
  },
];

export const featuredWorkIntro = {
  heading: "Selected work",
  subheading:
    "Flagship systems I have shipped. Screenshots and interactive demos will be added here — for now, read the summary or see Experience for full detail.",
};
