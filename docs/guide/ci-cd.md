---
description: Deploy with Catapult from GitHub Actions using the official deploy-action.
---

# CI/CD

Use the official [catapultjs/deploy-action](https://github.com/catapultjs/deploy-action) to run `@catapultjs/deploy` inside GitHub Actions.

The action handles SSH setup, detects the package manager from the repository lockfile, and executes the requested Catapult command.

For a complete working example, see [batosai/demo-adonisjs-deployer](https://github.com/batosai/demo-adonisjs-deployer) and its [GitHub Actions runs](https://github.com/batosai/demo-adonisjs-deployer/actions).

## Minimal workflow

Use this workflow when the deployment is handled remotely and your `deploy.ts` file does not depend on local project packages.

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: catapultjs/deploy-action@v1
        with:
          private-key: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
          insecure-ignore-host-key: true
```

## Workflow with local dependencies

Add a runtime setup and install dependencies when your Catapult config or deployment tasks import local packages.

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: catapultjs/deploy-action@v1
        with:
          command: deploy
          config: deploy.ts
          private-key: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
          known-hosts: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
          version: latest
          args: |
            -vvv
```

If the repository uses another package manager, replace `npm ci` with the matching install command:

- `pnpm install --frozen-lockfile`
- `yarn install --immutable`
- `bun install --frozen-lockfile`

## Store SSH and host config in secrets

Keep sensitive values out of the repository by reading them from environment variables in `deploy.ts`:

```ts
import { defineConfig } from '@catapultjs/deploy'
import '@catapultjs/deploy/recipes/git'

const ssh = process.env.DEPLOY_SSH
const deployPath = process.env.DEPLOY_PATH

if (!ssh) throw new Error('Missing DEPLOY_SSH')
if (!deployPath) throw new Error('Missing DEPLOY_PATH')

export default defineConfig({
  hosts: [
    {
      name: 'production',
      ssh,
      deployPath,
      branch: process.env.DEPLOY_BRANCH || 'main',
    },
  ],
})
```

Then pass the values from GitHub Actions:

```yaml
- uses: catapultjs/deploy-action@v1
  with:
    command: deploy
    config: deploy.ts
    private-key: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
    known-hosts: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
  env:
    DEPLOY_SSH: ${{ secrets.DEPLOY_SSH }}
    DEPLOY_PATH: ${{ vars.DEPLOY_PATH }}
    DEPLOY_BRANCH: main
```

Use GitHub **Secrets** for sensitive values such as the SSH private key, and **Variables** for non-sensitive values such as the deploy path.

## SSH setup

The action prepares `~/.ssh` before running Catapult.

| Input | Required | Description |
| --- | --- | --- |
| `private-key` | Yes | SSH private key added to `ssh-agent` |
| `known-hosts` | Recommended | Content written to `~/.ssh/known_hosts` |
| `ssh-config` | No | Content written to `~/.ssh/config` |
| `insecure-ignore-host-key` | No | Disables strict host key checking when `known-hosts` is not provided |

Example with a custom SSH config:

```yaml
- uses: catapultjs/deploy-action@v1
  with:
    command: deploy
    private-key: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
    known-hosts: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
    ssh-config: |
      Host github.com
        User git
        IdentityAgent ${{ env.SSH_AUTH_SOCK }}
```

## Main action inputs

| Name | Default | Description |
| --- | --- | --- |
| `command` | `deploy` | Catapult command to run |
| `config` | — | Path to the deploy config file |
| `args` | — | Extra CLI args, one per line |
| `package-manager` | auto-detected | Package manager executable used to run Catapult |
| `version` | `latest` | Version of `@catapultjs/deploy` to execute |
| `working-directory` | `.` | Working directory relative to the repository root |

For the complete input list and updates, see the [deploy-action repository](https://github.com/catapultjs/deploy-action).
