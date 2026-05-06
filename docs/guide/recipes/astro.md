---
description: Build an Astro application locally and upload the generated artifacts with the Catapult astro recipe.
---

# `recipes/astro`

[View source on GitHub](https://github.com/catapultjs/deploy/blob/main/recipes/astro.ts)

```typescript
import '@catapultjs/deploy/recipes/astro'
```

**Tasks**

| Task                 | Inserted             | Description |
| -------------------- | -------------------- | ----------- |
| `deploy:build`       | before `deploy:lock` | Runs `astro build --mode <astro_mode>` on the local machine |
| `deploy:update_code` | —                    | Overrides the built-in task and uploads the generated directory to `releases/<release>` via SCP |

**Configuration**

| Key           | Type                              | Default        | Description |
| ------------- | --------------------------------- | -------------- | ----------- |
| `astro_mode`  | `string \| Record<string, string>` | `'production'` | Astro build mode. Can be set globally or per host |
| `source_path` | `string`                          | `'./dist'`     | Directory uploaded after the local build |

Use a single mode for all hosts:

```typescript
import { defineConfig, set } from '@catapultjs/deploy'
import '@catapultjs/deploy/recipes/astro'

set('astro_mode', 'production')
set('source_path', './dist')

export default defineConfig({
  hosts: [
    {
      name: 'production',
      ssh: 'deploy@example.com',
      deployPath: '/home/deploy/myapp',
    },
  ],
})
```

Or define a different mode per host:

```typescript
set('astro_mode', {
  production: 'production',
  staging: 'staging',
})
```
