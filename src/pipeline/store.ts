import type { TaskName } from '../types.ts'

export class PipelineStore {
  #pipeline: string[] = []
  #locked = false

  get(): string[] {
    return [...this.#pipeline]
  }

  init(tasks: TaskName[]): void {
    this.#pipeline = [...tasks]
  }

  set(tasks: TaskName[]): void {
    this.#pipeline = [...tasks]
    this.#locked = true
  }

  isLocked(): boolean {
    return this.#locked
  }

  before(existing: TaskName, newTask: TaskName): void {
    const idx = this.#pipeline.indexOf(existing)
    if (idx === -1) throw new Error(`Task "${existing}" not found in pipeline`)
    this.#pipeline.splice(idx, 0, newTask)
  }

  after(existing: TaskName, newTask: TaskName): void {
    const idx = this.#pipeline.indexOf(existing)
    if (idx === -1) throw new Error(`Task "${existing}" not found in pipeline`)
    this.#pipeline.splice(idx + 1, 0, newTask)
  }

  has(name: TaskName): boolean {
    return this.#pipeline.includes(name)
  }

  remove(name: TaskName): void {
    const idx = this.#pipeline.indexOf(name)
    if (idx === -1) throw new Error(`Task "${name}" not found in pipeline`)
    this.#pipeline.splice(idx, 1)
  }
}
