---
description: Deploy a monorepo with Catapult by overriding install and build tasks at the workspace root.
---

# Monorepo

A monorepo usually needs two things:

1. install dependencies at the **workspace root**
2. build a specific app from that workspace

The official recipes work well for single-app repositories. In a monorepo, the usual approach is to keep the transfer recipe (`git` or `rsync`) and override `deploy:install` / `deploy:build` so they run in the right directories.

## Server-side workspace build with `git`

This example clones the whole repository into the release, installs dependencies at the workspace root, then builds one app.

```typescript
import { defineConfig, task, cd, run, after } from '@catapultjs/deploy'
import '@catapultjs/deploy/recipes/git'

task('deploy:install', () => {
  cd('{{release_path}}')
  run('pnpm install --frozen-lockfile')
})

task('deploy:build', () => {
  cd('{{release_path}}')
  run('pnpm --filter @acme/api build')
})

after('deploy:update_code', 'deploy:install')
after('deploy:shared', 'deploy:build')

export default defineConfig({
  hosts: [
    {
      name: 'production',
      ssh: 'deploy@example.com',
      deployPath: '/home/deploy/api',
      branch: 'main',
    },
  ],
})
```

## Local workspace build with `rsync`

If your CI or local machine produces the final artifacts, build locally and sync only the output directory to the server.

```typescript
import { defineConfig, task, local, set, before } from '@catapultjs/deploy'
import '@catapultjs/deploy/recipes/rsync'

set('rsync_source_path', './apps/web/dist')

task('deploy:build', async () => {
  await local('pnpm --filter @acme/web build')
})

before('deploy:lock', 'deploy:build')

export default defineConfig({
  hosts: [
    {
      name: 'production',
      ssh: 'deploy@example.com',
      deployPath: '/home/deploy/web',
    },
  ],
})
```

## Tips

- Keep the transfer step simple: `git` for full-repository deploys, `rsync` or `astro` for artifact deploys
- Override `deploy:install` when dependencies must be installed at the workspace root
- Override `deploy:build` when the app build command differs from a single-package repository
- Use `shared_dirs` and `shared_files` exactly the same way as in a non-monorepo project
