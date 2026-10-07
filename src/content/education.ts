export type EducationEntry = {
  school: string;
  degree: string;
  period: string;
  result: { label: string; value: string };
  bullets: string[];
  /** Defaults to true; secondary school stays on the website only. */
  showOnResume?: boolean;
};

export const education: EducationEntry[] = [
  {
    school: "Universiti Kebangsaan Malaysia (UKM)",
    degree: "Bachelor of Computer Science (Hons)",
    period: "2020 - 2024",
    result: { label: "CGPA", value: "3.86" },
    bullets: [
      "Dean's List Award for 6 semesters",
      "Runner-up, Mobile Application Design Competition Based on AR (SIG)",
    ],
  },
  {
    school: "Universiti Teknologi MARA (UiTM) Dengkil",
    degree: "Foundation in Engineering",
    period: "2019 - 2020",
    result: { label: "CGPA", value: "4.00" },
    bullets: [],
  },
  {
    school: "SMK Jalan Tiga, Bandar Baru Bangi",
    degree: "Sijil Pelajaran Malaysia (SPM)",
    period: "2014 - 2018",
    result: { label: "SPM", value: "8A 2B" },
    bullets: [],
    showOnResume: false,
  },
];

export const universityProjects = [
  {
    name: "Collabraille",
    description: "Accessibility and collaboration project.",
  },
  {
    name: "Blockly Challenge 2020",
    description: "Programming club competition entry using visual blocks.",
  },
  {
    name: "AR Software Development Competition",
    description: "Runner-up in a mobile application design competition based on augmented reality.",
  },
  {
    name: "Programming With Blockly 2021",
    description: "SIG programming activity and competition participation.",
  },
];
