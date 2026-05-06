import type {} from '../src/types.ts'
import { task, desc, cd, run, after, before, bin, get, set } from '../index.ts'
import { linkSharedPaths } from '../src/actions.ts'

declare module '../src/types.ts' {
  interface TaskRegistry {
    'ace:migration:run': true
    'ace:migration:rollback': true
    'ace:migration:status': true
    'ace:list:routes': true
  }
}

set('writable_dirs', ['storage', 'logs', 'tmp'])
set('shared_dirs', ['storage', 'logs'])
set('shared_files', ['.env'])
set('adonisjs_path', '')

const ace =
  (command: string, options: string[] = []) =>
  () => {
    const adonisjsPath = get<string>('adonisjs_path')
    cd(`{{release_path}}/${adonisjsPath}`)
    run(`${bin('node')} ace ${command} ${options.join(' ')}`)
  }

desc('Builds the AdonisJS application')
task('deploy:build', async () => {
  const adonisjsPath = get<string>('adonisjs_path')
  cd(`{{release_path}}/${adonisjsPath}`)
  run(`${bin('node')} ace build`)
  run(`mkdir ./build/tmp`)

  linkSharedPaths(`{{release_path}}/${adonisjsPath}/build`)
})

// desc('Builds the AdonisJS application locally')
// task('adonisjs:build', async () => {
//   const adonisjsPath = get<string>('adonisjs_path')
//   const buildOutput = get<string>('build_output')
//   const lockFile = await getLockFileName(adonisjsPath)
//   await local('node ace build', { cwd: adonisjsPath })
//   await local(`cp package.json ./${buildOutput}`, { cwd: adonisjsPath })
//   await local(`cp ${lockFile} ./${buildOutput}`, { cwd: adonisjsPath })
//   await local(`mkdir ./${buildOutput}/tmp`, { cwd: adonisjsPath })
// })

desc('Runs database migrations')
task('ace:migration:run', ace('migration:run', ['--force']))

desc('Rolls back database migrations')
task('ace:migration:rollback', ace('migration:rollback'))

desc('Shows the status of database migrations')
task('ace:migration:status', ace('migration:status'))

desc('Lists all routes')
task('ace:list:routes', ace('list:routes'))

after('deploy:update_code', 'deploy:install')
after('deploy:shared', 'deploy:build')
before('deploy:publish', 'ace:migration:run')
