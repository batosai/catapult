import { $ } from 'execa'
import type {} from '../src/types.ts'
import { task, get, getContext, remove } from '../index.ts'
import { resolveSshArgs } from '../src/utils.ts'

remove('deploy:check_branch')

declare module '../src/types.ts' {
  interface TaskRegistry {
    'deploy:upload': true
  }
}

task('deploy:upload', async () => {
  const { host, paths } = getContext()
  const sshConfig = typeof host.ssh === 'object' ? host.ssh : null
  const target = sshConfig ? `${sshConfig.user}@${sshConfig.host}` : (host.ssh as string)
  const args: string[] = ['-az']
  if (sshConfig?.port) {
    args.push('-e', `ssh -p ${sshConfig.port}`)
  }
  for (const pattern of get<string[]>('rsync_excludes', [])) {
    args.push(`--exclude=${pattern}`)
  }
  await $`rsync ${args} ./ ${target}:${paths.release}/`
})
