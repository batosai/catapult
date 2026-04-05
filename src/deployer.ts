import type { Host, DeployContext, Hooks, HookContext } from './types.ts'
import { q, getPaths, ssh, blue, gray, elapsed } from './utils.ts'
import { runTask } from './task.ts'
import { get } from './store.ts'
import { getPipeline } from './pipeline.ts'

// ---------------------------------------------------------------------------
// Hook runner
// ---------------------------------------------------------------------------

async function runHook(
  ctx: DeployContext,
  name: keyof Hooks,
  context: HookContext = {}
): Promise<void> {
  if (!ctx.hooks[name]) return
  console.log(`==> hook: ${name}`)
  await ctx.hooks[name]!(context)
}

// ---------------------------------------------------------------------------
// Host operations
// ---------------------------------------------------------------------------

export async function setupHost(ctx: DeployContext, host: Host): Promise<void> {
  const paths = getPaths(host.deployPath, ctx.release)

  console.log(`==> ${blue(`[${host.name}]`)} setup directories`)

  const dirs: string[] = get('writable_dirs', [])
  const files: string[] = get('shared_files', [])

  const mkdirs = dirs.map((dir) => `mkdir -p ${q(paths.shared + '/' + dir)}`).join('\n    ')
  const mkfiles = files
    .map(
      (file) =>
        `if [ ! -f ${q(paths.shared + '/' + file)} ]; then touch ${q(paths.shared + '/' + file)}; fi`
    )
    .join('\n    ')

  await ssh(
    host,
    `
    set -e
    mkdir -p ${q(paths.base)}
    mkdir -p ${q(paths.releases)}
    mkdir -p ${q(paths.shared)}
    ${mkdirs}
    ${mkfiles}
  `
  )
}

export async function getCurrentRelease(ctx: DeployContext, host: Host): Promise<string | null> {
  const paths = getPaths(host.deployPath, ctx.release)

  try {
    const { stdout } = await ssh(
      host,
      `
      set -e
      if [ -L ${q(paths.current)} ]; then
        basename "$(readlink ${q(paths.current)})"
      fi
    `
    )
    return stdout.trim() || null
  } catch {
    return null
  }
}

async function getPreviousReleaseName(ctx: DeployContext, host: Host): Promise<string | null> {
  const paths = getPaths(host.deployPath, ctx.release)
  const currentRelease = await getCurrentRelease(ctx, host)

  let stdout = ''
  try {
    ;({ stdout } = await ssh(
      host,
      `
      set -e
      cd ${q(paths.releases)}
      ls -1dt */ 2>/dev/null
    `
    ))
  } catch {
    return null
  }

  const releases = stdout
    .split('\n')
    .map((line) => line.trim().replace(/\/$/, ''))
    .filter(Boolean)

  if (!currentRelease) {
    return releases[1] || releases[0] || null
  }

  return releases.find((name) => name !== currentRelease) ?? null
}

export async function rollbackHost(ctx: DeployContext, host: Host): Promise<void> {
  const paths = getPaths(host.deployPath, ctx.release)
  const previous = await getPreviousReleaseName(ctx, host)

  if (!previous) {
    throw new Error(`[${host.name}] no previous release available`)
  }

  console.log(`==> ${blue(`[${host.name}]`)} rollback to ${previous}`)

  await ssh(host, `set -e\nln -sfn ${q(paths.releases + '/' + previous)} ${q(paths.current)}`)

  if (getPipeline().includes('pm2:start')) {
    await runTask('pm2:start', ctx, host)
  }

  if (getPipeline().includes('deploy:healthcheck')) {
    await runTask('deploy:healthcheck', ctx, host)
  }
}

export async function deployHost(ctx: DeployContext, host: Host): Promise<void> {
  let published = false
  const deployStart = Date.now()

  await runHook(ctx, 'beforeHostDeploy', { host })

  try {
    for (const taskName of getPipeline()) {
      console.log(
        `${gray(elapsed(Date.now() - deployStart))} ${blue(`[${host.name}]`)} ${taskName}`
      )
      await runTask(taskName, ctx, host)
      if (taskName === 'deploy:publish') published = true
    }

    console.log(
      `✅ ${blue(`[${host.name}]`)} deploy OK -> ${ctx.release} ${gray(`(${elapsed(Date.now() - deployStart)})`)}`
    )
  } catch (error) {
    console.error(`❌ ${blue(`[${host.name}]`)} deploy failed: ${(error as Error).message}`)

    if (published) {
      try {
        await rollbackHost(ctx, host)
        console.log(`↩️ ${blue(`[${host.name}]`)} auto rollback OK`)
      } catch (rollbackError) {
        console.error(
          `💥 ${blue(`[${host.name}]`)} auto rollback failed: ${(rollbackError as Error).message}`
        )
      }
    }

    await runTask('deploy:unlock', ctx, host)
    throw error
  } finally {
    await runHook(ctx, 'afterHostDeploy', { host })
  }
}
