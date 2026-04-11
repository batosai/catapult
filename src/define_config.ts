import type { Config } from './types.ts'
import { Context } from './context.ts'
import { detectPackageManager } from './utils.ts'
import { remove, getPipeline } from './pipeline.ts'
import './defaults.ts'

const initialConfigValues = {
  keepReleases: 5,
}

export function defineConfig(config: Config): () => Promise<void> {
  return async () => {
    const pm = await detectPackageManager()
    const release = new Date().toISOString().replace(/[:.]/g, '-')
    const initial = { packageManager: pm, ...initialConfigValues }
    Context.set({
      config: { ...initial, ...config },
      release,
      hooks: config.hooks ?? {},
    })

    const hasHealthcheck = config.hosts.some((h) => h.healthcheck?.url)
    if (!hasHealthcheck && getPipeline().includes('deploy:healthcheck')) {
      remove('deploy:healthcheck')
    }
  }
}
