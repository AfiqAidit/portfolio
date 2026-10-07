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
    "Small, self-built versions of the systems I worked on at each company — made with open data, so you can try them yourself.",
};

export const sideProjects: SideProject[] = [
  {
    id: "gis-map",
    title: "Interactive GIS map",
    inspiredBy: "Puncak Tegap",
    description:
      "A standalone web map showing the kind of mapping features I built for land administration.",
    features: [
      "Pan, zoom, and switch base maps",
      "Toggle data layers on and off",
      "Click a feature to see its details",
      "Measure distance and area",
      "Search for a location",
    ],
    stack: ["Leaflet", "GeoJSON", "Next.js"],
    status: "planned",
    accent: "from-emerald-500/20 to-teal-500/5",
  },
];
