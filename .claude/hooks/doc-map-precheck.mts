import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

type DocEntry = {
  path: string;
  title?: string;
  summary?: string;
  keywords?: string[];
  codePaths?: string[];
  sha?: string;
};

type DocMap = {
  version: number;
  docs: DocEntry[];
};

type GateDecision = {
  allow: boolean;
  missing?: string[];
  reason?: string;
};

type HookPayload = {
  session_id?: string;
  tool_name?: string;
  tool_input?: { file_path?: string; offset?: number; limit?: number };
};

const GATED_PATH_PATTERN = /^src\//;
const GATED_FILE_PATTERN = /\.(?:ts|tsx|css)$/;

const computeSha = (content: string): string =>
  createHash('sha256').update(content).digest('hex').slice(0, 8);

const compileGlob = (glob: string): RegExp => {
  const escaped = glob.replaceAll(/[$()+.[\\\]^{|}]/g, String.raw`\$&`);
  const pattern = escaped.replaceAll('**', ' ').replaceAll('*', '[^/]*').replaceAll(' ', '.*');
  return new RegExp(`^${pattern}$`);
};

const matchDocsForPath = (filePath: string, docMap: DocMap): string[] =>
  (docMap.docs ?? [])
    .filter((entry) => (entry.codePaths ?? []).some((glob) => compileGlob(glob).test(filePath)))
    .map((entry) => entry.path);

export const decideGate = (relPath: string, docMap: DocMap, readDocs: string[]): GateDecision => {
  const required = matchDocsForPath(relPath, docMap);

  if (required.length === 0) {
    return { allow: true };
  }
  const read = new Set(readDocs);
  const missing = required.filter((docPath) => !read.has(docPath));

  if (missing.length === 0) {
    return { allow: true };
  }

  return {
    allow: false,
    missing,
    reason:
      `Прежде чем трогать ${relPath}, прочитай привязанную документацию (открой её через Read): ${missing.join(', ')}. ` +
      'После прочтения повтори операцию. Это жёсткое правило doc-map: код с привязанной докой не трогаем без неё.',
  };
};

export const checkIndexedDoc = (relPath: string, docMap: DocMap): boolean =>
  (docMap.docs ?? []).some((entry) => entry.path === relPath);

export const buildDesyncNotice = (
  relPath: string,
  docMap: DocMap,
  actualSha: string,
): string | null => {
  const entry = (docMap.docs ?? []).find((candidate) => candidate.path === relPath);

  if (!entry || entry.sha === actualSha) {
    return null;
  }

  return (
    `⚠ doc-map: индекс рассинхронизирован по ${relPath} (sha в индексе ≠ файлу на диске). ` +
    'Обнови индекс: yarn doc-map (и summary/keywords для протухших).'
  );
};

export const checkRepeatFullRead = (
  relPath: string,
  currentSha: string | null,
  fullReads: Record<string, string>,
): boolean => Boolean(currentSha) && fullReads[relPath] === currentSha;

const readStdin = (): Promise<string> =>
  new Promise((res) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      res(data);
    });
    process.stdin.on('error', () => {
      res('');
    });
  });

const hashSession = (raw: string | undefined): string =>
  createHash('sha256')
    .update(raw ?? 'default')
    .digest('hex')
    .slice(0, 16);

const resolveStateFile = (raw: string | undefined): string =>
  join(tmpdir(), `doc-map-gate-${hashSession(raw)}.json`);

const resolveFullReadFile = (raw: string | undefined): string =>
  join(tmpdir(), `doc-map-fullread-${hashSession(raw)}.json`);

const loadRead = async (file: string): Promise<string[]> => {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as string[];
  } catch {
    return [];
  }
};

const saveRead = async (file: string, list: string[]): Promise<void> => {
  try {
    await fs.writeFile(file, JSON.stringify(list));
  } catch {
    return;
  }
};

const loadMap = async (file: string): Promise<Record<string, string>> => {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, string>;
  } catch {
    return {};
  }
};

const saveMap = async (file: string, obj: Record<string, string>): Promise<void> => {
  try {
    await fs.writeFile(file, JSON.stringify(obj));
  } catch {
    return;
  }
};

const deny = (reason: string): void => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
};

const emitSystemNotice = (message: string): void => {
  process.stdout.write(JSON.stringify({ systemMessage: message }));
};

const parsePayload = async (): Promise<HookPayload | null> => {
  try {
    return JSON.parse(await readStdin()) as HookPayload;
  } catch {
    return null;
  }
};

const loadDocMap = async (root: string): Promise<DocMap | null> => {
  try {
    return JSON.parse(await fs.readFile(resolve(root, 'docs/doc-map.json'), 'utf8')) as DocMap;
  } catch {
    return null;
  }
};

const readSha = async (absPath: string): Promise<string | null> => {
  try {
    return computeSha(await fs.readFile(absPath, 'utf8'));
  } catch {
    return null;
  }
};

const applyDocGate = async (rel: string, docMap: DocMap, gateFile: string): Promise<boolean> => {
  if (!GATED_PATH_PATTERN.test(rel) || !GATED_FILE_PATTERN.test(rel)) {
    return false;
  }
  const decision = decideGate(rel, docMap, await loadRead(gateFile));

  if (decision.allow || !decision.reason) {
    return false;
  }
  deny(decision.reason);
  return true;
};

const trackFullRead = async (rel: string, sha: string, fullFile: string): Promise<boolean> => {
  const full = await loadMap(fullFile);

  if (checkRepeatFullRead(rel, sha, full)) {
    deny(
      `Файл ${rel} уже прочитан ЦЕЛИКОМ в этой сессии и не менялся — он уже в контексте. ` +
        'Повторное полное чтение бессмысленно. Нужен конкретный участок — читай его через Read с offset/limit.',
    );
    return true;
  }
  full[rel] = sha;
  await saveMap(fullFile, full);
  return false;
};

const registerDocRead = async (
  rel: string,
  sha: string | null,
  docMap: DocMap,
  gateFile: string,
): Promise<void> => {
  const readDocs = await loadRead(gateFile);

  if (!readDocs.includes(rel)) {
    readDocs.push(rel);
    await saveRead(gateFile, readDocs);
  }
  const notice = sha ? buildDesyncNotice(rel, docMap, sha) : null;

  if (notice) {
    emitSystemNotice(notice);
  }
};

const main = async (): Promise<void> => {
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const payload = await parsePayload();
  const filePath = payload?.tool_input?.file_path;

  if (!payload || !filePath) {
    return;
  }
  const docMap = await loadDocMap(root);

  if (!docMap) {
    return;
  }
  const rel = relative(root, resolve(root, filePath));
  const toolInput = payload.tool_input ?? {};
  const isFullRead =
    payload.tool_name === 'Read' && toolInput.offset == null && toolInput.limit == null;
  const indexed = checkIndexedDoc(rel, docMap);
  const sha = isFullRead || indexed ? await readSha(resolve(root, rel)) : null;
  const gateFile = resolveStateFile(payload.session_id);
  const fullFile = resolveFullReadFile(payload.session_id);

  if (await applyDocGate(rel, docMap, gateFile)) {
    return;
  }
  if (isFullRead && sha && (await trackFullRead(rel, sha, fullFile))) {
    return;
  }
  if (indexed) {
    await registerDocRead(rel, sha, docMap, gateFile);
  }
};

if (process.argv[1] && process.argv[1].endsWith('doc-map-precheck.mts')) {
  main().catch(() => undefined);
}
