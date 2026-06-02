import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdminDashboard, getOverview } from './services/adminService.js';
import { createFile, listFiles, listTrash, moveToTrash, restoreFile } from './services/fileService.js';
import { getPreview } from './services/previewService.js';
import { createShare, listShares } from './services/shareService.js';
import { listPermissions, updatePermission } from './services/permissionService.js';
import { listTeams } from './services/teamService.js';
import { listTransfers } from './services/transferService.js';
import { notFound, parseUrl, readJson, sendJson } from './utils/http.js';

const rootDir = join(fileURLToPath(new URL('..', import.meta.url)), 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

export function createApp(state) {
  return createServer(async (req, res) => {
    try {
      if (req.url?.startsWith('/api/')) {
        await handleApi(req, res, state);
        return;
      }
      await serveStatic(req, res);
    } catch (error) {
      sendJson(res, 500, { error: error.message ?? 'Unexpected server error' });
    }
  });
}

async function handleApi(req, res, state) {
  const url = parseUrl(req);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/overview') return sendJson(res, 200, getOverview(state));
  if (req.method === 'GET' && path === '/api/admin') return sendJson(res, 200, getAdminDashboard(state));
  if (req.method === 'GET' && path === '/api/teams') return sendJson(res, 200, listTeams(state));
  if (req.method === 'GET' && path === '/api/transfers') return sendJson(res, 200, listTransfers(state));
  if (req.method === 'GET' && path === '/api/shares') return sendJson(res, 200, listShares(state));
  if (req.method === 'GET' && path === '/api/trash') return sendJson(res, 200, listTrash(state));

  if (req.method === 'GET' && path === '/api/files') {
    return sendJson(res, 200, listFiles(state, {
      query: url.searchParams.get('q') ?? undefined,
      teamId: url.searchParams.get('teamId') ?? undefined,
      type: url.searchParams.get('type') ?? undefined
    }));
  }

  if (req.method === 'POST' && path === '/api/files') {
    return sendJson(res, 201, createFile(state, await readJson(req)));
  }

  const filePreview = path.match(/^\/api\/files\/([^/]+)\/preview$/);
  if (req.method === 'GET' && filePreview) {
    const preview = getPreview(state, filePreview[1]);
    return preview ? sendJson(res, 200, preview) : notFound(res, 'File not found');
  }

  const filePermissions = path.match(/^\/api\/files\/([^/]+)\/permissions$/);
  if (filePermissions) {
    if (req.method === 'GET') {
      const permissions = listPermissions(state, filePermissions[1]);
      return permissions ? sendJson(res, 200, permissions) : notFound(res, 'File not found');
    }
    if (req.method === 'PATCH') {
      const permissions = updatePermission(state, filePermissions[1], await readJson(req));
      return permissions ? sendJson(res, 200, permissions) : notFound(res, 'File not found');
    }
  }

  const fileShare = path.match(/^\/api\/files\/([^/]+)\/share$/);
  if (req.method === 'POST' && fileShare) {
    const share = createShare(state, fileShare[1], await readJson(req));
    return share ? sendJson(res, 201, share) : notFound(res, 'File not found');
  }

  const fileDelete = path.match(/^\/api\/files\/([^/]+)$/);
  if (req.method === 'DELETE' && fileDelete) {
    const file = moveToTrash(state, fileDelete[1]);
    return file ? sendJson(res, 200, file) : notFound(res, 'File not found');
  }

  const trashRestore = path.match(/^\/api\/trash\/([^/]+)\/restore$/);
  if (req.method === 'POST' && trashRestore) {
    const file = restoreFile(state, trashRestore[1]);
    return file ? sendJson(res, 200, file) : notFound(res, 'Deleted file not found');
  }

  notFound(res, 'API route not found');
}

async function serveStatic(req, res) {
  const url = parseUrl(req);
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = normalize(requested).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(rootDir, safePath);
  const content = await readFile(filePath);
  res.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' });
  res.end(content);
}
