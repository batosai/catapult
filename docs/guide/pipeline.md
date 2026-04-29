---
description: Understand the Catapult deployment pipeline — the ordered sequence of SSH tasks that runs on every deploy, and how to customise it.
---

# Pipeline

:::warning Alpha
`@catapultjs/deploy` is currently in alpha. Its API may change between minor releases until it reaches a stable version. Pin the package version in your `package.json` to avoid unexpected breaking changes during updates.
:::

The pipeline is the ordered sequence of tasks executed on each server during a deployment.

## Default pipeline

| Task                  | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `deploy:lock`         | Creates a lock file to prevent concurrent deployments              |
| `deploy:release`      | Creates the release directory                                      |
| `deploy:update_code`  | Transfers code to the server (overridden by recipe)                |
| `deploy:shared`       | Symlinks `shared_dirs` and `shared_files` into the release         |
| `deploy:publish`      | Switches the `current` symlink to the new release                  |
| `deploy:log_revision` | Records the deployment as JSON in `.catapult/revisions.log`        |
| `deploy:healthcheck`  | Checks that the application is responding                          |
| `deploy:unlock`       | Removes the lock file (also called on failure)                     |
| `deploy:cleanup`      | Removes old releases                                               |

`deploy:builder:shared` and `deploy:builder:release` are automatically inserted when `strategy` is `Strategy.REMOTE`.

`deploy:healthcheck` is automatically removed if no host defines a `healthcheck`.

For the complete pipeline per strategy, see [Deployment Modes](/guide/deployment-modes).

## Available tasks (not in pipeline by default)

::: v-pre
These tasks are registered but not inserted into the pipeline. They run in `{{builder_path}}`, which is strategy-aware — `.catapult/builder` for `Strategy.REMOTE`, the release directory for `Strategy.LOCAL`. Add them manually or override their implementation.

| Task              | Default implementation                          | Description                              |
| ----------------- | ----------------------------------------------- | ---------------------------------------- |
| `deploy:install`  | `pmInstall()` in `{{builder_path}}`             | Installs dependencies                    |
| `deploy:build`    | `pm() run build` in `{{builder_path}}`          | Builds the application                   |
:::

```typescript
import { after } from '@catapultjs/deploy'

after('deploy:update_code', 'deploy:install')
after('deploy:install', 'deploy:build')
```

Override the implementation if needed:

```typescript
import { task, cd, run } from '@catapultjs/deploy'

task('deploy:build', () => {
  cd('{{builder_path}}')
  run('node ace build')
})
```

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

if (inPipeline('deploy:builder:release')) {
  after('deploy:builder:release', 'my:task')
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
| `{{builder_path}}` | `/base/.catapult/builder` when `Strategy.REMOTE`, otherwise `/base/releases/<release>` |
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
