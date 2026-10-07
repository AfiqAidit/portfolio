export const skillGroups = [
  {
    label: "Languages",
    items: ["Java", "SQL", "TypeScript", "JavaScript", "C#", "PHP", "HTML", "CSS", "Python"],
  },
  {
    label: "Backend",
    items: [
      "Spring Boot",
      "Spring Data JPA",
      "REST APIs",
      "SOAP",
      "Swagger",
      "NestJS",
      "TypeORM",
      "Laravel",
    ],
  },
  {
    label: "Frontend",
    items: ["Next.js", "React", "Laravel Voyager", "OpenLayers", "Leaflet"],
  },
  {
    label: "Databases",
    items: ["MySQL", "PostgreSQL"],
  },
  {
    label: "Tools",
    items: [
      "Maven",
      "Git",
      "GitLab",
      "Redmine",
      "BytePlus",
      "Eclipse",
      "NetBeans",
      "DBeaver",
      "Figma",
      "GeoServer",
      "Jaspersoft Studio",
    ],
  },
];

/**
 * Extra words that count as using a skill when matching it against
 * `experience.ts` (for the "where I used it" hover in Skills).
 */
export const skillAliases: Record<string, string[]> = {
  PHP: ["Laravel"],
  React: ["Next.js"],
  "REST APIs": ["REST"],
  "Laravel Voyager": ["Voyager"],
  "Jaspersoft Studio": ["Jaspersoft"],
};
