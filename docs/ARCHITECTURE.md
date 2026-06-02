# Peachsoft Drive Architecture

## Product Goal

Peachsoft Drive is designed as a mature enterprise web product for file storage, collaboration, permission control, and operational governance. The first usable version focuses on a complete authenticated workspace rather than a marketing site.

## Eight Product Blocks

| Block | User Value | Core Screens | Backend Boundary |
| --- | --- | --- | --- |
| File list | Users can browse, sort, search, and inspect files quickly. | File workspace, file details panel | File metadata service |
| Upload and transfer | Users can track upload/download work and recover from failures. | Upload action, transfer center | Transfer service |
| File preview | Users can inspect common file types before downloading. | Preview drawer | Preview service |
| Sharing | Users can safely share files internally or externally. | Share settings, shared links | Share service |
| Permission management | Teams can control who can view, download, edit, or manage files. | Permission matrix | Permission service |
| Recycle bin | Users and admins can recover deleted files within policy. | Recycle bin | Trash service |
| Team spaces | Teams can organize storage by department or project. | Team space switcher, members | Team service |
| Admin console | Admins can monitor capacity, audit activity, and system health. | Admin dashboard | Admin, quota, audit services |

## Recommended Java Microservice Target

This prototype is a runnable monorepo, but the intended Java Web architecture should split responsibilities like this:

- `identity-service`: users, teams, roles, sessions, SSO integration.
- `metadata-service`: file records, folders, versions, paths, ownership, lifecycle state.
- `object-storage-service`: multipart upload, checksum validation, object store adapter, download tokens.
- `transfer-service`: upload/download task orchestration, retry policy, progress events.
- `preview-service`: thumbnails, document conversion, media preview, preview status.
- `permission-service`: ACLs, inherited folder permissions, policy evaluation.
- `share-service`: internal shares, external links, password, expiry, download control.
- `search-service`: filename and full-text indexing with permission-aware result filtering.
- `trash-service`: soft delete, restore, retention policy, permanent deletion.
- `quota-service`: personal and team capacity accounting, threshold alerts.
- `audit-service`: immutable operation log for access, sharing, permission, and deletion events.
- `notification-service`: transfer completion, share invite, expiry, capacity warnings.

## API Shape In This Prototype

The current runnable app exposes these API groups:

- `GET /api/overview`: workspace metrics, navigation counts, admin health.
- `GET /api/files`: active files with search, type, team, and owner filters.
- `POST /api/files`: simulated upload metadata creation.
- `GET /api/files/:id/preview`: preview metadata and supported action.
- `GET /api/files/:id/permissions`: permission matrix for a file.
- `PATCH /api/files/:id/permissions`: update a member permission.
- `POST /api/files/:id/share`: create a share link.
- `DELETE /api/files/:id`: move a file to recycle bin.
- `POST /api/trash/:id/restore`: restore a deleted file.
- `GET /api/transfers`: transfer queue and history.
- `GET /api/teams`: team spaces and capacity.
- `GET /api/admin`: audit, quota, and operational signals.

## Core Data Objects

- `FileItem`: id, name, type, size, owner, teamId, folder, status, version, updatedAt, shared, deletedAt.
- `TransferTask`: id, fileName, direction, progress, status, speed, updatedAt.
- `ShareLink`: id, fileId, scope, expiresAt, passwordEnabled, allowDownload, visits.
- `PermissionEntry`: fileId, subjectType, subjectName, role, inherited.
- `TeamSpace`: id, name, owner, usedBytes, quotaBytes, members.
- `AuditEvent`: id, actor, action, target, severity, createdAt.

## Maturity Criteria

A feature is considered production-ready only when it includes:

- Happy path behavior.
- Empty, loading, and error states.
- Permission and security behavior.
- Audit visibility when the action changes access, storage, or deletion state.
- Observable success and failure signals.
- A rollback or recovery path for destructive actions.

## Phased Delivery

| Phase | Scope | Exit Criteria |
| --- | --- | --- |
| MVP | File list, upload metadata, preview, delete/restore, basic share. | A user can store, inspect, share, and recover files. |
| V1 | Team spaces, permissions, transfer center, quota, audit. | A team can use the product with admin oversight. |
| V2 | Versioning, full-text search, advanced policies, batch actions. | Enterprise workflows can scale beyond simple storage. |
| V3 | API, webhooks, multi-storage adapters, compliance reporting. | The product becomes an extensible file platform. |

## Current Implementation Boundary

The Node implementation keeps all data in memory to make testing and review simple. In a production Java implementation, replace the in-memory store with PostgreSQL for metadata, Redis for transfer progress/session state, object storage for binary content, and an append-only store or event stream for audit records.
