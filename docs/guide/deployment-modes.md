---
description: Complete deployment pipeline for each strategy and transfer method combination in Catapult.
---

# Deployment Modes

This page shows the complete pipeline for each combination of strategy and transfer method. Use it as a reference to understand exactly what tasks run and in what order before you deploy.

## Strategy.LOCAL + default (SCP)

Build happens locally. Built artifacts are uploaded to the release via `upload()` (SCP).
Configure the source directory via `set('source_path', './dist')` (default: `./build`).

```
[local: install]     → e.g. npm ci, bun install
[local: build]       → e.g. npm run build, bun run build
deploy:lock
deploy:release
deploy:update_code   → upload(source_path, paths.release) via SCP
                       source_path examples: './dist', './build', './out'
deploy:shared        → symlinks shared dirs/files into the release
[install:production] → optional, runs on server in release (e.g. nodejs:install:production)
deploy:publish       → current → releases/<release>
deploy:log_revision
deploy:healthcheck   (if configured)
deploy:unlock
deploy:cleanup
```

---

## Strategy.LOCAL + rsync recipe

Build happens locally. Built artifacts are uploaded to the release via rsync.
Configure via `set('rsync_source_path', './dist')` (default: `./`).

```
[local: install]     → e.g. npm ci, bun install
[local: build]       → e.g. npm run build, bun run build
deploy:lock
deploy:release
deploy:update_code   → rsync rsync_source_path/ → releases/<release>/
                       rsync_source_path examples: './dist', './build', './out'
                       rsync_excludes examples: ['.env', '.git', 'node_modules'] — node_modules excluded, reinstalled in production on the server
deploy:shared        → symlinks shared dirs/files into the release
[install:production] → optional, runs on server in release (e.g. nodejs:install:production)
deploy:publish       → current → releases/<release>
deploy:log_revision
deploy:healthcheck   (if configured)
deploy:unlock
deploy:cleanup
```

---

## Strategy.INLINE + rsync recipe

Source code is rsynced to the release. Install & build happen on the server inside the release directory.

```
deploy:lock
deploy:release
deploy:update_code   → rsync rsync_source_path/ → releases/<release>/
                       rsync_source_path default: './' — keep as-is, the full source is transferred
                       rsync_excludes examples: ['.git', 'node_modules', '.env', 'tests']
deploy:shared        → symlinks shared dirs/files into the release
[install]            → e.g. nodejs:install, bun:install
[build]              → e.g. nodejs:build, bun:build
deploy:publish       → current → releases/<release>
deploy:log_revision
deploy:healthcheck   (if configured)
deploy:unlock
deploy:cleanup
```

---

## Strategy.INLINE + git recipe

Source code is cloned from the git mirror into the release. Install & build happen on the server inside the release directory.

```
deploy:lock
git:check            → verifies branch exists on remote
deploy:release
git:update           → clones/fetches bare mirror into .catapult/repo
deploy:update_code   → clones from .catapult/repo into releases/<release>
deploy:shared        → symlinks shared dirs/files into the release
[install]            → e.g. nodejs:install, bun:install
[build]              → e.g. nodejs:build, bun:build
deploy:publish       → current → releases/<release>
deploy:log_revision
deploy:healthcheck   (if configured)
deploy:unlock
deploy:cleanup
```

---

## Strategy.REMOTE + git recipe

Source code is cloned into `.catapult/builder`. Install & build happen in the builder. Output is copied to the release.

```
deploy:lock
git:check            → verifies branch exists on remote
deploy:release
git:update           → clones/fetches bare mirror into .catapult/repo
deploy:update_code   → clones from .catapult/repo into .catapult/builder
deploy:build:shared  → symlinks shared dirs/files into .catapult/builder
[install]            → e.g. nodejs:install, bun:install (runs in builder)
[build]              → e.g. nodejs:build, bun:build (runs in builder)
deploy:build:copy    → copies build output from builder into releases/<release>
deploy:shared        → symlinks shared dirs/files into the release
[install:production] → e.g. nodejs:install:production (runs in release)
deploy:publish       → current → releases/<release>
deploy:log_revision
deploy:healthcheck   (if configured)
deploy:unlock
deploy:cleanup
```

---

## Strategy.REMOTE + rsync recipe

Source code is rsynced into `.catapult/builder`. Install & build happen in the builder. Output is copied to the release.

```
deploy:lock
deploy:release
deploy:update_code   → rsync rsync_source_path/ → .catapult/builder/
                       rsync_source_path examples: './', './src'
                       rsync_excludes examples: ['.git', 'node_modules', '.env', 'tests']
deploy:build:shared  → symlinks shared dirs/files into .catapult/builder
[install]            → e.g. nodejs:install, bun:install (runs in builder)
[build]              → e.g. nodejs:build, bun:build (runs in builder)
deploy:build:copy    → copies build output from builder into releases/<release>
deploy:shared        → symlinks shared dirs/files into the release
[install:production] → e.g. nodejs:install:production (runs in release)
deploy:publish       → current → releases/<release>
deploy:log_revision
deploy:healthcheck   (if configured)
deploy:unlock
deploy:cleanup
```

---

## Invalid combinations

| Combination | Reason |
| --- | --- |
| git recipe + `Strategy.LOCAL` | The server never clones the repository in LOCAL mode — a runtime error is thrown |
