import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { createApp } from '../src/app.js';
import { createStore } from '../src/data/store.js';

let server;
let baseUrl;

before(async () => {
  server = createApp(createStore());
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

async function api(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options
  });
  const body = await response.json();
  return { response, body };
}

describe('Peachsoft Drive API', () => {
  it('returns overview metrics for the mature web product workspace', async () => {
    const { response, body } = await api('/api/overview');
    assert.equal(response.status, 200);
    assert.equal(body.workspace.totalFiles, 3);
    assert.equal(body.workspace.deletedFiles, 1);
    assert.equal(body.admin.storage.status, 'healthy');
  });

  it('filters active files by query', async () => {
    const { body } = await api('/api/files?q=upload');
    assert.equal(body.length, 1);
    assert.equal(body[0].name, 'Upload Service API.md');
  });

  it('creates upload metadata and records it in the file list', async () => {
    const { response, body } = await api('/api/files', {
      method: 'POST',
      body: JSON.stringify({ name: 'Launch Checklist.pdf', type: 'pdf', size: 1234, teamId: 'team-product' })
    });
    assert.equal(response.status, 201);
    assert.equal(body.name, 'Launch Checklist.pdf');

    const files = await api('/api/files?q=launch');
    assert.equal(files.body.length, 1);
  });

  it('creates share links with controlled download behavior', async () => {
    const { response, body } = await api('/api/files/file-contract/share', {
      method: 'POST',
      body: JSON.stringify({ passwordEnabled: true, allowDownload: false })
    });
    assert.equal(response.status, 201);
    assert.equal(body.passwordEnabled, true);
    assert.equal(body.allowDownload, false);
  });

  it('updates direct permissions for a file', async () => {
    const { response, body } = await api('/api/files/file-api/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ subjectName: 'Rui Zhang', role: 'downloader' })
    });
    assert.equal(response.status, 200);
    assert.equal(body.find((entry) => entry.subjectName === 'Rui Zhang').role, 'downloader');
  });

  it('moves files to recycle bin and restores them', async () => {
    const deleted = await api('/api/files/file-api', { method: 'DELETE' });
    assert.equal(deleted.response.status, 200);
    assert.equal(deleted.body.status, 'deleted');

    const trash = await api('/api/trash');
    assert.ok(trash.body.some((file) => file.id === 'file-api'));

    const restored = await api('/api/trash/file-api/restore', { method: 'POST' });
    assert.equal(restored.response.status, 200);
    assert.equal(restored.body.status, 'active');
  });
});
