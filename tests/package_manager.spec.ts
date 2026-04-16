import { test } from '@japa/runner'
import { Context } from '../src/context.ts'
import { pm, pmInstall, pmInstallProd } from '../src/package_manager.ts'
import type { Config } from '../src/types.ts'
import { PackageManager } from '../src/enums.ts'

function setManager(packageManager: Config['packageManager']) {
  Context.set({
    config: { keepReleases: 5, hosts: [], packageManager },
    release: '2024-01-01',
    hooks: {},
  })
}

test.group('package_manager', (group) => {
  group.each.teardown(() => setManager(PackageManager.NPM))

  test('pm() returns npm by default', ({ assert }) => {
    setManager(undefined)
    assert.equal(pm(), 'npm')
  })

  test('pm() returns pnpm when set', ({ assert }) => {
    setManager(PackageManager.PNPM)
    assert.equal(pm(), 'pnpm')
  })

  test('pm() returns yarn when set', ({ assert }) => {
    setManager(PackageManager.YARN)
    assert.equal(pm(), 'yarn')
  })

  test('pmInstall() returns npm ci for npm', ({ assert }) => {
    setManager(PackageManager.NPM)
    assert.equal(pmInstall(), 'npm ci')
  })

  test('pmInstall() returns frozen lockfile command for pnpm', ({ assert }) => {
    setManager(PackageManager.PNPM)
    assert.equal(pmInstall(), 'pnpm install --frozen-lockfile')
  })

  test('pmInstall() returns frozen lockfile command for yarn', ({ assert }) => {
    setManager(PackageManager.YARN)
    assert.equal(pmInstall(), 'yarn install --frozen-lockfile')
  })

  test('pmInstallProd() returns npm ci --omit=dev for npm', ({ assert }) => {
    setManager(PackageManager.NPM)
    assert.equal(pmInstallProd(), 'npm ci --omit=dev')
  })

  test('pmInstallProd() returns pnpm install --frozen-lockfile --prod for pnpm', ({ assert }) => {
    setManager(PackageManager.PNPM)
    assert.equal(pmInstallProd(), 'pnpm install --frozen-lockfile --prod')
  })

  test('pmInstallProd() returns yarn install --frozen-lockfile --production for yarn', ({
    assert,
  }) => {
    setManager(PackageManager.YARN)
    assert.equal(pmInstallProd(), 'yarn install --frozen-lockfile --production')
  })
})
