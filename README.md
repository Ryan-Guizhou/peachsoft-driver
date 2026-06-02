# Peachsoft Drive

Peachsoft Drive is a runnable product architecture prototype for an enterprise file storage product. It covers the eight core product blocks discussed in planning:

1. File list and workspace
2. Upload and transfer center
3. File preview
4. Sharing
5. Permission management
6. Recycle bin
7. Team spaces
8. Admin console

The runtime implementation uses a lightweight Node.js server so it can run in this workspace without external dependencies. The code is intentionally organized around service boundaries that can be migrated to Java Spring Boot microservices later.

## Run

```bash
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for product modules, service boundaries, API shape, data model, and migration notes for a Java Web microservice implementation.
