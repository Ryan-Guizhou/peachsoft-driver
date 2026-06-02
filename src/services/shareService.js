import { getFile } from './fileService.js';
import { recordAudit } from './auditService.js';

export function listShares(state) {
  return state.shares.map((share) => ({
    ...share,
    file: getFile(state, share.fileId, { includeDeleted: true })
  }));
}

export function createShare(state, fileId, options = {}) {
  const file = getFile(state, fileId);
  if (!file) return null;

  const share = {
    id: `share-${Date.now()}`,
    fileId,
    scope: options.scope ?? 'external-link',
    expiresAt: options.expiresAt ?? null,
    passwordEnabled: Boolean(options.passwordEnabled),
    allowDownload: options.allowDownload !== false,
    visits: 0
  };

  file.shared = true;
  state.shares.unshift(share);
  recordAudit(state, {
    actor: options.actor ?? 'Huanhuan Shu',
    action: `created ${share.scope} share`,
    target: file.name,
    severity: share.scope === 'external-link' ? 'medium' : 'low'
  });
  return share;
}
