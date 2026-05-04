---
description: Transfer files to the server via rsync with the Catapult rsync recipe.
---

# `recipes/rsync`

[View source on GitHub](https://github.com/catapultjs/deploy/blob/main/recipes/rsync.ts)

```typescript
import '@catapultjs/deploy/recipes/rsync'
```

**Tasks**

| Task                 | Inserted                                            | Description                                                                             |
| -------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `deploy:update_code` | —                                                   | Overrides the built-in task to transfer files via rsync                                 |

The destination depends on the active strategy:

| Strategy | Destination |
| --- | --- |
| `Strategy.REMOTE` | `.catapult/builder` — source is transferred into the build cache, then copied to the release after build |
| `Strategy.LOCAL` | `releases/<release>` — set `rsync_source_path` to your build output directory (e.g. `./dist`); the server receives only built artifacts |

**Configuration**

| Key                 | Type       | Default | Description                                                                                                              |
| ------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `rsync_source_path` | `string`   | `./`    | Local source directory — trailing slash is added automatically so only the contents are transferred, not the directory itself |
| `rsync_excludes`    | `string[]` | `[]`    | Patterns passed to `--exclude`                                                                                           |

**`Strategy.REMOTE`** — transfer source into the builder cache, build there, copy output to the release:

```typescript
import { defineConfig, set } from '@catapultjs/deploy'
import { Strategy } from '@catapultjs/deploy/enums'
import '@catapultjs/deploy/recipes/rsync'

set('rsync_excludes', ['.git', 'node_modules', '.env'])

export default defineConfig({
  strategy: Strategy.REMOTE,
})
```

**`Strategy.LOCAL`** — build locally, rsync only the build output to the release:

```typescript
import { defineConfig, set } from '@catapultjs/deploy'
import { Strategy } from '@catapultjs/deploy/enums'
import '@catapultjs/deploy/recipes/rsync'

set('rsync_source_path', './dist')
set('rsync_excludes', ['.env'])

export default defineConfig({
  strategy: Strategy.LOCAL,
})
```
