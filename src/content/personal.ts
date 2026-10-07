export type KnowMeIcon =
  | "gamepad"
  | "feather"
  | "map-pin"
  | "languages"
  | "award"
  | "graduation-cap";

export const knowMe = {
  heading: "Know me better",
  intro: "Enough about work and code. Here's a bit about me outside the job.",
  /** Shown as a larger statement above the fact cards */
  thinking:
    "I try to stay open to other solutions and points of view, and I enjoy a good debate over the pros and cons to find out which option is actually better.",
  facts: [
    { icon: "gamepad", label: "Games", value: "Dota 2, Stardew Valley, and Mobile Legends" },
    { icon: "feather", label: "Sports", value: "Badminton" },
    { icon: "map-pin", label: "Based in", value: "Hulu Langat, Selangor" },
    { icon: "languages", label: "Languages", value: "Malay (native) and English (professional)" },
    {
      icon: "award",
      label: "Leadership",
      value:
        "President of the police cadets (2014) and vice president of Pembimbing Rakan Sebaya (2017) in secondary school",
    },
    {
      icon: "graduation-cap",
      label: "At university",
      value:
        "Active member of UKM's Programming Club (SIG). I enjoy working with people face to face.",
    },
  ] satisfies { icon: KnowMeIcon; label: string; value: string }[],
};
