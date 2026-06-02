import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';

import { checksum } from '../data/persistentStore.js';

export async function writeObject(state, { name, contentBase64 }) {
  if (!contentBase64) throw new Error('contentBase64 is required for real uploads');
  const buffer = Buffer.from(contentBase64, 'base64');
  if (!buffer.length) throw new Error('uploaded file cannot be empty');
  const extension = extname(name || '').slice(0, 16);
  const storageKey = `${randomUUID()}${extension}`;
  const storagePath = join(state.storageDir, storageKey);
  await writeFile(storagePath, buffer);
  return {
    storageKey,
    size: buffer.byteLength,
    checksum: checksum(buffer)
  };
}

export async function readObject(state, file) {
  return readFile(join(state.storageDir, file.storageKey));
}

export async function getObjectStream(state, file) {
  const storagePath = join(state.storageDir, file.storageKey);
  const details = await stat(storagePath);
  return { stream: createReadStream(storagePath), size: details.size };
}
