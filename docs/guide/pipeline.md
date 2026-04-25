---
description: Understand the Catapult deployment pipeline — the ordered sequence of SSH tasks that runs on every deploy, and how to customise it.
---

# Pipeline

:::warning Alpha
`@catapultjs/deploy` is currently in alpha. Its API may change between minor releases until it reaches a stable version. Pin the package version in your `package.json` to avoid unexpected breaking changes during updates.
:::

The pipeline is the ordered sequence of tasks executed on each server during a deployment.

## Default pipeline

```
deploy:lock → deploy:release → deploy:update_code → deploy:build:shared → deploy:build:copy → deploy:shared → deploy:publish → deploy:log_revision → deploy:healthcheck → deploy:unlock → deploy:cleanup
```

| Task                  | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `deploy:lock`         | Creates a lock file to prevent concurrent deployments              |
| `deploy:release`      | Creates the release directory                                      |
| `deploy:update_code`  | Transfers code to the server (overridden by recipe)                |
| `deploy:build:shared` | Symlinks `shared_dirs` and `shared_files` into the build directory |
| `deploy:build:copy`   | Copies build output from the build directory into the release      |
| `deploy:shared`       | Symlinks `shared_dirs` and `shared_files` into the release         |
| `deploy:publish`      | Switches the `current` symlink to the new release                  |
| `deploy:log_revision` | Records the deployment as JSON in `.catapult/revisions.log`        |
| `deploy:healthcheck`  | Checks that the application is responding                          |
| `deploy:unlock`       | Removes the lock file (also called on failure)                     |
| `deploy:cleanup`      | Removes old releases                                               |

`deploy:build:shared` and `deploy:build:copy` are automatically removed from the pipeline when `strategy` is not `Strategy.REMOTE`.

`deploy:healthcheck` is automatically removed from the pipeline if no host defines a `healthcheck`.

## Strategies

The `strategy` option controls where the install and build steps run. It is set in `defineConfig`:

```typescript
import { Strategy } from '@catapultjs/deploy/enums'

export default defineConfig({
  strategy: Strategy.LOCAL, // default
})
```

### `Strategy.INLINE`

Everything happens directly in the release directory on the server. There is no intermediate build step.

```
deploy:update_code   → code cloned into releases/<release>
deploy:shared        → shared dirs/files symlinked into the release
[install & build]    → runs inside the release directory
deploy:publish       → current → releases/<release>
```

Use this when your application can be installed and run directly on the server without a separate build step (e.g. a Node.js app without a frontend build, or one that builds on the fly).

### `Strategy.REMOTE`

The build runs on the server in a dedicated cache directory (`.catapult/builder`), then the output is copied into the release. This keeps the release clean and avoids installing dev dependencies in production.

```
deploy:update_code    → code cloned into .catapult/builder
deploy:build:shared   → shared dirs/files symlinked into the builder
[install & build]     → runs inside .catapult/builder
deploy:build:copy     → build output copied into releases/<release>
deploy:shared         → shared dirs/files symlinked into the release
[install:production]  → production-only deps installed in the release
deploy:publish        → current → releases/<release>
```

Use this when you want to build on the server but keep dev dependencies out of the release (e.g. TypeScript compilation, frontend bundling).

### `Strategy.LOCAL` _(default)_

The build runs on the local machine, and the output is uploaded to the release directory via SCP using `upload()`. The server receives only the built artifacts — no compiler, no dev dependencies on the server.

```
[install & build]    → runs locally
deploy:update_code   → built output uploaded via SCP into releases/<release>
deploy:shared        → shared dirs/files symlinked into the release
deploy:publish       → current → releases/<release>
```

The source directory to upload is configured via the `source_path` store key (default: `./build`):

```typescript
import { set } from '@catapultjs/deploy'

set('source_path', './dist')
```

Use this when your build environment requires tools or credentials not available on the server, or when you want to keep the server as lean as possible.

For a complete view of each strategy's pipeline with all tasks in order, see [Deployment Modes](/guide/deployment-modes).

## Adding a task

Use `after()` or `before()` to insert a task relative to an existing one:

```typescript
import { task, cd, run, after, before } from '@catapultjs/deploy'

task('cache:clear', () => {
  cd('{{current_path}}')
  run('node ace cache:clear')
})

after('deploy:publish', 'cache:clear')
before('deploy:cleanup', 'cache:clear')
```

## Removing a task

```typescript
import { remove } from '@catapultjs/deploy'

remove('deploy:healthcheck')
```

## Checking if a task is in the pipeline

Use `inPipeline()` to conditionally insert a task depending on the active strategy:

```typescript
import { inPipeline, after } from '@catapultjs/deploy'

if (inPipeline('deploy:build:copy')) {
  after('deploy:build:copy', 'my:task')
} else {
  after('deploy:shared', 'my:task')
}
```

## Replacing the entire pipeline

```typescript
import { setPipeline } from '@catapultjs/deploy'

setPipeline([
  'deploy:release',
  'deploy:update_code',
  'deploy:shared',
  'deploy:publish',
  'deploy:unlock',
  'deploy:cleanup',
])
```

## Overriding a task

Redefining a task replaces its implementation. Place it before `defineConfig`:

```typescript
import { defineConfig, task, cd, run } from '@catapultjs/deploy'

task('deploy:update_code', () => {
  cd('{{release_path}}')
  run('rsync ...')
})

export default defineConfig({ ... })
```

## Async task

For operations that require more than SSH commands, use an async function and destructure the `TaskContext` parameter:

```typescript
import { type TaskContext, task, after } from '@catapultjs/deploy'

task('notify', async ({ release }: TaskContext) => {
  await fetch(process.env.SLACK_WEBHOOK!, {
    method: 'POST',
    body: JSON.stringify({ text: `Deployed ${release}` }),
  })
})

after('deploy:healthcheck', 'notify')
```

## Running a task manually

Any registered task can be run directly from the terminal:

```bash
npx cata task deploy:update_code
npx cata task cache:clear --host staging
```

## Template variables

Available in `cd()` and `run()`:

::: v-pre
| Variable | Value |
| ------------------- | ---------------------------------------------- |
| `{{release_path}}` | `/base/releases/<release>` |
| `{{current_path}}` | `/base/current` |
| `{{shared_path}}` | `/base/shared` |
| `{{releases_path}}` | `/base/releases` |
| `{{builder_path}}` | `/base/.catapult/builder` |
| `{{base_path}}` | `/base` |
| `{{release}}` | Release name (e.g. `2024-01-15T10-30-00-000Z`) |
:::

Where `/base` is the `deployPath` defined on the host.

```typescript
import { task, cd, run } from '@catapultjs/deploy'

task('my:task', () => {
  cd('{{release_path}}')
  run('cp {{shared_path}}/.env {{release_path}}/.env')
  run('echo "Release: {{release}}"')
})
```
