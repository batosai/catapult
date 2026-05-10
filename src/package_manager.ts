import { bin } from './task.ts'
import { Context } from './context.ts'
import { PackageManager } from './enums.ts'

function getManager(): PackageManager {
  return Context.get().config.packageManager ?? PackageManager.NPM
}

/** Returns the current package manager binary (npm, pnpm, yarn, bun). */
export function pm(): string {
  return bin(getManager())
}

/** Returns the install command with frozen lockfile. */
export function pmInstall(): string {
  const manager = getManager()
  if (manager === 'pnpm') return `${pm()} install --frozen-lockfile`
  if (manager === 'yarn') return `${pm()} install --frozen-lockfile`
  return `${pm()} ci`
}

/** Returns the production-only install command. */
export function pmInstallProd(): string {
  const manager = getManager()
  if (manager === 'pnpm') return `${pm()} install --frozen-lockfile --prod`
  if (manager === 'yarn') return `${pm()} install --frozen-lockfile --production`
  return `${pm()} ci --omit=dev`
}

/** Runs a package binary using the current package manager. */
export function pmExec(command: string): string {
  const manager = getManager()
  if (manager === PackageManager.BUN) return `${pm()} x ${command}`
  if (manager === PackageManager.NPM) return `${pm()} exec -- ${command}`
  return `${pm()} exec ${command}`
}
