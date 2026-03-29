import { args } from '@adonisjs/ace'
import { getCtx } from '../src/ctx.ts'
import { hasTask, runTask, getTasks } from '../src/task.ts'
import { BaseDeployCommand } from '../src/base_command.ts'

export default class RunTask extends BaseDeployCommand {
  static commandName = 'task'
  static description = 'Run a registered task on servers'

  @args.string({ description: 'Task name to run' })
  declare taskName: string

  async run() {
    const ctx = getCtx()

    if (!hasTask(this.taskName)) {
      this.logger.error(`Unknown task: ${this.taskName}. Available: ${getTasks().join(', ')}`)
      this.exitCode = 1
      return
    }

    const hosts = await this.selectHosts()
    if (!hosts) return

    for (const host of hosts) {
      await runTask(this.taskName, ctx, host)
    }
  }
}
