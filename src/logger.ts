import { Logger, colors } from '@poppinss/cliui'

const blue = (s: string) => colors.ansi().blue(s)
const gray = (s: string) => colors.ansi().dim(s)
const yellow = (s: string) => colors.ansi().yellow(s)

export class CatapultLogger extends Logger {
  /** ==> message */
  step(message: string): void
  /** ==> [host] message */
  step(host: string, message: string): void
  step(hostOrMessage: string, message?: string): void {
    if (message === undefined) {
      this.log(`==> ${hostOrMessage}`)
    } else {
      this.log(`==> ${blue(`[${hostOrMessage}]`)} ${message}`)
    }
  }

  /** dim(mm:ss) [host] taskName */
  task(elapsed: string, host: string, name: string): void {
    this.log(`${gray(elapsed)} ${blue(`[${host}]`)} ${name}`)
  }

  /** [ success ] [host] message (mm:ss) */
  ok(host: string, message: string, elapsed?: string): void {
    this.success(message, { prefix: host, suffix: elapsed })
  }

  /** [ error ] [host] message */
  fail(host: string, message: string): void {
    this.error(message, { prefix: host })
  }

  /** [ warning ] [host] message */
  rollback(host: string, message: string): void {
    this.warning(message, { prefix: host })
  }

  /** [ error ] [host] message */
  boom(host: string, message: string): void {
    this.error(message, { prefix: host })
  }

  /**     $ command (yellow) */
  cmd(command: string): void {
    this.log(yellow(`    $ ${command}`))
  }
}

export const logger = new CatapultLogger()
