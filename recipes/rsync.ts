import { $ } from 'execa'
import type {} from '../src/types.ts'
import { task, get, getContext, remove } from '../index.ts'
import { rsyncSshFlag, resolveSshArgs } from '../src/utils.ts'

remove('deploy:check_branch')

declare module '../src/types.ts' {
  interface TaskRegistry {
    'deploy:update_code': true
  }
}

task('deploy:update_code', async () => {
  const { host, paths } = getContext()
  const [target] = resolveSshArgs(host)
  const args: string[] = ['-az', '-e', rsyncSshFlag(host)]
  for (const pattern of get<string[]>('rsync_excludes', [])) {
    args.push(`--exclude=${pattern}`)
  }
  await $`rsync ${args} ./ ${target}:${paths.release}/`
})
