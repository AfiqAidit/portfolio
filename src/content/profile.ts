export const profile = {
  name: "Muhammad Afiq Aidit Bin Mohd Ariff",
  shortName: "Afiq Aidit",
  title: "Software Engineer",
  location: "Hulu Langat, Selangor",
  email: "afiqariff9314@gmail.com",
  phone: "+6017-2199185",
  linkedIn: "https://www.linkedin.com/in/afiq-aidit",
  tagline:
    "I build backend and web systems for healthcare, land administration, and banking.",
  about: [
    "Software engineer with hands-on Java and Spring Boot experience, from a Java/SQL internship to building and maintaining the Spring Boot backends behind the Selangkah mobile app. I also build web systems with Laravel, Next.js, and NestJS, and previously built GIS applications end to end at Puncak Tegap.",
    "I work in short Agile cycles of one to two weeks across requirements, development, and testing, and I enjoy owning a system end to end — from gathering requirements with users to deploying it to production.",
  ],
  summary:
    "Software engineer with hands-on Java and Spring Boot experience, from a Java/SQL internship to building and maintaining the Spring Boot backends behind the Selangkah mobile app. Also builds web systems with Laravel, Next.js, and NestJS, and previously built GIS applications end to end at Puncak Tegap with JavaScript, C#, and PostgreSQL.",
} as const;

export const styleVariants = [
  {
    slug: "classic",
    label: "Classic",
    tagline: "Timeline-first · high contrast · Oimachi-inspired",
    href: "/style/classic",
  },
  {
    slug: "bento",
    label: "Bento",
    tagline: "Card grid · product-style highlights",
    href: "/style/bento",
  },
  {
    slug: "motion",
    label: "Motion",
    tagline: "GSAP hero · scroll reveals · stronger energy",
    href: "/",
  },
] as const;
