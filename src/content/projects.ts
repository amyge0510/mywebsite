// Shown on the computer at Amy's desk. Placeholder entries — replace with yours.

export type Project = {
  title: string;
  blurb: string;
  url?: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    title: "This website",
    blurb: "A cozy first-person pixel bookstore you can walk around in.",
    tags: ["3D", "web"],
  },
  {
    title: "Project Two",
    blurb: "One or two sentences about what it is and why you made it.",
    tags: ["tag"],
  },
  {
    title: "Project Three",
    blurb: "One or two sentences about what it is and why you made it.",
    tags: ["tag"],
  },
];
