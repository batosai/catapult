import { get } from './store.ts'
import { run } from './task.ts'

export function linkSharedPaths(targetPath: string): void {
  const dirs: string[] = get('shared_dirs', [])
  const files: string[] = get('shared_files', [])

  for (const dir of dirs) {
    const d = dir.replace(/^\//, '')
    run(`rm -rf ${targetPath}/${d}`)
    run(`ln -sfn {{shared_path}}/${d} ${targetPath}/${d}`)
  }

  for (const file of files) {
    const f = file.replace(/^\//, '')
    run(`rm -f ${targetPath}/${f}`)
    run(`ln -sfn {{shared_path}}/${f} ${targetPath}/${f}`)
  }
}
