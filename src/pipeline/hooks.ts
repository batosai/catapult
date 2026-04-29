import type { Host, DeployContext, Config } from '../types.ts'
import type { CatapultLogger } from '../logger.ts'

export type LifecycleHook = (
  ctx: DeployContext,
  host: Host,
  logger: CatapultLogger
) => Promise<void> | void

export type ConfigHook = (config: Config) => void

export class PipelineHookStore {
  #setupHooks: LifecycleHook[] = []
  #statusHooks: LifecycleHook[] = []
  #configHooks: ConfigHook[] = []

  addSetup(fn: LifecycleHook): void {
    this.#setupHooks.push(fn)
  }

  getSetup(): LifecycleHook[] {
    return [...this.#setupHooks]
  }

  addStatus(fn: LifecycleHook): void {
    this.#statusHooks.push(fn)
  }

  getStatus(): LifecycleHook[] {
    return [...this.#statusHooks]
  }

  addConfig(fn: ConfigHook): void {
    this.#configHooks.push(fn)
  }

  runConfig(config: Config): void {
    for (const fn of this.#configHooks) fn(config)
  }
}

export const hooks = new PipelineHookStore()
