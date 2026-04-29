---
description: Deploy an AdonisJS application with the Catapult adonisjs recipe.
---

# `recipes/adonisjs`

[View source on GitHub](https://github.com/catapultjs/deploy/blob/main/recipes/adonisjs.ts)

```typescript
import '@catapultjs/deploy/recipes/adonisjs'
```

**Tasks**

::: v-pre
| Task                      | Strategy        | Inserted                          | Description                                        |
| ------------------------- | --------------- | --------------------------------- | -------------------------------------------------- |
| `adonisjs:builder:install`| `REMOTE`        | after `deploy:update_code`        | Installs all dependencies in the builder           |
| `adonisjs:builder:test`   | `REMOTE`        | after `adonisjs:builder:install`  | Runs `node ace test` in the builder                |
| `adonisjs:builder:build`  | `REMOTE`        | after `deploy:builder:shared`     | Runs `node ace build` in the builder               |
| `adonisjs:install`        | both            | after `deploy:builder:release` / after `deploy:shared` | Installs production-only dependencies in the release |
| `adonisjs:test`           | `LOCAL`         | before `adonisjs:build`           | Runs `node ace test` locally                       |
| `adonisjs:build`          | `LOCAL`         | before `deploy:update_code`       | Runs `node ace build` locally                      |
| `adonisjs:migrate`        | both            | before `deploy:publish`           | Runs `node ace migration:run --force`              |
| `adonisjs:shared`         | —               | not inserted (manual)             | Symlinks shared dirs/files into the build output directory within the release |
:::

To disable tests: `remove('adonisjs:builder:test')` or `remove('adonisjs:test')`.

**Configuration**

| Key             | Type       | Default                      | Description                                                 |
| --------------- | ---------- | ---------------------------- | ----------------------------------------------------------- |
| `writable_dirs` | `string[]` | `['storage', 'logs', 'tmp']` | Directories created in `shared/` during `cata deploy:setup` |
| `shared_dirs`   | `string[]` | `['storage', 'logs']`        | Directories symlinked from `shared/` into each release      |
| `shared_files`  | `string[]` | `['.env']`                   | Files symlinked from `shared/` into each release            |
| `adonisjs_path` | `string`   | `'./'`                       | Sub-path to the AdonisJS app within the repository          |

```typescript
import { set } from '@catapultjs/deploy'

set('shared_files', ['.env', '.env.production'])

import '@catapultjs/deploy/recipes/adonisjs'
```
