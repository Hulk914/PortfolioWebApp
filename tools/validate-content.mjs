import { readFile, access } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';

const root = new URL('../', import.meta.url);
const assetRoot = new URL('../frontend/src/assets/', import.meta.url);
const [content, schema] = await Promise.all(
  ['content/portfolio.json', 'content/portfolio.schema.json'].map(async (path) =>
    JSON.parse(await readFile(new URL(path, root), 'utf8')),
  ),
);
const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
if (!validate(content)) {
  throw new Error(
    `Invalid portfolio content:\n${validate.errors.map((error) => `${error.instancePath || '/'}: ${error.message}`).join('\n')}`,
  );
}

function unique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
  return seen;
}

unique(
  [...content.experience, ...content.projects, ...content.skills, ...content.education].map(
    ({ id }) => id,
  ),
  'record ID',
);
unique(
  content.projects.map(({ slug }) => slug),
  'project slug',
);
const groups = unique(
  content.projectGroups.map(({ id }) => id),
  'group ID',
);
const projectIds = new Set(content.projects.map(({ id }) => id));
for (const project of content.projects) {
  if (!groups.has(project.groupId))
    throw new Error(`${project.id}: unknown group ${project.groupId}`);
}
for (const role of content.experience) {
  if (role.endDate !== null && role.endDate < role.startDate)
    throw new Error(`${role.id}: endDate precedes startDate`);
  for (const id of role.relatedProjectIds ?? []) {
    if (!projectIds.has(id)) throw new Error(`${role.id}: unknown related project ${id}`);
  }
}
for (const item of content.education) {
  if (item.grade > item.gradeScale) throw new Error(`${item.id}: grade exceeds gradeScale`);
}

const anchors = [
  'top',
  'main',
  'hero-title',
  'toolkit-title',
  'experience',
  'experience-title',
  'projects',
  'projects-title',
  'beyond',
  'beyond-title',
  'contact-title',
  'current-year',
  'new-tab-hint',
  ...groups,
  ...content.projectGroups.map(({ id }) => `${id}-title`),
  ...content.projects.flatMap(({ id, titleId }) => [id, titleId]),
];
const localAssets = new Set([
  content.profile.resume,
  content.profile.portrait.src,
  content.profile.portrait.webp,
  'assets/favicon.svg',
]);
const labelledBy = [];
function visit(value) {
  if (!value || typeof value !== 'object') return;
  if (value.tag && value.id) anchors.push(value.id);
  if (value.url) {
    if (value.id) anchors.push(value.id);
    if (value.url.startsWith('assets/')) localAssets.add(value.url);
    if (value.download && !value.url.startsWith('assets/'))
      throw new Error('Downloads must use local assets.');
    if (/^https?:/.test(value.url)) new URL(value.url);
  }
  if (value.labelledBy) labelledBy.push(value.labelledBy);
  for (const child of Object.values(value)) visit(child);
}
visit(content);
const anchorSet = unique(anchors, 'DOM anchor');
for (const ids of labelledBy) {
  for (const id of ids.split(/\s+/))
    if (!anchorSet.has(id)) throw new Error(`Unknown aria-labelledby target: ${id}`);
}
for (const { id } of content.presentation.navigation) {
  if (!anchorSet.has(id)) throw new Error(`Unknown navigation target: ${id}`);
}
await Promise.all(
  [...localAssets].map(async (path) => {
    if (!/^assets\/[a-zA-Z0-9._/-]+$/.test(path) || path.split('/').includes('..'))
      throw new Error(`Invalid local asset path: ${path}`);
    try {
      await access(new URL(path.slice('assets/'.length), assetRoot));
    } catch {
      throw new Error(`Missing content asset: ${path}`);
    }
  }),
);
console.log(
  `Content ready: ${content.experience.length} roles, ${content.projects.length} projects, ${content.skills.length} skill groups.`,
);
