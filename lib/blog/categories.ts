import type { BlogCategoryId } from './types';

export const BLOG_CATEGORIES: { id: BlogCategoryId; label: string; description: string }[] = [
  {
    id: 'freelance-reps',
    label: 'For freelance reps',
    description: 'Build skills, standards, and relationships with instructing firms.',
  },
  {
    id: 'law-firms',
    label: 'For law firms',
    description: 'Briefing, cover, risk reduction, and working with outsourced reps.',
  },
  {
    id: 'best-practice',
    label: 'Best practice',
    description: 'Processes, documentation, and communication that hold up under pressure.',
  },
  {
    id: 'attendance',
    label: 'Police station attendance',
    description: 'Checklists, handovers, and what happens on the ground.',
  },
];

export function categoryLabel(id: BlogCategoryId): string {
  return BLOG_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
