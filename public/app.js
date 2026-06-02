const state = { view: 'files', files: [], teams: [], transfers: [], selectedFile: null };

const titles = {
  files: ['文件列表', '最近文件', '按更新时间排序'],
  uploads: ['上传与传输', '传输中心', '上传、下载和重试状态'],
  preview: ['文件预览', '预览能力', '按文件类型判断预览策略'],
  shares: ['分享中心', '共享链接', '外链、团队链接和访问控制'],
  permissions: ['权限管理', '权限矩阵', '查看、下载、编辑、管理'],
  trash: ['回收站', '已删除文件', '30 天保留策略'],
  teams: ['团队空间', '团队容量', '成员、文件和容量使用'],
  admin: ['管理后台', '系统信号', '容量、审计和服务健康']
};

const $ = (selector) => document.querySelector(selector);
const els = {
  title: $('#viewTitle'), panelTitle: $('#panelTitle'), panelMeta: $('#panelMeta'), main: $('#mainContent'),
  inspector: $('#inspectorContent'), inspectorMeta: $('#inspectorMeta'), search: $('#searchInput'), upload: $('#uploadButton'),
  quotaText: $('#quotaText'), quotaBar: $('#quotaBar'), transfers: $('#transferStrip')
};

async function api(path, options) {
  const response = await fetch(path, { headers: { 'content-type': 'application/json' }, ...options });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function bytes(value) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} GB`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  return `${value} B`;
}

function date(iso) {
  if (!iso) return '未设置';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

async function load() {
  const [overview, files, teams, transfers] = await Promise.all([api('/api/overview'), api('/api/files'), api('/api/teams'), api('/api/transfers')]);
  state.files = files;
  state.teams = teams;
  state.transfers = transfers;
  state.selectedFile = state.selectedFile ?? files[0];
  $('#metricFiles').textContent = overview.workspace.totalFiles;
  $('#metricShares').textContent = overview.workspace.sharedFiles;
  $('#metricTrash').textContent = overview.workspace.deletedFiles;
  $('#metricTransfers').textContent = overview.workspace.activeTransfers;
  els.quotaText.textContent = `${overview.admin.storage.quotaPercent}% used`;
  els.quotaBar.style.width = `${overview.admin.storage.quotaPercent}%`;
  renderTransferStrip(transfers);
}

function renderTransferStrip(transfers) {
  const active = transfers.find((task) => task.status === 'running' || task.status === 'retrying');
  if (!active) {
    els.transfers.innerHTML = '<strong>传输中心</strong><span>当前没有活跃任务</span>';
    return;
  }
  els.transfers.innerHTML = `<strong>${esc(active.fileName)}</strong><span>${active.direction === 'upload' ? '上传' : '下载'} · ${esc(active.speed)}</span><div class="progress"><div style="width:${active.progress}%"></div></div>`;
}

function setView(view) {
  state.view = view;
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  const [title, panel, meta] = titles[view];
  els.title.textContent = title;
  els.panelTitle.textContent = panel;
  els.panelMeta.textContent = meta;
  renderView();
}

function fileRow(file, restore = false) {
  return `<article class="table-row" data-file-id="${file.id}"><div class="file-name"><strong>${esc(file.name)}</strong><span>${esc(file.folder)} · v${file.version}</span></div><span>${esc(file.owner)}</span><span>${bytes(file.size)}</span><span class="badge ${file.shared ? 'success' : ''}">${file.shared ? '已分享' : file.type}</span><div class="row-actions">${restore ? `<button class="secondary-button" data-action="restore" data-id="${file.id}">恢复</button>` : `<button class="secondary-button" data-action="preview" data-id="${file.id}">预览</button><button class="secondary-button" data-action="share" data-id="${file.id}">分享</button><button class="danger-button" data-action="delete" data-id="${file.id}">删除</button>`}</div></article>`;
}

function renderFiles() {
  const query = els.search.value.trim().toLowerCase();
  const files = state.files.filter((file) => !query || [file.name, file.owner, file.folder, ...(file.tags ?? [])].join(' ').toLowerCase().includes(query));
  els.main.innerHTML = files.length ? files.map((file) => fileRow(file)).join('') : '<div class="empty-state">没有匹配文件</div>';
  renderInspector(state.selectedFile);
}

async function renderTransfers() {
  const transfers = await api('/api/transfers');
  els.main.innerHTML = transfers.map((task) => `<article class="transfer-row"><div><strong>${esc(task.fileName)}</strong><span>${date(task.updatedAt)}</span></div><span class="badge ${task.status === 'retrying' ? 'warning' : 'success'}">${task.status}</span><div class="progress"><div style="width:${task.progress}%"></div></div><span>${esc(task.speed)}</span></article>`).join('');
  renderInspector(null, '传输中心会在生产环境接入分片上传、断点续传、失败重试和限速策略。');
}

async function renderShares() {
  const shares = await api('/api/shares');
  els.main.innerHTML = shares.map((share) => `<article class="share-row"><div><strong>${esc(share.file?.name ?? share.fileId)}</strong><span>${share.expiresAt ? `过期：${date(share.expiresAt)}` : '长期有效'}</span></div><span class="badge">${esc(share.scope)}</span><span>${share.passwordEnabled ? '密码保护' : '无密码'}</span><span>${share.allowDownload ? '可下载' : '仅预览'}</span><span>${share.visits} 次访问</span></article>`).join('');
  renderInspector(null, '分享设计覆盖外链、团队链接、有效期、密码、下载开关和访问审计。');
}

async function renderTrash() {
  const trash = await api('/api/trash');
  els.main.innerHTML = trash.length ? trash.map((file) => fileRow(file, true)).join('') : '<div class="empty-state">回收站为空</div>';
  renderInspector(null, '删除进入 30 天保留期；管理员可扩展为按团队或合规策略设置保留周期。');
}

function renderTeams() {
  els.main.innerHTML = state.teams.map((team) => `<article class="team-row"><div><strong>${esc(team.name)}</strong><span>${team.members.map(esc).join('、')}</span></div><span>${team.fileCount} 个文件</span><div class="progress"><div style="width:${team.usagePercent}%"></div></div><span>${team.usagePercent}%</span></article>`).join('');
  renderInspector(null, '团队空间用于承载部门、项目和跨职能协作的文件边界。');
}

async function renderAdmin() {
  const admin = await api('/api/admin');
  const health = admin.serviceHealth.map((service) => `<article class="audit-row"><strong>${esc(service.name)}</strong><span>${service.latencyMs} ms</span><span class="badge ${service.status === 'degraded' ? 'warning' : 'success'}">${service.status}</span></article>`).join('');
  const audit = admin.audit.map((event) => `<article class="audit-row"><strong>${esc(event.actor)}</strong><span>${esc(event.action)} · ${esc(event.target)}</span><span>${date(event.createdAt)}</span></article>`).join('');
  els.main.innerHTML = `${health}${audit}`;
  renderInspector(null, `系统容量使用 ${admin.storage.quotaPercent}%，预览服务当前为 ${admin.serviceHealth.find((item) => item.name === 'Preview')?.status}。`);
}

async function renderPreviewOrPermissions(kind) {
  const file = state.selectedFile ?? state.files[0];
  if (!file) return;
  if (kind === 'preview') {
    const preview = await api(`/api/files/${file.id}/preview`);
    els.main.innerHTML = `<div class="empty-state"><div><strong>${esc(preview.fileName)}</strong><p>${esc(preview.message)}</p></div></div>`;
  } else {
    const permissions = await api(`/api/files/${file.id}/permissions`);
    els.main.innerHTML = permissions.map((entry) => `<article class="audit-row"><strong>${esc(entry.subjectName)}</strong><span>${esc(entry.subjectType)} · ${entry.inherited ? '继承权限' : '直接授权'}</span><span class="badge">${esc(entry.role)}</span></article>`).join('');
  }
  renderInspector(file);
}

function renderInspector(file, note) {
  if (!file) {
    els.inspectorMeta.textContent = '模块说明';
    els.inspector.innerHTML = `<p class="muted">${esc(note ?? '选择文件查看预览、分享、权限和审计上下文。')}</p>`;
    return;
  }
  els.inspectorMeta.textContent = '文件详情';
  const team = state.teams.find((item) => item.id === file.teamId);
  els.inspector.innerHTML = `<div class="detail-list"><div><span>文件名</span><strong>${esc(file.name)}</strong></div><div><span>类型</span><strong>${esc(file.type)}</strong></div><div><span>大小</span><strong>${bytes(file.size)}</strong></div><div><span>负责人</span><strong>${esc(file.owner)}</strong></div><div><span>团队空间</span><strong>${esc(team?.name ?? file.teamId)}</strong></div><div><span>更新时间</span><strong>${date(file.updatedAt)}</strong></div></div>`;
}

async function renderView() {
  if (state.view === 'files') return renderFiles();
  if (state.view === 'uploads') return renderTransfers();
  if (state.view === 'preview') return renderPreviewOrPermissions('preview');
  if (state.view === 'shares') return renderShares();
  if (state.view === 'permissions') return renderPreviewOrPermissions('permissions');
  if (state.view === 'trash') return renderTrash();
  if (state.view === 'teams') return renderTeams();
  if (state.view === 'admin') return renderAdmin();
}

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
els.search.addEventListener('input', () => state.view === 'files' && renderFiles());
els.upload.addEventListener('click', async () => {
  const created = await api('/api/files', { method: 'POST', body: JSON.stringify({ name: `New Upload ${new Date().toLocaleTimeString('zh-CN')}.pdf`, type: 'pdf', size: 2_400_000, teamId: state.teams[0]?.id, folder: '/Uploads', tags: ['upload'] }) });
  state.files.unshift(created);
  state.selectedFile = created;
  await load();
  setView('files');
});

els.main.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  const row = event.target.closest('[data-file-id]');
  if (row) {
    state.selectedFile = state.files.find((file) => file.id === row.dataset.fileId) ?? state.selectedFile;
    renderInspector(state.selectedFile);
  }
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === 'preview') { state.selectedFile = state.files.find((file) => file.id === id); setView('preview'); }
  if (button.dataset.action === 'share') { await api(`/api/files/${id}/share`, { method: 'POST', body: JSON.stringify({ passwordEnabled: true, allowDownload: false }) }); await load(); setView('shares'); }
  if (button.dataset.action === 'delete') { await api(`/api/files/${id}`, { method: 'DELETE' }); await load(); setView('trash'); }
  if (button.dataset.action === 'restore') { await api(`/api/trash/${id}/restore`, { method: 'POST' }); await load(); setView('files'); }
});

await load();
setView('files');
