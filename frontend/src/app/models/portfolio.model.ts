export type ContentTag =
  | 'div'
  | 'section'
  | 'p'
  | 'h5'
  | 'h6'
  | 'ul'
  | 'ol'
  | 'li'
  | 'span'
  | 'strong'
  | 'em'
  | 'code'
  | 'br';

/** Structured, safe content: headings, paragraphs, lists and workflow steps, never HTML strings. */
export interface ContentBlock {
  text?: string;
  tag?: ContentTag;
  className?: string;
  id?: string;
  role?: string;
  label?: string;
  labelledBy?: string;
  hidden?: string;
  children?: ContentBlock[];
}

export interface ContentLink {
  label: string;
  url: string;
  external?: boolean;
  download?: string;
  id?: string;
  icon?: 'email' | 'linkedin' | 'github' | 'medium';
}

export interface Profile {
  name: string;
  headline: string;
  tagline: ContentBlock[];
  summary: string;
  location: string;
  email: string;
  roleFocus: string[];
  focus: ContentBlock[];
  links: ContentLink[];
  portrait: { src: string; webp: string; alt: string; width: number; height: number };
  resume: string;
  seoDescription: string;
  impact: { value: string; label: string; suffix?: string }[];
}

export interface SkillGroup {
  id: string;
  label: string;
  description: string;
}
export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: ContentBlock[];
  technologies: string[];
  relatedProjectIds?: string[];
}
export interface ProjectGroup {
  id: string;
  label: string;
  description: string;
}
export interface Project {
  id: string;
  slug: string;
  groupId: string;
  titleId: string;
  title: string;
  eyebrow: string;
  kind: string;
  statusDot: boolean;
  summary: string;
  technologies: string[];
  links: ContentLink[];
  detailClass: string;
  details: ContentBlock[];
  stack?: string;
  subtitle?: string;
}
export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  graduationYear: number;
  grade: number;
  gradeScale: number;
}
export interface SectionHeading {
  number: string;
  eyebrow: string;
  title: ContentBlock[];
  description: ContentBlock[];
}
export interface Portfolio {
  schemaVersion: number;
  profile: Profile;
  skills: SkillGroup[];
  experience: Experience[];
  projectGroups: ProjectGroup[];
  projects: Project[];
  education: Education[];
  additionalInformation: {
    eyebrow: string;
    title: ContentBlock[];
    description: ContentBlock[];
    links: ContentLink[];
  };
  presentation: {
    navigation: { id: string; label: string }[];
    portraitLabel: string;
    focusLabel: string;
    coordinate: string;
    companiesLabel: string;
    experience: SectionHeading;
    projects: SectionHeading;
    beyond: SectionHeading;
    contact: { eyebrow: string; title: ContentBlock[] };
    footer: string;
  };
}
