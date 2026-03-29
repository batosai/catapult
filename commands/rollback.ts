import { getCtx } from '../src/ctx.ts'
import { acquireLock, releaseLock, rollbackHost } from '../src/host.ts'
import { BaseDeployCommand } from '../src/base_command.ts'

export default class Rollback extends BaseDeployCommand {
  static commandName = 'rollback'
  static description = 'Rollback to the previous release'

  async run() {
    const ctx = getCtx()

    const hosts = await this.selectHosts()
    if (!hosts) return

    for (const host of hosts) {
      await acquireLock(ctx, host)
      try {
        await rollbackHost(ctx, host)
      } finally {
        await releaseLock(ctx, host)
      }
    }
    this.logger.action('rollback').succeeded()
  }
}
