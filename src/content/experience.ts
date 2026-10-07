export type ExperienceRole = {
  company: string;
  title: string;
  period: string;
  note?: string;
  /** One-line overview shown on the portfolio */
  summary: string;
  stack: string[];
  /** Detailed bullets shown on /resume */
  highlights: { label?: string; text: string }[];
};

export const experience: ExperienceRole[] = [
  {
    company: "Selangkah Ventures Sdn Bhd",
    title: "Full Stack Developer",
    period: "August 2025 - Present",
    summary:
      "Build and maintain the Spring Boot backends behind the Selangkah mobile app, plus clinic and dental management systems, an insurance platform backend, and a hospital website.",
    stack: ["Java", "Spring Boot", "Laravel", "NestJS", "Next.js", "MySQL"],
    highlights: [
      {
        label: "Selangkah Plus",
        text: "Develop and maintain the revamped Spring Boot backend (Java 21, Spring Data JPA, MySQL) for the Selangkah mobile app, with REST endpoints documented in Swagger. Contributed most of the new database work as part of a team.",
      },
      {
        label: "Selangkah",
        text: "Maintain the original Spring Boot backend with bug fixes and enhancements.",
      },
      {
        label: "Integration",
        text: "Connected SCMS and SDMS to the Selangkah app using IC as the unique identifier, covering clinic documents, EMR records, and appointment booking.",
      },
      {
        label: "SCMS",
        text: "Stabilized the Selcare Clinic Management System (Laravel, Voyager) after go-live with production fixes and enhancements, including digital prescription stickers and MSC Trustgate SOAP signing.",
      },
      {
        label: "SDMS",
        text: "Built the Selcare Dental Management System end to end: requirements, UI/UX, database, deployment, in-dashboard staff guides, Trustgate signing, and document delivery to the Selangkah app.",
      },
      {
        label: "VSURE",
        text: "Built an insurance platform backend in NestJS, TypeScript, TypeORM, and MySQL for plans, claims, and nominees.",
      },
      {
        label: "Selgate website",
        text: "Built a Next.js hospital website with 360° VR views, deployed on BytePlus via Git.",
      },
    ],
  },
  {
    company: "Puncak Tegap Sdn Bhd",
    title: "GIS Developer / Full Stack Developer",
    period: "November 2024 - August 2025",
    summary:
      "Built and maintained GIS web applications for Malaysia's land administration system, from the map frontend to the geospatial database and deployment.",
    stack: ["JavaScript", "Leaflet", "OpenLayers", "C#", "PostgreSQL", "GeoServer"],
    highlights: [
      {
        label: "eTanah",
        text: "Revamped and maintained the GIS web application for Putrajaya and Labuan on both UI and backend.",
      },
      {
        label: "GIS",
        text: "Sole developer of the mapping module: OpenLayers and Leaflet frontend, C# backend, GeoServer, and PostgreSQL, including its first production deployment.",
      },
      {
        text: "Production support from Redmine tickets, UAT, and user training before go-live.",
      },
    ],
  },
  {
    company: "Elcorp Technology Sdn Bhd",
    title: "Back-end Developer",
    period: "February 2024 - May 2024",
    note: "Short-term project contract",
    summary:
      "Built project monitoring software that checks whether a project is on track to finish by its deadline.",
    stack: ["Java", "JDBC", "MySQL"],
    highlights: [
      {
        text: "Built project monitoring and Sakit Detection features in Java, JDBC, and MySQL from Figma wireframes, including a probability graph, the detection algorithm, and license key integration.",
      },
    ],
  },
  {
    company: "Finexus International Sdn Bhd",
    title: "Back-end Developer (Internship)",
    period: "September 2023 - January 2024",
    summary:
      "Worked on a card management system for banks: API enhancements, performance testing, and data encryption.",
    stack: ["Java", "SQL", "Jaspersoft"],
    highlights: [
      {
        label: "CARDWORKS",
        text: "Worked with Java and SQL on the card management system: API enhancements, concurrent performance tests, data encryption, and Jaspersoft stakeholder reports.",
      },
    ],
  },
];
