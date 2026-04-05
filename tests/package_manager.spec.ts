import { test } from '@japa/runner'
import { set } from '../src/store.ts'
import { pm, pmInstall, pmInstallProd } from '../src/package_manager.ts'

test.group('package_manager', (group) => {
  group.each.teardown(() => set('package_manager', 'npm'))

  test('pm() returns npm by default', ({ assert }) => {
    set('package_manager', 'npm')
    assert.equal(pm(), 'npm')
  })

  test('pm() returns pnpm when set', ({ assert }) => {
    set('package_manager', 'pnpm')
    assert.equal(pm(), 'pnpm')
  })

  test('pm() returns yarn when set', ({ assert }) => {
    set('package_manager', 'yarn')
    assert.equal(pm(), 'yarn')
  })

  test('pmInstall() returns npm ci for npm', ({ assert }) => {
    set('package_manager', 'npm')
    assert.equal(pmInstall(), 'npm ci')
  })

  test('pmInstall() returns frozen lockfile command for pnpm', ({ assert }) => {
    set('package_manager', 'pnpm')
    assert.equal(pmInstall(), 'pnpm install --frozen-lockfile')
  })

  test('pmInstall() returns frozen lockfile command for yarn', ({ assert }) => {
    set('package_manager', 'yarn')
    assert.equal(pmInstall(), 'yarn install --frozen-lockfile')
  })

  test('pmInstallProd() returns npm install --omit=dev for npm', ({ assert }) => {
    set('package_manager', 'npm')
    assert.equal(pmInstallProd(), 'npm install --omit=dev')
  })

  test('pmInstallProd() returns pnpm install --prod for pnpm', ({ assert }) => {
    set('package_manager', 'pnpm')
    assert.equal(pmInstallProd(), 'pnpm install --prod')
  })

  test('pmInstallProd() returns yarn install --production for yarn', ({ assert }) => {
    set('package_manager', 'yarn')
    assert.equal(pmInstallProd(), 'yarn install --production')
  })
})
