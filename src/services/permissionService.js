import { getFile } from './fileService.js';
import { recordAudit } from './auditService.js';

export const permissionRoles = ['viewer', 'downloader', 'editor', 'manager'];

export function listPermissions(state, fileId) {
  const file = getFile(state, fileId);
  if (!file) return null;
  return state.permissions[fileId] ?? [];
}

export function updatePermission(state, fileId, payload) {
  const file = getFile(state, fileId);
  if (!file) return null;
  if (!permissionRoles.includes(payload.role)) {
    throw new Error(`role must be one of ${permissionRoles.join(', ')}`);
  }

  const entries = state.permissions[fileId] ?? [];
  const existing = entries.find((entry) => entry.subjectName === payload.subjectName);
  if (existing) {
    existing.role = payload.role;
    existing.inherited = false;
  } else {
    entries.push({
      subjectType: payload.subjectType ?? 'user',
      subjectName: payload.subjectName,
      role: payload.role,
      inherited: false
    });
  }
  state.permissions[fileId] = entries;
  recordAudit(state, {
    actor: payload.actor ?? 'Huanhuan Shu',
    action: `changed permission for ${payload.subjectName}`,
    target: file.name,
    severity: 'medium'
  });
  return entries;
}
