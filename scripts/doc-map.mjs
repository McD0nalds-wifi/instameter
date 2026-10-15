import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

/** @typedef {{ path: string; title?: string; summary?: string; keywords?: string[]; codePaths?: string[]; sha?: string }} DocEntry */
/** @typedef {{ version: number; docs: DocEntry[] }} DocMap */

const OUT = 'docs/doc-map.json';
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'dev-dist',
  'public',
  'coverage',
  'test-results',
  'playwright-report',
]);
const SKIP_FILES = new Set(['CLAUDE.md', 'README.md', 'SKILL.md']);

/** @param {string} content */
const computeSha = (content) => createHash('sha256').update(content).digest('hex').slice(0, 8);

/** @param {string} markdown */
const extractTitle = (markdown) => {
  const titleLine = markdown.split('\n').find((line) => line.startsWith('# '));
  return titleLine ? titleLine.slice(2).trim() : '';
};

const CODE_PATH_PATTERN = /\bsrc\/[\w./-]+/g;
const CODE_ROOTS = new Set(['src']);
const MAX_ANCHOR_ZONES = 3;

/** @param {string} value @param {string} chars */
const trimTrailingChars = (value, chars) => {
  let end = value.length;
  while (end > 0 && chars.includes(value[end - 1])) end -= 1;
  return value.slice(0, end);
};

/** @param {string} markdown */
const extractCodePaths = (markdown) => {
  const matches = markdown.match(CODE_PATH_PATTERN) ?? [];
  const globs = new Set();

  for (const raw of matches) {
    const clean = trimTrailingChars(raw, '),.:');
    const isFile = /\.[\da-z]+$/i.test(clean);
    const dir = isFile ? clean.slice(0, clean.lastIndexOf('/')) : trimTrailingChars(clean, '/');
    if (!dir || CODE_ROOTS.has(dir)) continue;
    globs.add(`${dir}/**`);
  }

  const result = [...globs].toSorted((left, right) => left.localeCompare(right));
  const zones = new Set(
    result.map((glob) =>
      glob
        .replace(/\/\*\*$/, '')
        .split('/')
        .slice(0, 3)
        .join('/'),
    ),
  );

  return zones.size > MAX_ANCHOR_ZONES ? [] : result;
};

/**
 * @param {DocMap | null} oldMap
 * @param {DocEntry[]} freshDocs
 */
const mergeDocMap = (oldMap, freshDocs) => {
  const oldByPath = new Map((oldMap?.docs ?? []).map((e) => [e.path, e]));
  const stale = [];

  const docs = freshDocs.map((fresh) => {
    const prev = oldByPath.get(fresh.path);
    if (prev && prev.sha === fresh.sha) {
      return { ...fresh, summary: prev.summary ?? '', keywords: prev.keywords ?? [] };
    }
    stale.push(fresh.path);
    return { ...fresh, summary: prev?.summary ?? '', keywords: prev?.keywords ?? [] };
  });

  return { map: { version: 1, docs }, stale };
};

/** @param {string} dir @param {string} root @param {string[]} acc */
const findMarkdown = async (dir, root, acc) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of [...entries].toSorted((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await findMarkdown(full, root, acc);
    } else if (entry.name.endsWith('.md')) {
      acc.push(relative(root, full));
    }
  }
  return acc;
};

const root = process.cwd();
const markdownFiles = await findMarkdown(root, root, []);
const files = markdownFiles.filter((f) => !SKIP_FILES.has(basename(f)));

/** @type {DocEntry[]} */
const fresh = [];

for (const path of files) {
  const content = await fs.readFile(resolve(root, path), 'utf8');
  const codePaths = [];

  for (const glob of extractCodePaths(content)) {
    const dir = glob.replace(/\/\*\*$/, '');
    try {
      await fs.stat(resolve(root, dir));
      codePaths.push(glob);
    } catch {
      continue;
    }
  }

  fresh.push({
    path,
    title: extractTitle(content),
    codePaths,
    sha: computeSha(content),
  });
}

/** @type {DocMap | null} */
let oldMap = null;

try {
  oldMap = JSON.parse(await fs.readFile(resolve(root, OUT), 'utf8'));
} catch {
  oldMap = null;
}

const { map, stale } = mergeDocMap(oldMap, fresh);
await fs.writeFile(resolve(root, OUT), `${JSON.stringify(map, null, 2)}\n`);
process.stdout.write(`STALE_DOCS ${JSON.stringify(stale)}\n`);
