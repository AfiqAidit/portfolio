const taglineLead = "I build backend and web systems for";
const taglineTopics = ["healthcare", "land administration", "banking"];

export const profile = {
  name: "Muhammad Afiq Aidit Bin Mohd Ariff",
  shortName: "Afiq Aidit",
  title: "Software Engineer",
  location: "Hulu Langat, Selangor",
  coordinates: "3.1° N, 101.8° E",
  email: "afiqariff9314@gmail.com",
  phone: "+6017-2199185",
  linkedIn: "https://www.linkedin.com/in/afiq-aidit",
  taglineLead,
  /** Rotates in the hero after taglineLead */
  taglineTopics,
  tagline: `${taglineLead} ${taglineTopics.slice(0, -1).join(", ")}, and ${taglineTopics[taglineTopics.length - 1]}.`,
  stats: [
    { value: "Since 2023", label: "Building software professionally" },
    { value: "4", label: "Companies" },
    { value: "3.86", label: "CGPA, UKM Computer Science" },
  ],
  about: [
    "Software engineer with hands-on Java and Spring Boot experience, from a Java/SQL internship to building and maintaining the Spring Boot backends behind the Selangkah mobile app. I also build web systems with Laravel, Next.js, and NestJS, and previously built GIS applications end to end at Puncak Tegap.",
    "I work in short Agile cycles of one to two weeks across requirements, development, and testing. I enjoy owning a system end to end, from gathering requirements with users to deploying it to production.",
  ],
  summary:
    "Software engineer with hands-on Java and Spring Boot experience, from a Java/SQL internship to building and maintaining the Spring Boot backends behind the Selangkah mobile app. Also builds web systems with Laravel, Next.js, and NestJS, and previously built GIS applications end to end at Puncak Tegap with JavaScript, C#, and PostgreSQL.",
} as const;

export const styleVariants = [
  {
    slug: "classic",
    label: "Classic",
    tagline: "Timeline-first, high contrast",
    href: "/style/classic",
  },
  {
    slug: "bento",
    label: "Bento",
    tagline: "Card grid, product-style highlights",
    href: "/style/bento",
  },
  {
    slug: "motion",
    label: "Motion",
    tagline: "Animated hero, scroll reveals",
    href: "/",
  },
] as const;
