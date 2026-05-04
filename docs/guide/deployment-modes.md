---
description: Complete deployment pipeline for each strategy and transfer method combination in Catapult.
---

# Deployment Modes

This page shows the complete pipeline for each combination of strategy and transfer method.

The pipelines below use `recipes/adonisjs` as the example recipe. If you use a different recipe, the task names differ but the structure is the same.

## Strategy.LOCAL + default (SCP)

Build happens locally. Built artifacts are uploaded to the release via SCP.

```typescript
// deploy.ts
import { defineConfig, set } from '@catapultjs/deploy'
import { Strategy } from '@catapultjs/deploy/enums'
import '@catapultjs/deploy/recipes/adonisjs'
import '@catapultjs/deploy/recipes/pm2'

set('source_path', './build')

export default defineConfig({
  strategy: Strategy.LOCAL,
  hosts: [{ 
    name: 'production', 
    ssh: 'deploy@example.com', 
    deployPath: '/home/deploy/myapp'
  }],
})
```

```
deploy:lock
adonisjs:test        → runs locally (node ace test)
adonisjs:build       → runs locally (node ace build)
deploy:release
deploy:update_code   → upload(source_path, paths.release) via SCP
deploy:shared        → symlinks shared dirs/files into the release
adonisjs:install     → production deps installed in the release
adonisjs:migrate     → node ace migration:run --force
deploy:publish       → current → releases/<release>
pm2:startOrReload    → pm2 startOrReload ecosystem.config.cjs --update-env
pm2:save             → pm2 save
deploy:log_revision
deploy:unlock
deploy:cleanup
```

---

## Strategy.LOCAL + rsync recipe

Build happens locally. Built artifacts are uploaded to the release via rsync.

```typescript
// deploy.ts
import { defineConfig, set } from '@catapultjs/deploy'
import { Strategy } from '@catapultjs/deploy/enums'
import '@catapultjs/deploy/recipes/rsync'
import '@catapultjs/deploy/recipes/adonisjs'
import '@catapultjs/deploy/recipes/pm2'

set('rsync_source_path', './build')
set('rsync_excludes', ['.env'])

export default defineConfig({
  strategy: Strategy.LOCAL,
  hosts: [{ 
    name: 'production', 
    ssh: 'deploy@example.com', 
    deployPath: '/home/deploy/myapp'
  }],
})
```

```
deploy:lock
adonisjs:test        → runs locally (node ace test)
adonisjs:build       → runs locally (node ace build)
deploy:release
deploy:update_code   → rsync rsync_source_path/ → releases/<release>/
adonisjs:install     → production deps installed in the release
deploy:shared        → symlinks shared dirs/files into the release
adonisjs:migrate     → node ace migration:run --force
deploy:publish       → current → releases/<release>
pm2:startOrReload    → pm2 startOrReload ecosystem.config.cjs --update-env
pm2:save             → pm2 save
deploy:log_revision
deploy:unlock
deploy:cleanup
```

---

## Strategy.REMOTE + git recipe

Source code is cloned into `.catapult/builder`. Install, test & build happen on the server. Output is copied to the release.

```typescript
// deploy.ts
import { defineConfig } from '@catapultjs/deploy'
import { Strategy } from '@catapultjs/deploy/enums'
import '@catapultjs/deploy/recipes/git'
import '@catapultjs/deploy/recipes/adonisjs'
import '@catapultjs/deploy/recipes/pm2'

export default defineConfig({
  strategy: Strategy.REMOTE,
  hosts: [{ 
    name: 'production', 
    ssh: 'deploy@example.com', 
    deployPath: '/home/deploy/myapp', 
    branch: 'main'
  }],
})
```

```
deploy:lock
git:check                 → verifies branch exists on remote
git:update                → clones/fetches bare mirror into .catapult/repo
deploy:update_code        → clones from .catapult/repo into .catapult/builder
adonisjs:builder:install  → full deps installed in the builder
deploy:builder:shared     → symlinks shared dirs/files into .catapult/builder
adonisjs:builder:test     → node ace test (runs in builder)
adonisjs:builder:build    → node ace build (runs in builder)
deploy:release
deploy:builder:release    → copies build output from builder into releases/<release>
adonisjs:install          → production deps installed in the release
deploy:shared             → symlinks shared dirs/files into the release
adonisjs:migrate          → node ace migration:run --force
deploy:publish            → current → releases/<release>
pm2:startOrReload         → pm2 startOrReload ecosystem.config.cjs --update-env
pm2:save                  → pm2 save
deploy:log_revision
deploy:unlock
deploy:cleanup 
```

---

## Strategy.REMOTE + rsync recipe

Source code is rsynced into `.catapult/builder`. Install, test & build happen on the server. Output is copied to the release.

```typescript
// deploy.ts
import { defineConfig, set } from '@catapultjs/deploy'
import { Strategy } from '@catapultjs/deploy/enums'
import '@catapultjs/deploy/recipes/rsync'
import '@catapultjs/deploy/recipes/adonisjs'
import '@catapultjs/deploy/recipes/pm2'

set('rsync_excludes', ['.git', 'node_modules', '.env'])

export default defineConfig({
  strategy: Strategy.REMOTE,
  hosts: [{ 
    name: 'production', 
    ssh: 'deploy@example.com', 
    deployPath: '/home/deploy/myapp',
  }],
})
```

```
deploy:lock
deploy:update_code        → rsync rsync_source_path/ → .catapult/builder/
adonisjs:builder:install  → full deps installed in the builder
deploy:builder:shared     → symlinks shared dirs/files into .catapult/builder
adonisjs:builder:test     → node ace test (runs in builder)
adonisjs:builder:build    → node ace build (runs in builder)
deploy:release
deploy:builder:release    → copies build output from builder into releases/<release>
adonisjs:install          → production deps installed in the release
deploy:shared             → symlinks shared dirs/files into the release
adonisjs:migrate          → node ace migration:run --force
deploy:publish            → current → releases/<release>
pm2:startOrReload         → pm2 startOrReload ecosystem.config.cjs --update-env
pm2:save                  → pm2 save
deploy:log_revision
deploy:unlock
deploy:cleanup
```

---

## Invalid combinations

| Combination | Reason |
| --- | --- |
| git recipe + `Strategy.LOCAL` | The server never clones the repository in LOCAL mode — a runtime error is thrown |
