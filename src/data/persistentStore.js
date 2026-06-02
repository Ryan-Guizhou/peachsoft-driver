import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';

import { createSeedState } from './seed.js';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function defaultContent(file) {
  return Buffer.from([
    `Peachsoft Drive sample file: ${file.name}`,
    `Owner: ${file.owner}`,
    `Folder: ${file.folder}`,
    `Version: ${file.version}`,
    '',
    'This file is stored on disk so uploads, downloads, preview, recycle bin, and share flows can be tested end to end.'
  ].join('\n'), 'utf8');
}

function checksum(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}

async function ensureSeedFiles(state, storageDir) {
  for (const file of state.files) {
    if (!file.storageKey) file.storageKey = `${file.id}.txt`;
    if (!file.mimeType) file.mimeType = file.type === 'markdown' ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8';
    const storagePath = join(storageDir, file.storageKey);
    if (!(await exists(storagePath))) {
      const content = defaultContent(file);
      await writeFile(storagePath, content);
      file.size = content.byteLength;
      file.checksum = checksum(content);
    }
  }
}

export async function createPersistentStore({ dataDir = join(process.cwd(), 'runtime-data'), reset = false } = {}) {
  const storageDir = join(dataDir, 'objects');
  const dbPath = join(dataDir, 'db.json');
  await mkdir(storageDir, { recursive: true });

  let state;
  if (!reset && (await exists(dbPath))) {
    state = JSON.parse(await readFile(dbPath, 'utf8'));
  } else {
    state = createSeedState();
    await ensureSeedFiles(state, storageDir);
    await writeJson(dbPath, state);
  }

  Object.defineProperties(state, {
    dataDir: { value: dataDir, enumerable: false },
    storageDir: { value: storageDir, enumerable: false },
    dbPath: { value: dbPath, enumerable: false },
    save: {
      enumerable: false,
      value: async () => writeJson(dbPath, state)
    }
  });

  await ensureSeedFiles(state, storageDir);
  await state.save();
  return state;
}

export { checksum };
