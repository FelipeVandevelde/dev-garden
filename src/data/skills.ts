export type SkillNode = {
  id: string;
  label: string;
  domain: 'Frontend' | 'Backend' | 'Architecture' | 'DevOps';
  x: number;
  y: number;
};

export type SkillLink = {
  source: string;
  target: string;
};

export const nodes: SkillNode[] = [
  { id: 'react', label: 'React / Preact', domain: 'Frontend', x: 20, y: 30 },
  { id: 'astro', label: 'Astro', domain: 'Frontend', x: 40, y: 20 },
  { id: 'node', label: 'Node.js', domain: 'Backend', x: 60, y: 50 },
  { id: 'ts', label: 'TypeScript', domain: 'Architecture', x: 50, y: 35 },
  { id: 'docker', label: 'Docker', domain: 'DevOps', x: 80, y: 60 },
  { id: 'aws', label: 'AWS', domain: 'DevOps', x: 75, y: 80 },
];

export const links: SkillLink[] = [
  { source: 'react', target: 'ts' },
  { source: 'astro', target: 'react' },
  { source: 'ts', target: 'node' },
  { source: 'node', target: 'docker' },
  { source: 'docker', target: 'aws' },
];