import type {} from '../src/types.ts'
import { $ } from 'execa'
import { Verbose } from '../src/enums.ts'
import { type TaskContext, task, desc, get, isVerbose } from '../index.ts'
import { rsyncSshFlag, resolveSshArgs } from '../src/utils.ts'

desc('Transfers files to the release or builder directory via rsync')
task('deploy:update_code', async ({ host, paths, logger }: TaskContext) => {
  const [target] = resolveSshArgs(host)
  const source = get('rsync_source_path', get('source_path', './')).replace(/\/?$/, '/')
  const dest = paths.release
  const args: string[] = ['-az', '--delete', '-e', rsyncSshFlag(host)]
  for (const pattern of get<string[]>('rsync_excludes', [])) {
    args.push(`--exclude=${pattern}`)
  }
  if (isVerbose(Verbose.TRACE)) logger.cmd(`rsync ${args.join(' ')} ${source} ${target}:${dest}/`)
  await $`rsync ${args} ${source} ${target}:${dest}/`
})
