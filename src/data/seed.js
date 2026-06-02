export function createSeedState() {
  const teams = [
    {
      id: 'team-product',
      name: 'Product Team Space',
      owner: 'Huanhuan Shu',
      usedBytes: 342_000_000_000,
      quotaBytes: 800_000_000_000,
      members: ['Huanhuan Shu', 'Mina Chen', 'Rui Zhang']
    },
    {
      id: 'team-engineering',
      name: 'Engineering Space',
      owner: 'Alex Wang',
      usedBytes: 612_000_000_000,
      quotaBytes: 1_200_000_000_000,
      members: ['Alex Wang', 'Jin Li', 'Mina Chen']
    }
  ];

  const files = [
    {
      id: 'file-prd',
      name: 'Enterprise Drive PRD.pdf',
      type: 'pdf',
      size: 4_800_000,
      owner: 'Huanhuan Shu',
      teamId: 'team-product',
      folder: '/Roadmap/2026',
      status: 'active',
      version: 4,
      updatedAt: '2026-06-02T09:20:00.000Z',
      shared: true,
      tags: ['prd', 'roadmap']
    },
    {
      id: 'file-contract',
      name: 'Storage Vendor Contract.docx',
      type: 'docx',
      size: 1_600_000,
      owner: 'Mina Chen',
      teamId: 'team-product',
      folder: '/Legal',
      status: 'active',
      version: 2,
      updatedAt: '2026-06-01T13:10:00.000Z',
      shared: false,
      tags: ['legal']
    },
    {
      id: 'file-api',
      name: 'Upload Service API.md',
      type: 'markdown',
      size: 240_000,
      owner: 'Alex Wang',
      teamId: 'team-engineering',
      folder: '/Architecture',
      status: 'active',
      version: 8,
      updatedAt: '2026-05-30T03:45:00.000Z',
      shared: true,
      tags: ['api', 'upload']
    },
    {
      id: 'file-deleted',
      name: 'Old Permission Matrix.xlsx',
      type: 'xlsx',
      size: 930_000,
      owner: 'Rui Zhang',
      teamId: 'team-product',
      folder: '/Archive',
      status: 'deleted',
      version: 1,
      updatedAt: '2026-05-16T07:00:00.000Z',
      deletedAt: '2026-06-01T02:30:00.000Z',
      shared: false,
      tags: ['permissions']
    }
  ];

  const permissions = {
    'file-prd': [
      { subjectType: 'user', subjectName: 'Huanhuan Shu', role: 'manager', inherited: false },
      { subjectType: 'team', subjectName: 'Product Team Space', role: 'viewer', inherited: true },
      { subjectType: 'user', subjectName: 'Mina Chen', role: 'editor', inherited: false }
    ],
    'file-contract': [
      { subjectType: 'user', subjectName: 'Mina Chen', role: 'manager', inherited: false },
      { subjectType: 'user', subjectName: 'Huanhuan Shu', role: 'viewer', inherited: false }
    ],
    'file-api': [
      { subjectType: 'team', subjectName: 'Engineering Space', role: 'editor', inherited: true },
      { subjectType: 'user', subjectName: 'Huanhuan Shu', role: 'viewer', inherited: false }
    ]
  };

  const shares = [
    {
      id: 'share-prd',
      fileId: 'file-prd',
      scope: 'external-link',
      expiresAt: '2026-06-16T00:00:00.000Z',
      passwordEnabled: true,
      allowDownload: false,
      visits: 19
    },
    {
      id: 'share-api',
      fileId: 'file-api',
      scope: 'team-link',
      expiresAt: null,
      passwordEnabled: false,
      allowDownload: true,
      visits: 42
    }
  ];

  const transfers = [
    {
      id: 'transfer-1',
      fileName: 'Customer archive.zip',
      direction: 'upload',
      progress: 74,
      status: 'running',
      speed: '18.4 MB/s',
      updatedAt: '2026-06-02T12:40:00.000Z'
    },
    {
      id: 'transfer-2',
      fileName: 'Board packet.pdf',
      direction: 'download',
      progress: 100,
      status: 'completed',
      speed: 'completed',
      updatedAt: '2026-06-02T11:58:00.000Z'
    },
    {
      id: 'transfer-3',
      fileName: 'Legacy export.mov',
      direction: 'upload',
      progress: 36,
      status: 'retrying',
      speed: 'network unstable',
      updatedAt: '2026-06-02T12:36:00.000Z'
    }
  ];

  const audit = [
    {
      id: 'audit-1',
      actor: 'Huanhuan Shu',
      action: 'created external share',
      target: 'Enterprise Drive PRD.pdf',
      severity: 'medium',
      createdAt: '2026-06-02T09:35:00.000Z'
    },
    {
      id: 'audit-2',
      actor: 'Rui Zhang',
      action: 'moved file to recycle bin',
      target: 'Old Permission Matrix.xlsx',
      severity: 'low',
      createdAt: '2026-06-01T02:30:00.000Z'
    },
    {
      id: 'audit-3',
      actor: 'System',
      action: 'quota threshold checked',
      target: 'Engineering Space',
      severity: 'low',
      createdAt: '2026-06-02T00:00:00.000Z'
    }
  ];

  return { teams, files, permissions, shares, transfers, audit };
}
