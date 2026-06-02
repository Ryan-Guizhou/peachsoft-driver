import { recordAudit } from './auditService.js';

const typeLabels = {
  pdf: 'PDF',
  docx: 'Document',
  xlsx: 'Spreadsheet',
  markdown: 'Markdown',
  image: 'Image',
  video: 'Video',
  other: 'File'
};

export function listFiles(state, filters = {}) {
  const query = filters.query?.toLowerCase() ?? '';
  return state.files
    .filter((file) => file.status !== 'deleted')
    .filter((file) => !query || [file.name, file.owner, file.folder, ...(file.tags ?? [])].join(' ').toLowerCase().includes(query))
    .filter((file) => !filters.teamId || file.teamId === filters.teamId)
    .filter((file) => !filters.type || file.type === filters.type)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getFile(state, id, { includeDeleted = false } = {}) {
  return state.files.find((file) => file.id === id && (includeDeleted || file.status !== 'deleted')) ?? null;
}

export function createFile(state, payload) {
  if (!payload.name || !payload.teamId) {
    throw new Error('name and teamId are required');
  }

  const file = {
    id: `file-${Date.now()}`,
    name: payload.name,
    type: payload.type ?? 'other',
    size: Number(payload.size ?? 0),
    owner: payload.owner ?? 'Huanhuan Shu',
    teamId: payload.teamId,
    folder: payload.folder ?? '/',
    status: 'active',
    version: 1,
    updatedAt: new Date().toISOString(),
    shared: false,
    tags: payload.tags ?? []
  };

  state.files.unshift(file);
  recordAudit(state, { actor: file.owner, action: 'uploaded file metadata', target: file.name });
  return file;
}

export function moveToTrash(state, id, actor = 'Huanhuan Shu') {
  const file = getFile(state, id);
  if (!file) return null;
  file.status = 'deleted';
  file.deletedAt = new Date().toISOString();
  recordAudit(state, { actor, action: 'moved file to recycle bin', target: file.name, severity: 'medium' });
  return file;
}

export function listTrash(state) {
  return state.files.filter((file) => file.status === 'deleted').sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
}

export function restoreFile(state, id, actor = 'Huanhuan Shu') {
  const file = getFile(state, id, { includeDeleted: true });
  if (!file || file.status !== 'deleted') return null;
  file.status = 'active';
  delete file.deletedAt;
  file.updatedAt = new Date().toISOString();
  recordAudit(state, { actor, action: 'restored file from recycle bin', target: file.name });
  return file;
}

export function summarizeFiles(files) {
  const byType = files.reduce((acc, file) => {
    const label = typeLabels[file.type] ?? typeLabels.other;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  return { total: files.length, byType };
}
