import { listAudit } from './auditService.js';
import { listFiles, listTrash, summarizeFiles } from './fileService.js';
import { getTransferHealth } from './transferService.js';
import { listTeams } from './teamService.js';

export function getAdminDashboard(state) {
  const activeFiles = listFiles(state);
  const teams = listTeams(state);
  const totalUsedBytes = teams.reduce((sum, team) => sum + team.usedBytes, 0);
  const totalQuotaBytes = teams.reduce((sum, team) => sum + team.quotaBytes, 0);
  const quotaPercent = Math.round((totalUsedBytes / totalQuotaBytes) * 100);

  return {
    storage: {
      totalUsedBytes,
      totalQuotaBytes,
      quotaPercent,
      status: quotaPercent > 85 ? 'attention' : 'healthy'
    },
    files: summarizeFiles(activeFiles),
    trash: {
      total: listTrash(state).length,
      retentionDays: 30
    },
    transfers: getTransferHealth(state),
    audit: listAudit(state, 6),
    serviceHealth: [
      { name: 'Metadata', status: 'healthy', latencyMs: 42 },
      { name: 'Object Storage', status: 'healthy', latencyMs: 81 },
      { name: 'Preview', status: 'degraded', latencyMs: 260 },
      { name: 'Search', status: 'healthy', latencyMs: 55 }
    ]
  };
}

export function getOverview(state) {
  const files = listFiles(state);
  const admin = getAdminDashboard(state);
  return {
    workspace: {
      totalFiles: files.length,
      sharedFiles: files.filter((file) => file.shared).length,
      deletedFiles: admin.trash.total,
      activeTransfers: admin.transfers.active
    },
    admin
  };
}
