---
description: Deploy a monorepo with Catapult — workspace-aware install with Strategy.LOCAL + rsync or Strategy.REMOTE + git.
---

# Monorepo

A monorepo contains multiple deployable applications sharing a single repository. Catapult handles this through two complementary approaches depending on your chosen strategy.

## Strategy LOCAL + rsync

The build runs locally. The rsync recipe uploads only the built output of the targeted app to the server — the server has no knowledge of the repository structure.

`adonisjs_path` tells the recipe where the app lives within the repository. The AdonisJS recipe's build and install tasks (`adonisjs:build`, `adonisjs:test`, `adonisjs:install`) are removed — builds run locally through `deploy:build`, overridden with `local()`, and inserted before `deploy:update_code`. Production dependencies are then installed on the server via `deploy:install`, inserted after `deploy:update_code` once the artifacts are uploaded.

```typescript
import { defineConfig, set, task, local, before, remove } from '@catapultjs/deploy'
import { Strategy } from '@catapultjs/deploy/enums'
import '@catapultjs/deploy/recipes/rsync'
import '@catapultjs/deploy/recipes/adonisjs'
import '@catapultjs/deploy/recipes/pm2'

set('adonisjs_path', './apps/api/')

// deploy:build runs via SSH by default — override it to build locally
task('deploy:build', () => {
  local('pnpm run build')
})

remove('adonisjs:install')
remove('adonijs:build')
remove('adonisjs:test')
before('deploy:update_code', 'deploy:build')
after('deploy:update_code', 'deploy:install')

export default defineConfig({
  strategy: Strategy.LOCAL,
  hosts: [{ 
    name: 'production', 
    ssh: 'deploy@example.com', 
    deployPath: '/home/deploy/api',
  }],
})
```

## Strategy REMOTE + git

The full repository is cloned and cached on the server inside `.catapult/builder`. The builder contains the entire monorepo — workspace install and build both run server-side.

The AdonisJS recipe's builder tasks (`adonisjs:builder:install`, `adonisjs:builder:build`, `adonisjs:builder:test`) are removed and replaced with the generic `deploy:install` and `deploy:build` tasks, which operate at the monorepo root. This is required because in a monorepo, dependencies must be installed at the **workspace root**, not inside the individual app directory.

`adonisjs:shared` is inserted after `deploy:install` to symlink shared dirs and files into the build output directory within the release. `deploy:build` is inserted after `deploy:install` to build the app in the correct sub-directory.

```typescript
import { defineConfig, set, task, cd, run, remove, after } from '@catapultjs/deploy'
import { Strategy } from '@catapultjs/deploy/enums'
import '@catapultjs/deploy/recipes/git'
import '@catapultjs/deploy/recipes/adonisjs'
import '@catapultjs/deploy/recipes/pm2'

set('adonisjs_path', '/apps/api/')

remove('adonisjs:builder:install')
remove('adonijs:builder:build')
remove('adonisjs:builder:test')
after('deploy:update_code', 'deploy:install')
after('deploy:install', 'adonisjs:shared')
after('adonisjs:shared', 'deploy:build')

export default defineConfig({
  strategy: Strategy.REMOTE,
  hosts: [{ 
    name: 'production', 
    ssh: 'deploy@example.com', 
    deployPath: '/home/deploy/api', 
    branch: 'main'
  }],
})
```

### pnpm and hard links

pnpm stores packages in a global content-addressable store and uses hard links inside `node_modules`. When `deploy:builder:release` copies the builder output into the release with `cp --link`, hard links are preserved — the copy is instant and disk-efficient regardless of `node_modules` size.
