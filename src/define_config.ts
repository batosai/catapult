import type { Config } from './types.ts'
import { Strategy, Verbose } from './enums.ts'
import { Context } from './context.ts'
import { detectPackageManager } from './utils.ts'
import { remove, getPipeline, inPipeline, isPipelineLocked, hooks } from './pipeline.ts'
import './defaults.ts'

const initialConfigValues = {
  keepReleases: 5,
  verbose: Verbose.NORMAL,
  strategy: Strategy.LOCAL,
}

export function defineConfig(config: Config): () => Promise<void> {
  const resolved: Config = { ...initialConfigValues, ...config }

  const strategy = resolved.strategy!
  if (strategy !== Strategy.REMOTE) {
    if (inPipeline('deploy:builder:release')) remove('deploy:builder:release')
    if (inPipeline('deploy:builder:shared')) remove('deploy:builder:shared')
  }

  if (!isPipelineLocked()) hooks.runConfig(resolved)

  return async () => {
    const pm = await detectPackageManager()
    const release = new Date().toISOString().replace(/[:.]/g, '-')
    Context.set({
      config: { packageManager: pm, ...resolved },
      release,
      hooks: config.hooks ?? {},
    })

    const hasHealthcheck = config.hosts.some((h) => h.healthcheck?.url)
    if (!hasHealthcheck && getPipeline().includes('deploy:healthcheck')) {
      remove('deploy:healthcheck')
    }
  }
}
